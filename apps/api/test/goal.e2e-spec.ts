import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('GoalResolver (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('goalTemplates query (public)', () => {
    it('should return all templates', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              goalTemplates {
                id
                title
                description
                targetType
                targetValue
                periodType
                category
                isPreset
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.goalTemplates).toBeInstanceOf(Array);
        });
    });

    it('should filter templates by category', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              goalTemplates(category: "beginner") {
                id
                category
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          const templates = res.body.data.goalTemplates;
          templates.forEach(t => expect(t.category).toBe('beginner'));
        });
    });

    it('should return templates in French', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              goalTemplates(locale: "fr") {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          const templates = res.body.data.goalTemplates;
          expect(templates).toBeInstanceOf(Array);
        });
    });
  });

  describe('protected queries (authentication required)', () => {
    it('should fail to get goals without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              goals {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to get single goal without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              goal(id: 1) {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to get active goals without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              activeGoals {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });
  });

  describe('protected mutations (authentication required)', () => {
    it('should fail to create goal without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Test Goal"
                targetType: DISTANCE
                targetValue: 50
                periodType: MONTHLY
                startDate: "2025-01-01"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to create goal from template without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              createGoalFromTemplate(input: {
                templateId: 1
                startDate: "2025-01-01"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to update goal without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateGoal(id: 1, input: {
                title: "Updated Goal"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to delete goal without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              deleteGoal(id: 1)
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to archive goal without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              archiveGoal(id: 1) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });

    it('should fail to refresh goal progress without authentication', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              refreshGoalProgress(id: 1) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });
  });
});
