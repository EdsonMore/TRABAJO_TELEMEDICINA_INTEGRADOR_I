import Link from "next/link"
import { Heart, Shield, Users, Award, ArrowLeft } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-900">MediLink+</span>
          </Link>
          <Link href="/" className="text-blue-700 hover:text-blue-900 flex items-center gap-1 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Sobre MediLink+</h1>
        <p className="text-xl text-blue-700 mb-12">
          Salud Inteligente para Todos — Transformando la atención médica en el Perú
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nuestra Misión</h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            MediLink+ es una plataforma integral de telemedicina diseñada para conectar a pacientes, médicos,
            farmacias y laboratorios en un ecosistema digital seguro y accesible. Nuestro objetivo es democratizar
            el acceso a la salud de calidad en todo el Perú, reduciendo las barreras geográficas y administrativas
            que enfrentan millones de peruanos.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">¿Por qué MediLink+?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <Heart className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Atención Centrada en el Paciente</h3>
              <p className="text-gray-600">Diseñada pensando en adultos mayores y comunidades rurales con interfaz adaptativa y alto contraste.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <Shield className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Seguridad y Privacidad</h3>
              <p className="text-gray-600">Cumplimos con la Ley de Protección de Datos Personales (Ley 29733) y estándares internacionales de seguridad.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <Users className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Ecosistema Integrado</h3>
              <p className="text-gray-600">Conectamos pacientes, médicos, farmacias y laboratorios en una sola plataforma para una atención sin fricciones.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <Award className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Calidad Garantizada</h3>
              <p className="text-gray-600">Todos los profesionales de la salud en nuestra plataforma son verificados y colegiados.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cobertura Nacional</h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            Desde Lima hasta las regiones más alejadas del Perú, MediLink+ está disponible para cualquier persona
            con acceso a internet. Trabajamos con instituciones de salud pública y privada para garantizar que
            ningún peruano se quede sin atención médica oportuna.
          </p>
        </section>

        <section className="bg-blue-50 p-8 rounded-2xl border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Contáctanos</h2>
          <p className="text-blue-700 text-lg mb-4">
            ¿Tienes preguntas o sugerencias? Nos encantaría escucharte.
          </p>
          <Link
            href="/contacto"
            className="inline-block bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            Ir a Contacto
          </Link>
        </section>
      </main>

      <footer className="bg-white border-t border-blue-100 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MediLink+. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
