import { registerEnumType } from '@nestjs/graphql';

export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

registerEnumType(ThemeType, {
  name: 'ThemeType',
  description: 'Available theme options',
});
