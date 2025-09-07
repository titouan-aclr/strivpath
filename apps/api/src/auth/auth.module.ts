import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { StravaStrategy } from './strategies/strava.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'strava' }), HttpModule],
  providers: [AuthService, StravaStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
