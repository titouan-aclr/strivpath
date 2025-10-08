import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as request from 'supertest';

interface GraphQLTestConfig {
  imports: any[];
  providers?: any[];
}

export class GraphQLTestHelper {
  private app: INestApplication;

  async setupTestingModule(config: GraphQLTestConfig): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          sortSchema: true,
        }),
        ...config.imports,
      ],
      providers: config.providers || [],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
  }

  async executeQuery<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await request(this.app.getHttpServer()).post('/graphql').send({ query, variables });

    if (response.body.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(response.body.errors)}`);
    }

    return response.body.data;
  }

  async executeMutation<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.executeQuery<T>(mutation, variables);
  }

  getApp(): INestApplication {
    return this.app;
  }

  async close(): Promise<void> {
    await this.app.close();
  }
}
