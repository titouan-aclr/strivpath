import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class AuthenticateWithStravaInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;
}
