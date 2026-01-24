import { registerEnumType } from '@nestjs/graphql';

export enum Locale {
  EN = 'en',
  FR = 'fr',
}

registerEnumType(Locale, {
  name: 'Locale',
  description: 'Supported locales for internationalization',
});
