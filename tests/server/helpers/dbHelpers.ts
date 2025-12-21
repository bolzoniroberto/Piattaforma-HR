import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema';
import { createMockUser } from '../../utils/factories';

let testDb: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

/**
 * Create an in-memory SQLite database for testing
 */
export function createTestDatabase() {
  if (testDb) {
    return testDb;
  }

  sqliteInstance = new Database(':memory:');
  testDb = drizzle(sqliteInstance, { schema });

  // Create tables (simplified for SQLite)
  // Note: For full testing, you may need to run migrations or create tables manually
  // This is a placeholder - you'll need to adapt based on your schema

  return testDb;
}

/**
 * Get the current test database instance
 */
export function getTestDb() {
  if (!testDb) {
    throw new Error('Test database not initialized. Call createTestDatabase() first.');
  }
  return testDb;
}

/**
 * Clear all data from the test database
 * Call this in beforeEach or afterEach hooks
 */
export function clearDatabase() {
  if (!testDb || !sqliteInstance) return;

  // Clear tables in reverse dependency order to avoid foreign key constraints
  try {
    sqliteInstance.exec('DELETE FROM objective_assignments');
    sqliteInstance.exec('DELETE FROM objectives');
    sqliteInstance.exec('DELETE FROM objectives_dictionary');
    sqliteInstance.exec('DELETE FROM self_assessments');
    sqliteInstance.exec('DELETE FROM peer_feedback');
    sqliteInstance.exec('DELETE FROM peer_feedback_requests');
    sqliteInstance.exec('DELETE FROM manager_evaluations');
    sqliteInstance.exec('DELETE FROM development_plans');
    sqliteInstance.exec('DELETE FROM competencies');
    sqliteInstance.exec('DELETE FROM competency_models');
    sqliteInstance.exec('DELETE FROM evaluation_cycles');
    sqliteInstance.exec('DELETE FROM users');
    sqliteInstance.exec('DELETE FROM sessions');
  } catch (error) {
    // Tables might not exist yet, ignore errors
  }
}

/**
 * Close the test database connection
 */
export function closeTestDatabase() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    testDb = null;
  }
}

/**
 * Seed test users into the database
 */
export async function seedTestUsers(count = 5): Promise<any[]> {
  const db = getTestDb();
  const users = [];

  for (let i = 0; i < count; i++) {
    const user = createMockUser({
      id: `test-user-${i}`,
      email: `test${i}@test.com`,
      firstName: `Test${i}`,
      lastName: 'User',
      department: 'IT Development',
      mboPercentage: 25,
    });

    try {
      // Note: This is a placeholder. In reality, you'll need to use Drizzle's insert API
      // const inserted = await db.insert(schema.users).values(user).returning();
      // users.push(inserted[0]);
      users.push(user);
    } catch (error) {
      console.error('Error seeding user:', error);
    }
  }

  return users;
}

/**
 * Seed test objectives dictionary
 */
export async function seedTestObjectivesDictionary(count = 3): Promise<any[]> {
  const db = getTestDb();
  const objectives = [];

  for (let i = 0; i < count; i++) {
    const objective = {
      id: `dict-${i}`,
      title: `Test Objective ${i}`,
      description: `Description for objective ${i}`,
      indicatorClusterId: 'cluster-1',
      calculationTypeId: 'calc-1',
      objectiveType: 'numeric',
      targetValue: 100,
      thresholdValue: 50,
    };

    objectives.push(objective);
  }

  return objectives;
}
