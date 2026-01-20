import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsEnum, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';
import { SportType } from '../enums/sport-type.enum';

@InputType()
export class UpdateUserPreferencesInput {
  @Field(() => [SportType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SportType, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  selectedSports?: SportType[];
}
