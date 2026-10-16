# Deploy: frontend su Vercel, backend su Fly.io

```
Browser ──► Vercel (SPA statica, dist/public)
              │  rewrite /api/*
              ▼
            Fly.io, regione fra (Express + SQLite + LibreOffice)
              └─ volume /storage → data/ (mbo.sqlite) + uploads/
```

Il browser parla solo con il dominio Vercel. Vercel inoltra `/api/*` al backend, quindi non serve CORS e il cookie di sessione è first-party.

## 1. Prerequisiti

- Tutte le modifiche sono committate e pushate su GitHub. Vercel e Fly buildano da git, quindi i file non tracciati non arrivano in produzione.
- CLI installate: `flyctl` (`brew install flyctl`) e `vercel` (`npm i -g vercel`).

## 2. Backend su Fly.io

```bash
fly auth login
fly launch --no-deploy --copy-config --region fra   # conferma il nome app, poi aggiorna "app" in fly.toml
fly volumes create hr_storage --region fra --size 3

fly secrets set \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  REQUIRE_PASSWORD=true \
  GEMINI_API_KEY=... \
  SMTP_HOST=... SMTP_PORT=... SMTP_USER=... SMTP_PASS=... SMTP_FROM=...

fly deploy --ha=false     # una sola macchina: SQLite sta sul volume di quella macchina
fly machine list          # deve esserci 1 sola macchina
```

Con un volume vuoto lo schema non viene creato (non esiste `001_initial_schema.sql`). Al primo avvio vanno quindi caricati i dati esistenti.

## 3. Migrazione dati (DB + uploads)

In locale, a server fermo:

```bash
npx tsx scripts/export-for-deploy.ts            # aggiungi --with-jobs per includere uploads/jobs (~140MB)
```

Lo script crea `deploy-export/storage.tar.gz`, che contiene:

- uno snapshot consistente di `mbo.sqlite`, fatto con l'API di backup, che include anche le scritture ancora nel file `-wal`;
- il contenuto di `uploads/`.

Per caricarlo sul volume:

```bash
fly ssh sftp shell        # poi:  put deploy-export/storage.tar.gz /storage/restore.tar.gz
fly machine restart
fly logs                  # atteso: "[entrypoint] restore ..." e "Database found with N tables"
```

Non estrarre il tar a mano mentre il server è in esecuzione: il DB è aperto in WAL e verrebbe corrotto. Il restore lo fa `docker-entrypoint.sh` all'avvio, prima che il DB venga aperto, e poi elimina `restore.tar.gz`.

Poi elimina `deploy-export/`: contiene dati HR.

## 4. Frontend su Vercel

1. In `vercel.json` sostituisci `BACKEND_HOST` con l'host Fly, ad esempio `piattaforma-hr-api.fly.dev`.
2. Importa il repo su Vercel. Build, output e rewrite sono già definiti in `vercel.json`.
3. In Project Settings → Functions → Region scegli `fra1`. Il progetto non ha function, ma così eventuali function future restano in UE.
4. Collega il dominio.

## 5. Verifica

- `https://<dominio-vercel>/` carica la SPA e il login funziona.
- DevTools → Application → Cookies: il cookie di sessione ha il dominio Vercel, con `Secure` e `HttpOnly`.
- Genera una lettera PDF: usa LibreOffice nel container.
- `/favicon.svg` e `/images/hero.png` restituiscono immagini, non l'HTML del fallback SPA.
- Carica un Excel o una letterhead: l'upload multer deve passare attraverso il rewrite.
- `fly machine list` mostra 1 sola macchina.
- Genera un batch e scarica lo ZIP. È il test più importante per il proxy Vercel con file grandi. Se il download fallisce o va in timeout, esponi il download direttamente dal dominio del backend.

## Note operative

- **Una sola macchina.** SQLite è su volume locale, quindi non va mai eseguito `fly scale count` > 1.
- **Backup.** Fly fa snapshot giornalieri del volume (`fly volumes snapshots list`). Per un backup applicativo usa `sqlite3 .backup` via `fly ssh console`.
- **`TRUST_PROXY_HOPS=2`** (in `fly.toml`). Le richieste passano per il proxy Vercel e poi per quello Fly. Con questo valore `req.ip` è l'IP reale del client, quindi il rate-limit del login non raggruppa tutti gli utenti sotto l'IP di Vercel.
- **Dati personali.** Vercel serve solo asset statici, mentre DB e file restano su Fly `fra`. Verifica con il DPO i DPA di Vercel e di Fly.
