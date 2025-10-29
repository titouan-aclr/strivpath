import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';

@ObjectType()
export class AuthResponse {
  @Field(() => User)
  user!: User;
}
