import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

type Messages = Record<string, unknown>;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    const defaultMessages = (await import(`../messages/${routing.defaultLocale}.json`)) as {
      default: Messages;
    };
    return {
      locale: routing.defaultLocale,
      messages: defaultMessages.default,
    };
  }

  const messages = (await import(`../messages/${locale}.json`)) as { default: Messages };
  return {
    locale,
    messages: messages.default,
  };
});
