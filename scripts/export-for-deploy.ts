// Crea un pacchetto con snapshot consistente del DB + uploads da caricare sul volume del backend.
// Usa l'API di backup di SQLite: include le scritture ancora nel file -wal.
// Uso: npx tsx scripts/export-for-deploy.ts [--with-jobs]
import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const withJobs = process.argv.includes("--with-jobs");
const outDir = path.join(root, "deploy-export");
const stage = path.join(outDir, "stage");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(stage, "data"), { recursive: true });

const src = new Database(path.join(root, "data", "mbo.sqlite"), { readonly: true });
await src.backup(path.join(stage, "data", "mbo.sqlite"));
src.close();

// Journal DELETE: lo snapshot resta un file unico, senza -wal/-shm da trasportare.
const check = new Database(path.join(stage, "data", "mbo.sqlite"));
check.pragma("journal_mode = DELETE");
const integrity = check.pragma("integrity_check", { simple: true });
const users = (check.prepare("SELECT count(*) AS n FROM users").get() as { n: number }).n;
check.close();
if (integrity !== "ok") throw new Error(`integrity_check fallito: ${integrity}`);

const uploadsSrc = path.join(root, "uploads");
if (fs.existsSync(uploadsSrc)) {
  fs.cpSync(uploadsSrc, path.join(stage, "uploads"), {
    recursive: true,
    filter: (p) => withJobs || !p.startsWith(path.join(uploadsSrc, "jobs")),
  });
}

const tarPath = path.join(outDir, "storage.tar.gz");
execFileSync("tar", ["--no-xattrs", "-czf", tarPath, "-C", stage, "."], {
  env: { ...process.env, COPYFILE_DISABLE: "1" }, // niente metadati macOS nel tar
});
fs.rmSync(stage, { recursive: true, force: true });

const sizeMb = (fs.statSync(tarPath).size / 1024 / 1024).toFixed(1);
console.log(`OK: ${tarPath} (${sizeMb} MB) — utenti nel DB: ${users}${withJobs ? "" : " — uploads/jobs esclusi"}`);
