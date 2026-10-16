#!/usr/bin/env python3
"""
Sync GoalSetting Masterdata Excel → SQLite DB
Source: Esempi/20260507_MBO2026_GoalSetting_Masterdata.xlsx
"""
import openpyxl
import sqlite3
import re
import sys
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
EXCEL_PATH = ROOT / "Esempi" / "20260507_MBO2026_GoalSetting_Masterdata.xlsx"
DB_PATH = ROOT / "data" / "mbo.sqlite"


def backup_db():
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    dst = DB_PATH.parent / f"mbo.sqlite.bak-{ts}"
    shutil.copy2(DB_PATH, dst)
    print(f"[backup] {dst}")


def nkey(s):
    """Normalize objective title for matching."""
    if not s:
        return ""
    s = str(s).upper().strip()
    for rep in ["A BUDGET.", "A BUDGET", "– BUDGET 2026", "- BUDGET 2026"]:
        s = s.replace(rep, "")
    return re.sub(r"\s+", " ", s).strip()


def tipo_cluster(tipo):
    if "Gruppo" in str(tipo):
        return "GRP"
    if "ESG" in str(tipo):
        return "ESG"
    return "IND"


def db_cluster_short(name):
    if "Gruppo" in str(name):
        return "GRP"
    if "ESG" in str(name):
        return "ESG"
    return "IND"


def load_excel():
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)

    # Riepilogo Beneficiari: row0=title, row1=header, row2..=data, last=totale
    ws_r = wb["Riepilogo Beneficiari"]
    rows_r = list(ws_r.iter_rows(values_only=True))
    header_r = rows_r[1]
    beneficiari = [dict(zip(header_r, r)) for r in rows_r[2:-1] if r[0] and r[1]]

    # Dettaglio Obiettivi: row0=title, row1=header, row2..=data
    ws_d = wb["Dettaglio Obiettivi"]
    rows_d = list(ws_d.iter_rows(values_only=True))
    header_d = rows_d[1]
    obiettivi = [dict(zip(header_d, r)) for r in rows_d[2:] if r[1]]

    return beneficiari, obiettivi


def find_user_id(cur, excel_name):
    """Excel format: COGNOME NOME (e.g. 'Vitale Marco' → last='Vitale', first='Marco')"""
    parts = excel_name.split()
    last = parts[0]
    first = " ".join(parts[1:])
    cur.execute("SELECT id FROM users WHERE first_name=? AND last_name=?", (first, last))
    row = cur.fetchone()
    if row:
        return row[0]
    # Fallback: also try old wrong order (handles Di Vita / Lo Campo post-rename)
    cur.execute("SELECT id FROM users WHERE first_name=? AND last_name=?", (last, first))
    row = cur.fetchone()
    if row:
        return row[0]
    # Fallback 2: try full name match regardless of split
    full = " ".join(parts[1:] + [parts[0]])
    cur.execute("SELECT id FROM users WHERE (first_name||' '||last_name)=? OR (last_name||' '||first_name)=?", (excel_name, excel_name))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute("SELECT id FROM users WHERE (first_name||' '||last_name)=?", (full,))
    row = cur.fetchone()
    return row[0] if row else None


def find_obj_dict_id(cur, uid, excel_obj):
    """Find objectives_dictionary.id for a user's objective by title+cluster match."""
    e_norm = nkey(excel_obj["Indicatore"])
    e_cluster = tipo_cluster(excel_obj["Tipo Obiettivo"])

    cur.execute("""
        SELECT od.id, od.title, ic.name, oa.id as asgn_id
        FROM objective_assignments oa
        JOIN objectives o ON oa.objective_id = o.id
        JOIN objectives_dictionary od ON o.dictionary_id = od.id
        JOIN indicator_clusters ic ON od.indicator_cluster_id = ic.id
        WHERE oa.user_id = ?
    """, (uid,))
    rows = cur.fetchall()

    # Exact match
    for r in rows:
        if nkey(r[1]) == e_norm and db_cluster_short(r[2]) == e_cluster:
            return r[0], r[3]  # dict_id, asgn_id

    # Fallback: title match without cluster constraint
    for r in rows:
        if nkey(r[1]) == e_norm:
            return r[0], r[3]

    # Fallback 2: word overlap ≥ 60%
    e_words = set(e_norm.split())
    best = None
    best_score = 0
    for r in rows:
        if db_cluster_short(r[2]) != e_cluster:
            continue
        k_words = set(nkey(r[1]).split())
        overlap = len(e_words & k_words)
        score = overlap / max(len(e_words), len(k_words), 1)
        if score > best_score and score >= 0.5:
            best_score = score
            best = r
    if best:
        return best[0], best[3]

    return None, None


def sync(dry_run=False):
    backup_db()
    beneficiari, obiettivi = load_excel()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Disable FK for bulk updates
    cur.execute("PRAGMA foreign_keys = OFF")

    stats = {
        "users_job_title": 0,
        "users_area": 0,
        "users_name_fixed": 0,
        "obj_dict_title": 0,
        "obj_dict_description": 0,
        "obj_dict_target": 0,
        "obj_dict_notes": 0,
        "obj_dict_fonte": 0,
        "asgn_weight": 0,
        "asgn_premio_max": 0,
        "not_found_user": [],
        "not_found_obj": [],
    }

    # === A. Fix nomi invertiti ===
    name_fixes = [
        ("mbo26-di.vita.alberto", "Alberto", "Di Vita"),
        ("mbo26-lo.campo.alessandro", "Alessandro", "Lo Campo"),
    ]
    for uid, first, last in name_fixes:
        if not dry_run:
            cur.execute("UPDATE users SET first_name=?, last_name=?, updated_at=unixepoch() WHERE id=?",
                        (first, last, uid))
        stats["users_name_fixed"] += cur.rowcount if not dry_run else 1
        print(f"  [fix-name] {uid} → {first} {last}")

    # === A. Update users: job_title + area ===
    for b in beneficiari:
        excel_name = b["Beneficiario"]
        ruolo = b.get("Ruolo") or b.get("Manager")  # header key
        area = b.get("Area")

        # Find by COGNOME NOME format
        uid = find_user_id(cur, excel_name)
        if not uid:
            stats["not_found_user"].append(f"users: {excel_name}")
            continue

        updates = {}
        if ruolo:
            updates["job_title"] = ruolo
        if area:
            updates["area"] = area

        if updates and not dry_run:
            set_clause = ", ".join(f"{k}=?" for k in updates)
            cur.execute(f"UPDATE users SET {set_clause}, updated_at=unixepoch() WHERE id=?",
                        list(updates.values()) + [uid])
        if "job_title" in updates:
            stats["users_job_title"] += 1
        if "area" in updates:
            stats["users_area"] += 1

    print(f"  [users] job_title: {stats['users_job_title']}, area: {stats['users_area']}")

    # === B/C/D/E. Update objectives per user ===
    for eo in obiettivi:
        excel_name = eo["Beneficiario"]
        uid = find_user_id(cur, excel_name)
        if not uid:
            if excel_name not in stats["not_found_user"]:
                stats["not_found_user"].append(f"obiettivi: {excel_name}")
            continue

        dict_id, asgn_id = find_obj_dict_id(cur, uid, eo)
        if not dict_id:
            stats["not_found_obj"].append(f"{excel_name}: {eo['Indicatore']}")
            continue

        # --- objectives_dictionary updates ---
        dict_updates = {}

        # Title (Title Case from Excel)
        new_title = str(eo["Indicatore"]).strip()
        cur.execute("SELECT title FROM objectives_dictionary WHERE id=?", (dict_id,))
        cur_title = (cur.fetchone() or [None])[0] or ""
        if cur_title != new_title:
            dict_updates["title"] = new_title
            stats["obj_dict_title"] += 1

        # Description
        new_desc = (eo.get("Descrizione") or "").strip()
        if new_desc:
            cur.execute("SELECT description FROM objectives_dictionary WHERE id=?", (dict_id,))
            cur_desc = (cur.fetchone() or [None])[0] or ""
            if cur_desc.lower()[:100] != new_desc.lower()[:100]:
                dict_updates["description"] = new_desc
                stats["obj_dict_description"] += 1

        # Target description
        new_target = (eo.get("Target") or "").strip()
        if new_target:
            cur.execute("SELECT target_description FROM objectives_dictionary WHERE id=?", (dict_id,))
            cur_target = (cur.fetchone() or [None])[0] or ""
            if cur_target.lower()[:60] != new_target.lower()[:60]:
                dict_updates["target_description"] = new_target
                stats["obj_dict_target"] += 1

        # Notes
        new_notes = (eo.get("Note") or "").strip()
        if new_notes:
            cur.execute("SELECT notes FROM objectives_dictionary WHERE id=?", (dict_id,))
            cur_notes = (cur.fetchone() or [None])[0] or ""
            if cur_notes != new_notes:
                dict_updates["notes"] = new_notes
                stats["obj_dict_notes"] += 1

        # Data source (Rendicontatore)
        new_fonte = (eo.get("Rendicontatore (Fonte)") or "").strip()
        if new_fonte:
            cur.execute("SELECT data_source FROM objectives_dictionary WHERE id=?", (dict_id,))
            cur_fonte = (cur.fetchone() or [None])[0] or ""
            if cur_fonte != new_fonte:
                dict_updates["data_source"] = new_fonte
                stats["obj_dict_fonte"] += 1

        if dict_updates and not dry_run:
            set_clause = ", ".join(f"{k}=?" for k in dict_updates)
            cur.execute(f"UPDATE objectives_dictionary SET {set_clause}, updated_at=unixepoch() WHERE id=?",
                        list(dict_updates.values()) + [dict_id])

        # --- objective_assignments updates ---
        asgn_updates = {}

        # Weight
        new_weight = int(round(float(eo["Peso"]) * 100))
        cur.execute("SELECT weight FROM objective_assignments WHERE id=?", (asgn_id,))
        cur_weight = (cur.fetchone() or [None])[0]
        if cur_weight != new_weight:
            asgn_updates["weight"] = new_weight
            stats["asgn_weight"] += 1

        # Premio max
        premio_val = eo.get("Premio Max (€)")
        if premio_val is not None:
            new_premio = float(premio_val)
            cur.execute("SELECT premio_max FROM objective_assignments WHERE id=?", (asgn_id,))
            cur_premio = (cur.fetchone() or [None])[0]
            if cur_premio != new_premio:
                asgn_updates["premio_max"] = new_premio
                stats["asgn_premio_max"] += 1

        if asgn_updates and not dry_run:
            set_clause = ", ".join(f"{k}=?" for k in asgn_updates)
            cur.execute(f"UPDATE objective_assignments SET {set_clause}, updated_at=unixepoch() WHERE id=?",
                        list(asgn_updates.values()) + [asgn_id])

    if not dry_run:
        conn.commit()
    conn.close()

    print("\n=== SYNC COMPLETATO ===")
    print(f"  users job_title aggiornati: {stats['users_job_title']}")
    print(f"  users area aggiornati: {stats['users_area']}")
    print(f"  users nomi corretti: {stats['users_name_fixed']}")
    print(f"  obj_dict titoli: {stats['obj_dict_title']}")
    print(f"  obj_dict descrizioni: {stats['obj_dict_description']}")
    print(f"  obj_dict target: {stats['obj_dict_target']}")
    print(f"  obj_dict notes: {stats['obj_dict_notes']}")
    print(f"  obj_dict data_source: {stats['obj_dict_fonte']}")
    print(f"  assignments weight: {stats['asgn_weight']}")
    print(f"  assignments premio_max: {stats['asgn_premio_max']}")

    if stats["not_found_user"]:
        print(f"\n  [WARN] utenti non trovati: {stats['not_found_user']}")
    if stats["not_found_obj"]:
        print(f"\n  [WARN] obiettivi non matchati: {stats['not_found_obj']}")

    if dry_run:
        print("\n  [DRY RUN — nessuna modifica salvata]")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    sync(dry_run=dry_run)
