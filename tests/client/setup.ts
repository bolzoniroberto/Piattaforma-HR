import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from '../utils/mockHandlers';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * Client test setup file
 * Sets up MSW (Mock Service Worker) for API mocking
 */

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});
