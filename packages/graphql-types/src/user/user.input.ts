import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => Int)
  @IsInt()
  stravaId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstname?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastname?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sex?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profile?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profileMedium?: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstname?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastname?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sex?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profile?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profileMedium?: string;
}
