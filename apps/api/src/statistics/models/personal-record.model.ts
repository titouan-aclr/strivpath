import { ObjectType, Field, Float, ID } from '@nestjs/graphql';

@ObjectType({
  description: 'A personal record achievement for a specific sport',
})
export class PersonalRecord {
  @Field({ description: 'Type of record (e.g., "longest_distance", "best_pace")' })
  type!: string;

  @Field(() => Float, { description: 'Numeric value of the record' })
  value!: number;

  @Field({ description: 'Human-readable formatted value (e.g., "42.5 km")' })
  formattedValue!: string;

  @Field({ description: 'Date when the record was achieved' })
  achievedAt!: Date;

  @Field(() => ID, { description: 'ID of the activity where the record was set' })
  activityId!: string;
}
