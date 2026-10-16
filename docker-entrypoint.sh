#!/bin/sh
# Il server usa process.cwd()/data (SQLite) e process.cwd()/uploads (file).
# Entrambi vivono sull'unico volume persistente montato in $STORAGE_DIR.
set -e

STORAGE_DIR="${STORAGE_DIR:-/storage}"
mkdir -p "$STORAGE_DIR/data" "$STORAGE_DIR/uploads"

# Restore una tantum (scripts/export-for-deploy.ts): avviene qui, prima che il
# server apra il DB. Il file viene rimosso, così i restart successivi non lo riapplicano.
if [ -f "$STORAGE_DIR/restore.tar.gz" ]; then
  echo "[entrypoint] restore da $STORAGE_DIR/restore.tar.gz"
  rm -f "$STORAGE_DIR"/data/mbo.sqlite "$STORAGE_DIR"/data/mbo.sqlite-wal "$STORAGE_DIR"/data/mbo.sqlite-shm
  tar -xzf "$STORAGE_DIR/restore.tar.gz" -C "$STORAGE_DIR"
  rm -f "$STORAGE_DIR/restore.tar.gz"
fi

for d in data uploads; do
  if [ ! -L "/app/$d" ]; then
    rm -rf "/app/$d"
    ln -s "$STORAGE_DIR/$d" "/app/$d"
  fi
done

exec "$@"
