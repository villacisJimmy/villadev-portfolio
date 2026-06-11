import "@/styles/globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { fontSans, fontMono } from "@/styles/fonts";
import type { Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic"; // depende de headers() para el nonce

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "en"
        ? "VillaDev — Web apps, automation & security"
        : "VillaDev — Desarrollo web, automatización y seguridad",
    description:
      locale === "en"
        ? "Network engineer (CCNA). Web application development, n8n automation and security by design."
        : "Ingeniero en Conectividad y Redes (CCNA). Desarrollo de aplicaciones web, automatización con n8n y seguridad por diseño.",
    metadataBase: new URL(process.env["SITE_ORIGIN"] ?? "http://localhost:3000"),
    alternates: { canonical: "/", languages: { es: "/es", en: "/en" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <html lang={locale} className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <div className="bg-grad" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
      </body>
    </html>
  );
}
