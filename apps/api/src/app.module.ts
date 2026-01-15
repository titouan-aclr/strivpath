import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { DatabaseModule } from './database/database.module';
import { StravaModule } from './strava/strava.module';
import { ActivityModule } from './activity/activity.module';
import { GoalModule } from './goal/goal.module';
import { HealthModule } from './health/health.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { GraphQLContext } from './common/types';
import { GraphQLBigInt } from 'graphql-scalars';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('THROTTLE_DEFAULT_TTL', 60000),
          limit: configService.get<number>('THROTTLE_DEFAULT_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: {
        settings: {
          'request.credentials': 'include',
        },
      },
      sortSchema: true,
      context: ({ req, res }: GraphQLContext): GraphQLContext => ({ req, res }),
      resolvers: {
        BigInt: GraphQLBigInt,
      },
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    UserPreferencesModule,
    StravaModule,
    ActivityModule,
    GoalModule,
    HealthModule,
  ],
})
export class AppModule {}
