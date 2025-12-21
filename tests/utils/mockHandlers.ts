import { http, HttpResponse } from 'msw';
import { createMockUser, createMockObjective, createMockAssignment } from './factories';

/**
 * MSW request handlers for mocking API endpoints in client tests
 */
export const handlers = [
  // Auth endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json(
      createMockUser({
        id: 'test-user-1',
        email: 'test@test.com',
        role: 'employee',
      })
    );
  }),

  http.post('/api/login', async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'test@test.com') {
      return HttpResponse.json(
        createMockUser({
          id: 'test-user-1',
          email: 'test@test.com',
        })
      );
    }
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Users endpoints
  http.get('/api/users', () => {
    return HttpResponse.json({
      data: [
        createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' }),
        createMockUser({ id: 'user-2', firstName: 'Jane', lastName: 'Smith' }),
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockUser({ id: id as string })
    );
  }),

  // Objectives endpoints
  http.get('/api/my-objectives', () => {
    return HttpResponse.json([
      {
        ...createMockAssignment({ id: 'assign-1', weight: 30, progress: 50 }),
        objective: {
          ...createMockObjective({ id: 'obj-1' }),
          dictionary: {
            id: 'dict-1',
            title: 'Increase Revenue',
            description: 'Achieve 10% revenue growth',
          },
        },
      },
      {
        ...createMockAssignment({ id: 'assign-2', weight: 20, progress: 75 }),
        objective: {
          ...createMockObjective({ id: 'obj-2' }),
          dictionary: {
            id: 'dict-2',
            title: 'Improve Customer Satisfaction',
            description: 'Increase CSAT score to 90%',
          },
        },
      },
    ]);
  }),

  // Objectives dictionary
  http.get('/api/objectives-dictionary', () => {
    return HttpResponse.json([
      {
        id: 'dict-1',
        title: 'Increase Revenue',
        description: 'Achieve revenue growth targets',
        objectiveType: 'numeric',
        targetValue: 100,
        thresholdValue: 50,
      },
      {
        id: 'dict-2',
        title: 'Improve Customer Satisfaction',
        description: 'Improve CSAT scores',
        objectiveType: 'numeric',
        targetValue: 90,
        thresholdValue: 75,
      },
    ]);
  }),

  // Assignments
  http.post('/api/assignments', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      createMockAssignment({
        userId: body.userId,
        objectiveId: body.objectiveId,
        weight: body.weight,
      }),
      { status: 201 }
    );
  }),

  http.get('/api/assignments/:userId', ({ params }) => {
    const { userId } = params;
    return HttpResponse.json([
      createMockAssignment({
        id: 'assign-1',
        userId: userId as string,
        weight: 30,
      }),
      createMockAssignment({
        id: 'assign-2',
        userId: userId as string,
        weight: 20,
      }),
    ]);
  }),

  // Competencies
  http.get('/api/competencies/models', () => {
    return HttpResponse.json([
      {
        id: 'model-1',
        name: 'Standard Competency Model',
        description: 'Default competency framework',
      },
    ]);
  }),

  http.get('/api/competencies', () => {
    return HttpResponse.json([
      {
        id: 'comp-1',
        name: 'Communication',
        description: 'Effective verbal and written communication',
        category: 'soft-skills',
      },
      {
        id: 'comp-2',
        name: 'Technical Skills',
        description: 'Proficiency in technical tools and technologies',
        category: 'technical',
      },
    ]);
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
