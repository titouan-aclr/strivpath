import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsEnum, ArrayMinSize, ArrayMaxSize, IsString, IsIn, IsOptional } from 'class-validator';
import { SportType, ThemeType } from './user-preferences.model';

@InputType()
export class UpdateUserPreferencesInput {
  @Field(() => [SportType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SportType, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  selectedSports?: SportType[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr'])
  locale?: string;

  @Field(() => ThemeType, { nullable: true })
  @IsOptional()
  @IsEnum(ThemeType)
  theme?: ThemeType;
}
