import { describe, test, expect } from 'vitest';
import { upsertUserSchema, insertEvaluationCycleSchema, insertOverallSelfAssessmentSchema } from './schema';

describe('User Schema Validation', () => {
  describe('MBO Percentage Validation', () => {
    test('accepts valid MBO percentage (multiple of 5)', () => {
      const validPercentages = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

      validPercentages.forEach((percentage) => {
        const result = upsertUserSchema.safeParse({
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          mboPercentage: percentage,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mboPercentage).toBe(percentage);
        }
      });
    });

    test('rejects invalid MBO percentage (not multiple of 5)', () => {
      const invalidPercentages = [1, 2, 3, 4, 6, 7, 8, 9, 11, 13, 17, 23, 47, 99];

      invalidPercentages.forEach((percentage) => {
        const result = upsertUserSchema.safeParse({
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          mboPercentage: percentage,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('multiple of 5');
        }
      });
    });

    test('rejects MBO percentage below 0', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        mboPercentage: -5,
      });

      expect(result.success).toBe(false);
    });

    test('rejects MBO percentage above 100', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        mboPercentage: 105,
      });

      expect(result.success).toBe(false);
    });

    test('accepts undefined MBO percentage', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        // mboPercentage is omitted
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Email Validation', () => {
    test('accepts valid email addresses', () => {
      const validEmails = [
        'test@test.com',
        'user@example.org',
        'john.doe@company.co.uk',
        'user+tag@domain.com',
      ];

      validEmails.forEach((email) => {
        const result = upsertUserSchema.safeParse({
          email,
          firstName: 'Test',
          lastName: 'User',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('RAL (Salary) Validation', () => {
    test('accepts numeric RAL as string', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        ral: 50000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ral).toBe(50000);
      }
    });

    test('accepts null RAL', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        ral: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('isActive Field', () => {
    test('accepts true for isActive', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    test('accepts false for isActive', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });
  });

  describe('Optional Fields', () => {
    test('accepts null values for optional fields', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        telefono: null,
        indirizzo: null,
        cap: null,
        citta: null,
      });

      expect(result.success).toBe(true);
    });

    test('accepts string values for optional fields', () => {
      const result = upsertUserSchema.safeParse({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        telefono: '+39 123 456789',
        indirizzo: 'Via Roma 123',
        cap: '00100',
        citta: 'Roma',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telefono).toBe('+39 123 456789');
        expect(result.data.indirizzo).toBe('Via Roma 123');
        expect(result.data.cap).toBe('00100');
        expect(result.data.citta).toBe('Roma');
      }
    });
  });
});

describe('Evaluation Cycle Schema Validation', () => {
  describe('Date Field Conversion', () => {
    test('should accept and convert date strings to Date objects', () => {
      const input = {
        name: 'Test Cycle 2024',
        year: 2024,
        status: 'draft' as const,
        enable360Feedback: true,
        selfAssessmentStart: '2024-01-15',
        selfAssessmentEnd: '2024-02-15',
        peerFeedbackStart: '2024-02-16',
        peerFeedbackEnd: '2024-03-15',
        managerEvaluationStart: '2024-03-16',
        managerEvaluationEnd: '2024-04-15',
        feedbackDeliveryStart: '2024-04-16',
        feedbackDeliveryEnd: '2024-05-15',
      };

      const result = insertEvaluationCycleSchema.parse(input);

      expect(result.selfAssessmentStart).toBeInstanceOf(Date);
      expect(result.selfAssessmentEnd).toBeInstanceOf(Date);
      expect(result.peerFeedbackStart).toBeInstanceOf(Date);
      expect(result.peerFeedbackEnd).toBeInstanceOf(Date);
      expect(result.managerEvaluationStart).toBeInstanceOf(Date);
      expect(result.managerEvaluationEnd).toBeInstanceOf(Date);
      expect(result.feedbackDeliveryStart).toBeInstanceOf(Date);
      expect(result.feedbackDeliveryEnd).toBeInstanceOf(Date);
    });

    test('should accept null values for optional date fields', () => {
      const input = {
        name: 'Test Cycle 2024',
        year: 2024,
        status: 'draft' as const,
        enable360Feedback: false,
        selfAssessmentStart: null,
        selfAssessmentEnd: null,
        peerFeedbackStart: null,
        peerFeedbackEnd: null,
        managerEvaluationStart: null,
        managerEvaluationEnd: null,
        feedbackDeliveryStart: null,
        feedbackDeliveryEnd: null,
      };

      const result = insertEvaluationCycleSchema.parse(input);

      expect(result.selfAssessmentStart).toBeNull();
      expect(result.selfAssessmentEnd).toBeNull();
    });

    test('should work with partial schema for updates', () => {
      const input = {
        name: 'Updated Cycle Name',
        selfAssessmentStart: '2024-06-01',
      };

      const result = insertEvaluationCycleSchema.partial().parse(input);

      expect(result.name).toBe('Updated Cycle Name');
      expect(result.selfAssessmentStart).toBeInstanceOf(Date);
    });

    test('should handle empty string dates by converting to null', () => {
      const input = {
        name: 'Test Cycle',
        year: 2024,
        status: 'draft' as const,
        enable360Feedback: false,
        selfAssessmentStart: '',
        selfAssessmentEnd: '',
      };

      const result = insertEvaluationCycleSchema.parse(input);

      // Empty strings should be converted to null
      expect(result.selfAssessmentStart).toBeNull();
      expect(result.selfAssessmentEnd).toBeNull();
    });
  });

  describe('Status Field Validation', () => {
    test('accepts valid status values', () => {
      const validStatuses = ['draft', 'active', 'completed', 'archived'];

      validStatuses.forEach((status) => {
        const result = insertEvaluationCycleSchema.safeParse({
          name: 'Test Cycle',
          year: 2024,
          status,
          enable360Feedback: false,
        });

        expect(result.success).toBe(true);
      });
    });

    test('rejects invalid status values', () => {
      const result = insertEvaluationCycleSchema.safeParse({
        name: 'Test Cycle',
        year: 2024,
        status: 'invalid_status',
        enable360Feedback: false,
      });

      expect(result.success).toBe(false);
    });

    test('uses draft as default status', () => {
      const result = insertEvaluationCycleSchema.parse({
        name: 'Test Cycle',
        year: 2024,
        enable360Feedback: false,
      });

      expect(result.status).toBe('draft');
    });
  });
});

describe('Overall Self Assessment Schema Validation', () => {
  describe('Required Fields', () => {
    test('accepts valid overall self assessment data', () => {
      const validData = {
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 4,
        overallComment: 'Great progress this year with significant achievements',
        strengths: 'Good communication and leadership skills',
        areasForImprovement: 'Time management and delegation',
        goals: 'Learn new technologies and mentor junior developers',
      };

      const result = insertOverallSelfAssessmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overallRating).toBe(4);
        expect(result.data.overallComment).toBe('Great progress this year with significant achievements');
      }
    });

    test('requires cycleId, userId, overallRating, and overallComment', () => {
      const invalidData = {
        cycleId: 'cycle-123',
        userId: 'user-456',
      };

      const result = insertOverallSelfAssessmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Overall Rating Validation', () => {
    test('accepts valid ratings from 1 to 5', () => {
      const validRatings = [1, 2, 3, 4, 5];

      validRatings.forEach((rating) => {
        const result = insertOverallSelfAssessmentSchema.safeParse({
          cycleId: 'cycle-123',
          userId: 'user-456',
          overallRating: rating,
          overallComment: 'Test comment',
        });

        expect(result.success).toBe(true);
      });
    });

    test('rejects rating below 1', () => {
      const result = insertOverallSelfAssessmentSchema.safeParse({
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 0,
        overallComment: 'Test comment',
      });

      expect(result.success).toBe(false);
    });

    test('rejects rating above 5', () => {
      const result = insertOverallSelfAssessmentSchema.safeParse({
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 6,
        overallComment: 'Test comment',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Optional Fields', () => {
    test('allows strengths, areasForImprovement, and goals to be omitted', () => {
      const validData = {
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 3,
        overallComment: 'Good year overall',
      };

      const result = insertOverallSelfAssessmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('accepts null values for optional fields', () => {
      const validData = {
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 3,
        overallComment: 'Good year overall',
        strengths: null,
        areasForImprovement: null,
        goals: null,
      };

      const result = insertOverallSelfAssessmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Comment Validation', () => {
    test('accepts non-empty comment', () => {
      const result = insertOverallSelfAssessmentSchema.safeParse({
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 4,
        overallComment: 'Detailed assessment comment',
      });

      expect(result.success).toBe(true);
    });

    test('rejects empty comment', () => {
      const result = insertOverallSelfAssessmentSchema.safeParse({
        cycleId: 'cycle-123',
        userId: 'user-456',
        overallRating: 4,
        overallComment: '',
      });

      expect(result.success).toBe(false);
    });
  });
});
