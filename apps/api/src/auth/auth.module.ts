import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthController } from './auth.controller';
import { AuthCookieService } from './auth-cookie.service';
import { TokenCleanupService } from './token-cleanup.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { StravaModule } from '../strava/strava.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    forwardRef(() => UserModule),
    StravaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthResolver, AuthCookieService, TokenCleanupService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
