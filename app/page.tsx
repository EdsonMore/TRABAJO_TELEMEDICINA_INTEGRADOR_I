"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Users,
  MapPin,
  Shield,
  Clock,
  Star,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 medilink-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Cargando MediLink+...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 medilink-gradient rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  MediLink+
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Salud Inteligente
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Registrarse</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/mapa-salud">Mapa de Salud</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/50">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button className="w-full justify-start" asChild>
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/mapa-salud">Mapa de Salud</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 medilink-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 medical-shadow-lg">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            MediLink+
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-3 sm:mb-4">
            Plataforma Inteligente de Coordinación y Seguimiento Médico
            Comunitario
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto">
            Conectamos pacientes, médicos, farmacias y laboratorios en un solo
            ecosistema digital para mejorar la atención médica en el Perú
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
            <Button
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
              asChild
            >
              <Link href="/auth/register">
                Comenzar Ahora
                <Heart className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto bg-transparent"
              asChild
            >
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto bg-transparent"
              asChild
            >
              <Link href="/mapa-salud">Ver Mapa de Salud</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            ¿Por qué elegir MediLink+?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Una plataforma completa que revoluciona la atención médica con
            tecnología avanzada
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="medical-shadow">
            <CardHeader>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2" />
              <CardTitle className="text-lg sm:text-xl">
                Historial Médico Unificado
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Accede a tu historial médico completo desde cualquier lugar,
                compartido de forma segura entre profesionales
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="medical-shadow">
            <CardHeader>
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2" />
              <CardTitle className="text-lg sm:text-xl">
                Mapa de Salud Comunitaria
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Visualiza alertas de salud en tu zona y mantente informado sobre
                brotes y campañas de prevención
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="medical-shadow">
            <CardHeader>
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2" />
              <CardTitle className="text-lg sm:text-xl">
                Citas Inteligentes
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Agenda citas presenciales o virtuales con recordatorios
                automáticos y seguimiento completo
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="medical-shadow">
            <CardHeader>
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2" />
              <CardTitle className="text-lg sm:text-xl">
                Recetas Digitales
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Recibe recetas digitales seguras y encuentra farmacias cercanas
                con disponibilidad y mejores precios
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="medical-shadow">
            <CardHeader>
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2" />
              <CardTitle className="text-lg sm:text-xl">
                Laboratorios Integrados
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Solicita exámenes y recibe resultados directamente en la
                plataforma con interpretación profesional
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="medical-shadow">
            <CardHeader>
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2" />
              <CardTitle className="text-lg sm:text-xl">
                Mensajería Segura
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Comunícate de forma segura con tu médico y recibe orientación
                profesional cuando la necesites
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <Card className="medical-shadow-lg medilink-gradient text-white">
          <CardContent className="text-center py-10 sm:py-12 lg:py-16 px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              ¿Listo para mejorar tu experiencia de salud?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 opacity-90">
              Únete a miles de peruanos que ya confían en MediLink+ para su
              atención médica
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-base sm:text-lg px-6 sm:px-8 lg:px-10 py-5 sm:py-6 w-full sm:w-auto"
              asChild
            >
              <Link href="/auth/register">Crear Cuenta Gratuita</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid gap-4 sm:gap-6 text-center md:text-left md:grid-cols-2">
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">
                &copy; 2024 MediLink+. Todos los derechos reservados.
              </p>
              <p className="text-xs sm:text-sm mt-2 text-muted-foreground">
                Plataforma médica desarrollada para mejorar la salud en el Perú
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-end items-center text-xs sm:text-sm text-muted-foreground">
              <Link
                href="/privacidad"
                className="hover:text-foreground transition-colors"
              >
                Política de Privacidad
              </Link>
              <span className="hidden sm:inline">•</span>
              <Link
                href="/terminos"
                className="hover:text-foreground transition-colors"
              >
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
