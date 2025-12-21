# Test Documentation

## Struttura Testing

Questa directory contiene tutti i test per la piattaforma MBO, organizzati in quattro livelli:

### 1. Unit Tests
Test veloci e isolati per funzioni, utility, schema Zod, hook React e componenti singoli.

**Posizione**:
- Server: `server/**/*.test.ts`
- Client: `client/**/*.test.tsx`
- Shared: `shared/**/*.test.ts`

**Database**: SQLite in-memory (veloce)

**Eseguire**:
```bash
npm run test:unit
```

### 2. Integration Tests
Test API con database PostgreSQL reale, includendo flussi di autenticazione e storage layer completo.

**Posizione**: `tests/integration/**/*.test.ts`

**Database**: PostgreSQL dedicato per test

**Eseguire**:
```bash
npm run test:integration
```

### 3. Component Tests
Test React con React Testing Library, includendo interazioni utente e rendering condizionale.

**Posizione**: `client/src/components/**/*.test.tsx`

**Mock API**: MSW (Mock Service Worker)

**Eseguire**:
```bash
npm run test:unit # Inclusi nei unit test client
```

### 4. E2E Tests
Test end-to-end con Playwright per flussi utente critici completi.

**Posizione**: `tests/e2e/**/*.spec.ts`

**Eseguire**:
```bash
npm run test:e2e
npm run test:e2e:ui # Con interfaccia grafica
```

## Comandi Disponibili

```bash
# Esegui tutti i test (watch mode)
npm test

# Esegui solo unit test
npm run test:unit

# Esegui solo integration test
npm run test:integration

# Esegui test in watch mode
npm run test:watch

# Visualizza UI interattiva dei test
npm run test:ui

# Genera coverage report
npm run test:coverage

# Esegui test per CI (verbose + coverage)
npm run test:ci

# Esegui E2E test
npm run test:e2e

# Esegui E2E test con UI
npm run test:e2e:ui
```

## Struttura Directory

```
tests/
├── client/
│   ├── setup.ts                    # Setup MSW per mock API
│   └── helpers/
│       └── renderWithProviders.tsx # Render helper per React Testing Library
├── server/
│   ├── setup.ts                    # Setup SQLite in-memory database
│   └── helpers/
│       └── dbHelpers.ts            # Helper per database testing
├── integration/
│   ├── setup.ts                    # Setup PostgreSQL test database
│   ├── api/                        # Test API endpoints
│   └── helpers/
│       └── apiClient.ts            # Supertest wrapper
├── e2e/                            # Playwright E2E tests
└── utils/
    ├── factories.ts                # Factory functions per test data
    └── mockHandlers.ts             # MSW request handlers
```

## Scrivere un Nuovo Test

### Unit Test - Schema Validation
```typescript
import { describe, test, expect } from 'vitest';
import { upsertUserSchema } from '@shared/schema';

describe('User Schema', () => {
  test('validates MBO percentage', () => {
    const result = upsertUserSchema.safeParse({
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      mboPercentage: 25,
    });

    expect(result.success).toBe(true);
  });
});
```

### Component Test
```typescript
import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/tests/client/helpers/renderWithProviders';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Test
```typescript
import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/server/app';

describe('API Endpoint', () => {
  test('returns user data', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200);

    expect(response.body.email).toBe('test@test.com');
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

## Best Practices

### Testing Principles
1. **AAA Pattern**: Arrange → Act → Assert
2. **Test behavior, not implementation**
3. **One assertion per test** (quando possibile)
4. **Nomi descrittivi**: `test('prevents assignment exceeding 100% weight')`
5. **Test isolation**: Evita dipendenze tra test
6. **Usa factories**: Per generare dati di test consistenti
7. **Cleanup**: Pulisci il database dopo ogni test

### React Testing
1. **Query priority**: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
2. **userEvent** invece di `fireEvent` (più realistico)
3. **Test accessibility**: Verifica role, labels, aria-*
4. **Mock API con MSW**: Invece di mockare axios/fetch
5. **Test stati**: loading, error, empty, success

### API Testing
1. **Test success e error cases**
2. **Verifica stato database** dopo mutations
3. **Test autorizzazione** (admin vs employee)
4. **Test edge cases**: Dati vuoti, dataset grandi
5. **Usa transazioni** per rollback automatico

## Coverage Targets

| Area | Target | Priorità |
|------|--------|----------|
| Auth & Authorization | 100% | CRITICA |
| Calcoli MBO | 100% | CRITICA |
| Weight Validation | 100% | CRITICA |
| Storage Layer | 90% | ALTA |
| API Routes | 85% | ALTA |
| Schema Zod | 100% | ALTA |
| React Components | 80% | MEDIA |
| Utility Functions | 90% | MEDIA |

## CI/CD

I test vengono eseguiti automaticamente su ogni push e pull request tramite GitHub Actions:

- **Unit Tests**: Eseguiti per ogni commit
- **Integration Tests**: Con PostgreSQL service container
- **E2E Tests**: Con Playwright su browser Chromium

Visualizza i report:
- Coverage: Codecov (badge nel README principale)
- E2E: Playwright HTML report (artifacts in GitHub Actions)

## Troubleshooting

### Test non trovati
Assicurati che i file di test seguano la naming convention:
- `*.test.ts` o `*.spec.ts` per TypeScript
- `*.test.tsx` o `*.spec.tsx` per React

### Database errors
- **Unit tests**: Verifica che SQLite sia installato correttamente
- **Integration tests**: Verifica che PostgreSQL sia in esecuzione e accessibile

### MSW warnings
Se vedi "No handler found for...", aggiungi il handler in `tests/utils/mockHandlers.ts`

### Playwright timeout
Aumenta il timeout in `playwright.config.ts` se i test E2E sono lenti

## Prossimi Passi

1. Aggiungere più unit test per storage layer
2. Implementare integration test per API critiche
3. Creare E2E test per flussi utente principali
4. Raggiungere target di coverage 80%+

## Risorse

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
