import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { SyncStatus } from '../enums/sync-status.enum';
import { SyncStage } from '../enums/sync-stage.enum';

@ObjectType()
export class SyncHistory {
  @Field(() => ID)
  id!: number;

  @Field(() => Int)
  userId!: number;

  @Field(() => SyncStatus)
  status!: SyncStatus;

  @Field(() => SyncStage, { nullable: true })
  stage?: SyncStage;

  @Field(() => Int)
  totalActivities!: number;

  @Field(() => Int)
  processedActivities!: number;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field()
  startedAt!: Date;

  @Field({ nullable: true })
  completedAt?: Date;
}
