import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth";
import { AnalyticsBeacon } from "@/features/shared/analytics/AnalyticsBeacon";
import { RegisterSW } from "@/features/shared/pwa";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JCV 24 Fitness - Transforma tu Cuerpo",
  description:
    "Planes de alimentacion personalizados y rutinas de entrenamiento para transformar tu cuerpo. JCV 24 Fitness te guia en tu metamorfosis.",
  keywords: [
    "fitness",
    "nutricion",
    "entrenamiento",
    "plan alimentacion",
    "gimnasio",
    "JCV Fitness",
    "JCV 24",
    "jcv24fitness",
  ],
  authors: [{ name: "JCV 24 Fitness" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JCV Fitness",
  },
  openGraph: {
    title: "JCV 24 Fitness - Transforma tu Cuerpo",
    description: "Planes de alimentacion y rutinas de entrenamiento personalizadas",
    type: "website",
    siteName: "JCV 24 Fitness",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${bebasNeue.variable} antialiased`}>
        <AnalyticsBeacon />
        <RegisterSW />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
