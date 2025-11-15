// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/video-player";
import { HighContrastToggle } from "@/components/high-contrast-toggle";
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
  Shield,
  Clock,
  Star,
  Menu,
  X,
  CheckCircle,
  Phone,
  Video,
  User,
  MapPin,
  Volume2,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          highContrast ? "bg-gray-900" : "bg-blue-50"
        }`}
      >
        <div className="text-center">
          <div
            className={`w-20 h-20 ${
              highContrast ? "bg-yellow-400" : "bg-blue-700"
            } rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse`}
          >
            <Heart className="w-10 h-10 text-white" />
          </div>
          <p
            className={`text-2xl font-bold ${
              highContrast ? "text-yellow-300" : "text-blue-900"
            }`}
          >
            Cargando MediLink+...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        highContrast
          ? "bg-gray-900 text-yellow-100"
          : "bg-gradient-to-br from-blue-50 to-white"
      }`}
    >
      {/* Botón de alto contraste */}
      <HighContrastToggle
        highContrast={highContrast}
        setHighContrast={setHighContrast}
      />

      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b-4 ${
          highContrast
            ? "bg-gray-800 border-yellow-400"
            : "bg-white/95 border-blue-300 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  highContrast ? "bg-yellow-400" : "bg-blue-700"
                }`}
              >
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    highContrast ? "text-yellow-300" : "text-blue-900"
                  }`}
                >
                  MediLink+
                </h1>
                <p
                  className={`text-sm ${
                    highContrast ? "text-yellow-200" : "text-blue-700"
                  } hidden sm:block`}
                >
                  Salud Inteligente para Todos
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="outline"
                asChild
                className={`text-xl font-bold py-4 px-8 border-2 ${
                  highContrast
                    ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
                    : "border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button
                asChild
                className={`text-xl font-bold py-4 px-8 border-2 ${
                  highContrast
                    ? "bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-300"
                    : "bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
                }`}
              >
                <Link href="/auth/register">Registrarse</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-3 rounded-xl border-2 ${
                highContrast
                  ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
                  : "border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
              }`}
              aria-label="Menú principal"
            >
              {mobileMenuOpen ? (
                <X className="w-8 h-8" />
              ) : (
                <Menu className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className={`md:hidden py-6 border-t-2 ${
                highContrast
                  ? "border-yellow-400 bg-gray-800"
                  : "border-blue-300 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className={`w-full justify-start text-xl font-bold py-5 border-2 ${
                    highContrast
                      ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
                      : "border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                  }`}
                  asChild
                >
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button
                  className={`w-full justify-start text-xl font-bold py-5 border-2 ${
                    highContrast
                      ? "bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-300"
                      : "bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
                  }`}
                  asChild
                >
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-8 shadow-lg ${
                highContrast ? "bg-yellow-400" : "bg-blue-700"
              }`}
            >
              <Heart className="w-12 h-12 text-white" />
            </div>

            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 leading-tight ${
                highContrast ? "text-yellow-300" : "text-blue-900"
              }`}
            >
              Cuidamos de tu salud
              <span
                className={`block ${
                  highContrast ? "text-yellow-400" : "text-blue-700"
                }`}
              >
                de forma sencilla
              </span>
            </h1>

            <p
              className={`text-2xl mb-10 leading-relaxed font-medium ${
                highContrast ? "text-yellow-200" : "text-blue-800"
              }`}
            >
              Plataforma <span className="font-bold">fácil de usar</span> para
              pacientes, médicos, farmacias y laboratorios. Diseñada
              especialmente para adultos mayores.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start mb-12">
              <Button
                size="lg"
                className={`text-2xl font-bold px-12 py-8 border-4 ${
                  highContrast
                    ? "bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-300"
                    : "bg-blue-700 text-white border-blue-800 hover:bg-blue-800"
                }`}
                asChild
              >
                <Link href="/auth/register">
                  Comenzar Ahora
                  <Heart className="ml-3 w-7 h-7" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`text-2xl font-bold px-12 py-8 border-4 ${
                  highContrast
                    ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
                    : "border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                }`}
                asChild
              >
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
              {[
                { icon: CheckCircle, text: "Fácil de usar" },
                { icon: Shield, text: "100% Seguro" },
                { icon: Users, text: "+10,000 usuarios" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 ${
                      highContrast
                        ? "bg-gray-800 border-yellow-400 text-yellow-300"
                        : "bg-white border-blue-300 text-blue-900"
                    } shadow-lg`}
                  >
                    <Icon className="w-7 h-7 text-green-600" />
                    <span className="text-xl font-semibold">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Section */}
          <div className="relative">
            <VideoPlayer
              videoSrc="/videos/demo.mp4"
              thumbnailSrc="/images/home/thumbnail.jpg"
              title="Conoce MediLink+"
              description="Aprende a usar nuestra plataforma en 5 minutos"
              highContrast={highContrast}
            />

            {/* Floating elements */}
            <div
              className={`absolute -top-6 -left-6 rounded-2xl shadow-xl p-4 border-2 ${
                highContrast
                  ? "bg-gray-800 border-yellow-400 text-yellow-300"
                  : "bg-white border-blue-300 text-blue-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6" />
                <span className="text-lg font-bold">Consultas virtuales</span>
              </div>
            </div>

            <div
              className={`absolute -bottom-6 -right-6 rounded-2xl shadow-xl p-4 border-2 ${
                highContrast
                  ? "bg-gray-800 border-yellow-400 text-yellow-300"
                  : "bg-white border-blue-300 text-blue-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6" />
                <span className="text-lg font-bold">App móvil disponible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        className={`py-20 ${highContrast ? "bg-gray-800" : "bg-blue-50"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`text-2xl sm:text-3xl font-bold mb-6 ${
                highContrast ? "text-yellow-300" : "text-blue-900"
              }`}
            >
              Así de fácil es usar MediLink+
            </h2>
            <p
              className={`text-2xl max-w-3xl mx-auto ${
                highContrast ? "text-yellow-200" : "text-blue-800"
              }`}
            >
              En solo 3 pasos puedes empezar a gestionar tu salud de manera
              digital
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Regístrate",
                description: "Crea tu cuenta en minutos con tus datos básicos",
                icon: Users,
              },
              {
                step: "2",
                title: "Completa tu perfil",
                description: "Añade tu historial médico y preferencias",
                icon: User,
              },
              {
                step: "3",
                title: "Empieza a usar",
                description: "Accede a todas las funciones de MediLink+",
                icon: CheckCircle,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`text-center rounded-2xl p-8 shadow-2xl border-4 ${
                    highContrast
                      ? "bg-gray-700 border-yellow-400 text-yellow-100"
                      : "bg-white border-blue-200 text-blue-900"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${
                      highContrast ? "border-yellow-400" : "border-blue-600"
                    }`}
                  >
                    <span
                      className={`text-2xl font-bold ${
                        highContrast ? "text-yellow-400" : "text-blue-600"
                      }`}
                    >
                      {item.step}
                    </span>
                  </div>
                  <Icon
                    className={`w-12 h-12 mx-auto mb-6 ${
                      highContrast ? "text-yellow-400" : "text-blue-600"
                    }`}
                  />
                  <h3
                    className={`text-3xl font-bold mb-4 ${
                      highContrast ? "text-yellow-300" : "text-blue-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-xl leading-relaxed ${
                      highContrast ? "text-yellow-200" : "text-blue-800"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2
            className={`text-2xl sm:text-3xl font-bold mb-6 ${
              highContrast ? "text-yellow-300" : "text-blue-900"
            }`}
          >
            Todo lo que necesitas para tu salud
          </h2>
          <p
            className={`text-2xl max-w-3xl mx-auto ${
              highContrast ? "text-yellow-200" : "text-blue-800"
            }`}
          >
            Funciones diseñadas pensando en la comodidad de adultos mayores
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {[
            {
              icon: Users,
              title: "Historial Médico Unificado",
              description:
                "Tu historial médico completo y seguro, accesible desde cualquier lugar",
            },
            {
              icon: Clock,
              title: "Citas Inteligentes",
              description:
                "Agenda citas presenciales o virtuales con recordatorios automáticos",
            },
            {
              icon: Shield,
              title: "Recetas Digitales",
              description:
                "Recibe recetas digitales seguras y encuentra farmacias cercanas",
            },
            {
              icon: Star,
              title: "Resultados de Laboratorio",
              description:
                "Recibe tus resultados directamente en la plataforma",
            },
            {
              icon: Video,
              title: "Consultas Virtuales",
              description:
                "Atiende tus consultas médicas desde la comodidad de tu hogar",
            },
            {
              icon: MapPin,
              title: "Encuentra Profesionales",
              description: "Localiza médicos y centros de salud cerca de ti",
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className={`border-4 shadow-2xl hover:scale-105 transition-transform ${
                  highContrast
                    ? "bg-gray-800 border-yellow-400 text-yellow-100"
                    : "bg-white border-blue-200 text-blue-900"
                }`}
              >
                <CardHeader className="text-center pb-6">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 border-4 ${
                      highContrast
                        ? "bg-gray-700 border-yellow-400"
                        : "bg-blue-100 border-blue-300"
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 ${
                        highContrast ? "text-yellow-400" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <CardTitle
                    className={`text-2xl font-bold ${
                      highContrast ? "text-yellow-300" : "text-blue-900"
                    }`}
                  >
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription
                    className={`text-xl text-center font-medium leading-relaxed ${
                      highContrast ? "text-yellow-200" : "text-blue-800"
                    }`}
                  >
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        className={`py-20 ${highContrast ? "bg-gray-800" : "bg-blue-900"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-2xl text-blue-200 max-w-3xl mx-auto">
              Miles de adultos mayores ya confían en MediLink+ para su atención
              médica
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                name: "María López",
                age: "68 años",
                comment:
                  "Muy fácil de usar, hasta mis nietos se sorprenden. Las letras grandes me ayudan mucho.",
              },
              {
                name: "Carlos Ruiz",
                age: "72 años",
                comment:
                  "Las consultas virtuales me salvan de viajar al hospital. Todo está muy claro.",
              },
              {
                name: "Rosa Mendoza",
                age: "65 años",
                comment:
                  "Todas mis recetas en un solo lugar, ya no las pierdo. Los botones son fáciles de presionar.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-blue-800 rounded-2xl p-8 text-center border-4 border-blue-600"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <p className="text-blue-100 text-xl mb-6 italic leading-relaxed">
                  "{testimonial.comment}"
                </p>
                <div>
                  <p className="font-bold text-white text-2xl">
                    {testimonial.name}
                  </p>
                  <p className="text-blue-200 text-xl">{testimonial.age}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div
          className={`rounded-3xl text-center py-16 px-8 border-4 ${
            highContrast
              ? "bg-gray-800 border-yellow-400 text-yellow-100"
              : "bg-blue-700 border-blue-600 text-white"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-2xl mb-10 max-w-3xl mx-auto opacity-90">
            Únete a nuestra comunidad y descubre lo fácil que es cuidar de tu
            salud con MediLink+
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className={`text-2xl font-bold px-12 py-8 border-4 ${
                highContrast
                  ? "bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-300"
                  : "bg-white text-blue-700 border-white hover:bg-blue-50"
              }`}
              asChild
            >
              <Link href="/auth/register">Crear Cuenta Gratuita</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={`text-2xl font-bold px-12 py-8 border-4 ${
                highContrast
                  ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
                  : "border-white text-white hover:bg-white hover:text-blue-700"
              }`}
              asChild
            >
              <Link href="/about">Conocer más</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t-4 ${
          highContrast
            ? "border-yellow-400 bg-gray-800"
            : "border-blue-300 bg-white"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    highContrast ? "bg-yellow-400" : "bg-blue-700"
                  }`}
                >
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3
                    className={`text-2xl font-bold ${
                      highContrast ? "text-yellow-300" : "text-blue-900"
                    }`}
                  >
                    MediLink+
                  </h3>
                  <p
                    className={`text-lg ${
                      highContrast ? "text-yellow-200" : "text-blue-700"
                    }`}
                  >
                    Salud Inteligente para Todos
                  </p>
                </div>
              </div>
              <p
                className={`text-xl ${
                  highContrast ? "text-yellow-200" : "text-blue-800"
                }`}
              >
                Plataforma médica desarrollada pensando en la comodidad de
                adultos mayores
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-end items-start sm:items-center">
              <Link
                href="/privacidad"
                className={`text-xl font-medium hover:underline ${
                  highContrast
                    ? "text-yellow-300 hover:text-yellow-400"
                    : "text-blue-700 hover:text-blue-900"
                }`}
              >
                Política de Privacidad
              </Link>
              <Link
                href="/terminos"
                className={`text-xl font-medium hover:underline ${
                  highContrast
                    ? "text-yellow-300 hover:text-yellow-400"
                    : "text-blue-700 hover:text-blue-900"
                }`}
              >
                Términos y Condiciones
              </Link>
              <Link
                href="/contacto"
                className={`text-xl font-medium hover:underline ${
                  highContrast
                    ? "text-yellow-300 hover:text-yellow-400"
                    : "text-blue-700 hover:text-blue-900"
                }`}
              >
                Contacto
              </Link>
            </div>
          </div>

          <div
            className={`border-t-2 mt-8 pt-8 text-center ${
              highContrast ? "border-yellow-400" : "border-blue-300"
            }`}
          >
            <p
              className={`text-xl ${
                highContrast ? "text-yellow-300" : "text-blue-700"
              }`}
            >
              &copy; 2024 MediLink+. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
