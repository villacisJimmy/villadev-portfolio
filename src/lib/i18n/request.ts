import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale | undefined;
  if (!locale || !routing.locales.includes(locale)) locale = routing.defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, messages };
});
