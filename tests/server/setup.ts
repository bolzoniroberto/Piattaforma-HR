import { afterEach, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, clearDatabase, closeTestDatabase } from './helpers/dbHelpers';

/**
 * Server test setup file
 * Sets up SQLite in-memory database for server-side tests
 */

// Create test database before all tests
beforeAll(() => {
  createTestDatabase();
});

// Clear database after each test to ensure isolation
afterEach(() => {
  clearDatabase();
});

// Close database connection after all tests
afterAll(() => {
  closeTestDatabase();
});
