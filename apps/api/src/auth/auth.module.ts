import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { StravaStrategy } from './strategies/strava.strategy';
import { UserModule } from '../user/user.module';

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
