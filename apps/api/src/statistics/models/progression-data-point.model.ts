import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType({
  description: 'A single data point for progression chart visualization',
})
export class ProgressionDataPoint {
  @Field({ description: 'Label for the x-axis (e.g., "Lun", "S1", "Jan")' })
  label!: string;

  @Field(() => Float, { description: 'Numeric value for the data point' })
  value!: number;

  @Field({ description: 'Formatted value for display (e.g., "42.5 km", "4h 32min")' })
  formattedValue!: string;
}
