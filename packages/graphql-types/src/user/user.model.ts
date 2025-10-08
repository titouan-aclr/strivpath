import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  stravaId: number;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  firstname?: string;

  @Field({ nullable: true })
  lastname?: string;

  @Field({ nullable: true })
  sex?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  profile?: string;

  @Field({ nullable: true })
  profileMedium?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
