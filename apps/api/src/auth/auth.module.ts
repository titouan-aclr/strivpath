import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { StravaStrategy } from './strategies/strava.strategy.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'strava' }),
    HttpModule,
    UserModule,
  ],
  providers: [AuthService, StravaStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
