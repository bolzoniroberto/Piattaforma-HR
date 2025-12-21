import { afterEach, beforeAll, afterAll } from 'vitest';

/**
 * Integration test setup file
 * Sets up PostgreSQL test database for integration tests
 */

// Note: Integration tests will use the actual PostgreSQL database
// Make sure to use a separate test database URL in your environment

beforeAll(async () => {
  // Setup database connection
  // Run migrations if needed
  console.log('Integration tests setup - using PostgreSQL test database');
});

afterEach(async () => {
  // Clean up test data after each test
  // You might want to truncate tables or use transactions
});

afterAll(async () => {
  // Close database connections
  console.log('Integration tests teardown');
});
