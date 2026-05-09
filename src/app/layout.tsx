import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PageTransition from "./components/PageTransition";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Hablapraxia - Curso Apraxia del Habla Infantil",
  description: "Ayuda a tu hijo/a a desarrollar su capacidad de habla y comunicación de manera efectiva y divertida.",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={nunito.className}>
        <div id="google_translate_element" style={{ display: 'none' }} />
        <PageTransition>{children}</PageTransition>

        {/* Google Translate — afterInteractive garantiza que el div ya existe en el DOM */}
        <Script id="gt-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({
              pageLanguage: 'es',
              includedLanguages: 'en,es',
              autoDisplay: false,
            }, 'google_translate_element');
          };
        `}} />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
