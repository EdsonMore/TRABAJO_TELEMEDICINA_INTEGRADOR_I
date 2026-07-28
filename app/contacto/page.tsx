"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"

export default function ContactoPage() {
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnviado(true)
  }

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
        <h1 className="text-4xl font-bold text-blue-900 mb-2">Contacto</h1>
        <p className="text-xl text-blue-700 mb-12">
          Estamos aquí para ayudarte. Escríbenos y te responderemos a la brevedad.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            {enviado ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">¡Mensaje enviado!</h2>
                <p className="text-green-600">
                  Gracias por contactarnos. Te responderemos en las próximas 24 horas hábiles.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    id="nombre"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="tu@correo.com"
                  />
                </div>
                <div>
                  <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                  <select
                    id="asunto"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="soporte">Soporte técnico</option>
                    <option value="consulta">Consulta médica</option>
                    <option value="facturacion">Facturación</option>
                    <option value="sugerencia">Sugerencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    id="mensaje"
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" /> Enviar mensaje
                </button>
              </form>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Información de Contacto</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Correo electrónico</p>
                    <a href="mailto:contacto@medilink.pe" className="text-blue-600 hover:underline">contacto@medilink.pe</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Teléfono</p>
                    <a href="tel:+511234567890" className="text-blue-600 hover:underline">+51 123 456 789</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Dirección</p>
                    <p className="text-gray-600">Av. Principal 1234, Lima 15001, Perú</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Horario de Atención</h3>
              <p className="text-blue-700">Lunes a Viernes: 8:00 a.m. - 6:00 p.m.</p>
              <p className="text-blue-700">Sábados: 9:00 a.m. - 1:00 p.m.</p>
              <p className="text-blue-500 text-sm mt-2">* Emergencias médicas: llamar al 911</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-blue-100 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MediLink+. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
