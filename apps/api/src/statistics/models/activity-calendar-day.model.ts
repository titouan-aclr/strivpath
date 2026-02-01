import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType({
  description: 'Represents a single day in the activity calendar with activity status',
})
export class ActivityCalendarDay {
  @Field({ description: 'The date of the calendar day' })
  date!: Date;

  @Field({ description: 'Whether an activity occurred on this day' })
  hasActivity!: boolean;
}
