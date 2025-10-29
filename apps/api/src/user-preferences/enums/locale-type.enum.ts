import { registerEnumType } from '@nestjs/graphql';

export enum LocaleType {
  EN = 'en',
  FR = 'fr',
}

registerEnumType(LocaleType, {
  name: 'LocaleType',
  description: 'Available locale options',
});
