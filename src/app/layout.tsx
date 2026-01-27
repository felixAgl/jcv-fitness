import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "JCV 24 Fitness - Transforma tu Cuerpo",
    description: "Planes de alimentacion y rutinas de entrenamiento personalizadas",
    type: "website",
    siteName: "JCV 24 Fitness",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${bebasNeue.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
