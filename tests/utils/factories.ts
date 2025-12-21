import type { User } from '@shared/schema';

let userIdCounter = 1;
let objectiveIdCounter = 1;
let assignmentIdCounter = 1;

/**
 * Factory function to create mock User objects for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  const id = `test-user-${userIdCounter++}`;

  return {
    id,
    email: `user${userIdCounter}@test.com`,
    firstName: 'Test',
    lastName: `User${userIdCounter}`,
    codiceFiscale: null,
    profileImageUrl: null,
    role: 'employee',
    department: 'IT Development',
    cdc: null,
    managerId: null,
    ral: '80000',
    mboPercentage: 25,
    mboRegulationAcceptedAt: null,
    isActive: true,
    telefono: null,
    indirizzo: null,
    cap: null,
    citta: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create mock Objective objects for testing
 */
export function createMockObjective(overrides?: Partial<any>): any {
  const id = `test-obj-${objectiveIdCounter++}`;

  return {
    id,
    dictionaryId: 'dict-1',
    clusterId: 'cluster-1',
    deadline: null,
    actualValue: null,
    qualitativeResult: null,
    reportedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create mock ObjectiveAssignment objects for testing
 */
export function createMockAssignment(overrides?: Partial<any>): any {
  const id = `test-assign-${assignmentIdCounter++}`;

  return {
    id,
    userId: 'user-1',
    objectiveId: 'obj-1',
    weight: 20,
    status: 'assegnato',
    progress: 0,
    assignedAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create mock dictionary items
 */
export function createMockDictionaryItem(overrides?: Partial<any>): any {
  return {
    id: `dict-${Date.now()}`,
    title: 'Test Objective',
    description: 'Test objective description',
    indicatorClusterId: 'cluster-1',
    calculationTypeId: 'calc-1',
    objectiveType: 'numeric',
    targetValue: 100,
    thresholdValue: 50,
    unitOfMeasure: 'units',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create mock competency
 */
export function createMockCompetency(overrides?: Partial<any>): any {
  return {
    id: `comp-${Date.now()}`,
    modelId: 'model-1',
    name: 'Test Competency',
    description: 'Test competency description',
    category: 'technical',
    level: 'intermediate',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create mock self-assessment
 */
export function createMockSelfAssessment(overrides?: Partial<any>): any {
  return {
    id: `self-${Date.now()}`,
    userId: 'user-1',
    cycleId: 'cycle-1',
    competencyId: 'comp-1',
    rating: 4,
    comment: 'Test self-assessment comment',
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Reset all ID counters (useful between test suites)
 */
export function resetFactoryCounters() {
  userIdCounter = 1;
  objectiveIdCounter = 1;
  assignmentIdCounter = 1;
}
