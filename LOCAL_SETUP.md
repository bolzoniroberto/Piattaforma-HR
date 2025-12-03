# Setup Locale per MBO Management System

## Configurazione Completata ✅

Il progetto è stato configurato per lo sviluppo locale con le seguenti modifiche:

### 1. Autenticazione Locale
- Creato sistema di autenticazione locale in `server/localAuth.ts`
- Bypassato Replit Auth per sviluppo locale
- Il server sceglie automaticamente l'autenticazione locale quando `NODE_ENV=development`

### 2. Database
- Database PostgreSQL su Neon configurato
- Schema creato automaticamente
- Utenti demo già caricati

### 3. Utenti Demo

Sono disponibili i seguenti utenti per il test:

| Email | Ruolo | Nome |
|-------|-------|------|
| admin@example.com | Admin | Admin User |
| employee@example.com | Employee | Mario Rossi |
| employee2@example.com | Employee | Luigi Verdi |

**Nota:** In modalità development, puoi usare qualsiasi password per fare login.

## Come Avviare il Progetto

1. **Avvia il server di sviluppo:**
   ```bash
   cd /Users/robertobolzoni/MBO
   npm run dev
   ```

2. **Apri il browser:**
   - Applicazione: http://localhost:3000
   - Health check: http://localhost:3000/api/health
   - Lista utenti dev: http://localhost:3000/api/dev/users

3. **Login:**
   - Vai su http://localhost:3000
   - Usa una delle email sopra con qualsiasi password

## API Endpoints per Sviluppo

### Autenticazione
- `POST /api/login` - Login con email e password (qualsiasi password funziona in dev)
  ```bash
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"any"}'
  ```

- `GET /api/logout` - Logout
- `GET /api/dev/users` - Lista tutti gli utenti disponibili (solo development)

### Health Check
- `GET /api/health` - Verifica stato del server

## File di Configurazione

### `.env`
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...
SESSION_SECRET=<generato automaticamente>
ISSUER_URL=https://replit.com
REPL_ID=local-development-dummy-id
```

## Struttura Progetto

```
MBO/
├── client/              # Frontend React + TypeScript
│   ├── src/
│   └── public/
├── server/              # Backend Express + TypeScript
│   ├── app.ts          # Configurazione Express
│   ├── routes.ts       # API routes
│   ├── localAuth.ts    # Autenticazione locale (NEW)
│   ├── replitAuth.ts   # Autenticazione Replit (production)
│   ├── storage.ts      # Database operations
│   └── db.ts           # Database connection
├── shared/              # Codice condiviso
│   └── schema.ts       # Schema database Drizzle
└── .env                 # Variabili d'ambiente
```

## Troubleshooting

### Porta 3000 già in uso
Se vedi l'errore `EADDRINUSE`, cambia la porta nel file `.env`:
```env
PORT=3001
```

### Database non connesso
Verifica che `DATABASE_URL` nel file `.env` sia corretto

### Session errors
Assicurati che `SESSION_SECRET` sia impostato nel `.env`

## Prossimi Passi

Il server è ora in esecuzione! Puoi:
1. Aprire http://localhost:3000 nel browser
2. Fare login con uno degli utenti demo
3. Esplorare le funzionalità MBO
4. Sviluppare nuove features

## Note Tecniche

- **Hot Reload**: Il server si riavvia automaticamente quando modifichi i file
- **TypeScript**: Compilazione automatica con `tsx`
- **Vite**: Build tool per il frontend con HMR
- **Database**: PostgreSQL serverless su Neon
- **ORM**: Drizzle ORM con type-safety completo
