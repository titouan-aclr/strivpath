import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsEnum, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';
import { SportType, ThemeType, LocaleType } from './user-preferences.model';

@InputType()
export class UpdateUserPreferencesInput {
  @Field(() => [SportType], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SportType, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  selectedSports?: SportType[];

  @Field(() => LocaleType, { nullable: true })
  @IsOptional()
  @IsEnum(LocaleType)
  locale?: LocaleType;

  @Field(() => ThemeType, { nullable: true })
  @IsOptional()
  @IsEnum(ThemeType)
  theme?: ThemeType;
}
