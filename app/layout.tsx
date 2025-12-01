// app/layout
import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificacionesProvider } from "@/contexts/notificaciones-context";
import { SSEInitializer } from "@/components/notificaciones/sse-initializer";


export const metadata: Metadata = {
  title: "MediLink+ - Plataforma Médica Inteligente",
  description:
    "Sistema de coordinación y seguimiento médico comunitario para Perú",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <AuthProvider>
          <NotificacionesProvider>
            <SSEInitializer />
            {children}
          </NotificacionesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
