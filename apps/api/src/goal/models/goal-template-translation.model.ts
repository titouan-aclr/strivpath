import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType({
  description: 'Translation for a goal template in a specific locale (internal use)',
})
export class GoalTemplateTranslation {
  @Field(() => ID)
  id!: number;

  @Field(() => Int, { description: 'ID of the template being translated' })
  templateId!: number;

  @Field({ description: 'Locale code (en, fr, etc.)' })
  locale!: string;

  @Field({ description: 'Translated title' })
  title!: string;

  @Field({ nullable: true, description: 'Translated description' })
  description?: string;

  @Field({ description: 'Timestamp when the translation was created' })
  createdAt!: Date;

  @Field({ description: 'Timestamp when the translation was last updated' })
  updatedAt!: Date;
}
