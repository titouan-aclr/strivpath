import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserResolver } from './user.resolver.js';

@Module({
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
