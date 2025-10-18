import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { DatabaseModule } from './database/database.module';
import { StravaModule } from './strava/strava.module';
import { ActivityModule } from './activity/activity.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { GraphQLContext } from './common/types';
import { GraphQLBigInt } from 'graphql-scalars';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
