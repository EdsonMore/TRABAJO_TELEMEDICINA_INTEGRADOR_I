import Link from "next/link"
import { Heart, Shield, ArrowLeft } from "lucide-react"

export default function PrivacidadPage() {
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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-blue-900">Política de Privacidad</h1>
        </div>
        <p className="text-gray-500 mb-8">Última actualización: Julio 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">1. Introducción</h2>
          <p className="text-gray-600 leading-relaxed">
            En MediLink+, nos tomamos muy en serio la privacidad de sus datos personales. Esta Política de Privacidad
            describe cómo recopilamos, utilizamos, almacenamos y protegemos la información de nuestros usuarios,
            en cumplimiento con la Ley de Protección de Datos Personales (Ley 29733) y su Reglamento aprobado
            mediante Decreto Supremo N° 003-2013-JUS.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">2. Datos que Recopilamos</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Datos de identificación:</strong> nombres, DNI, fecha de nacimiento, edad.</li>
            <li><strong>Datos de contacto:</strong> correo electrónico, número telefónico, dirección.</li>
            <li><strong>Datos de salud:</strong> historial médico, diagnósticos, recetas, resultados de laboratorio, tipo de sangre, IMC.</li>
            <li><strong>Datos de seguro:</strong> información sobre seguro médico y afiliación.</li>
            <li><strong>Datos de uso:</strong> registro de citas, interacciones con la plataforma, preferencias de accesibilidad.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">3. Finalidad del Tratamiento</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Sus datos personales serán tratados exclusivamente para las siguientes finalidades:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Gestión de citas médicas y teleconsultas.</li>
            <li>Prescripción y dispensación de recetas electrónicas.</li>
            <li>Coordinación con farmacias y laboratorios para la entrega de medicamentos y resultados.</li>
            <li>Generación de reportes clínicos e historial médico.</li>
            <li>Mejora continua de nuestros servicios y experiencia de usuario.</li>
            <li>Cumplimiento de obligaciones legales y regulatorias.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">4. Base Legal</h2>
          <p className="text-gray-600 leading-relaxed">
            El tratamiento de sus datos personales se realiza sobre la base de su consentimiento expreso,
            manifestado al registrarse y aceptar los Términos y Condiciones de la plataforma. Para los datos
            sensibles de salud, recabamos su consentimiento explícito e informado de acuerdo con el artículo
            13 de la Ley 29733.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">5. Seguridad de los Datos</h2>
          <p className="text-gray-600 leading-relaxed">
            Implementamos medidas de seguridad técnicas, organizativas y legales para proteger sus datos
            personales contra acceso no autorizado, pérdida, destrucción o alteración. Utilizamos cifrado
            SSL/TLS para todas las comunicaciones y almacenamos los datos en servidores seguros con
            acceso restringido.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">6. Derechos del Titular</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            De acuerdo con la Ley 29733, usted tiene los siguientes derechos sobre sus datos personales:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Información:</strong> conocer si sus datos están siendo tratados y para qué fines.</li>
            <li><strong>Acceso:</strong> solicitar una copia de sus datos personales almacenados.</li>
            <li><strong>Actualización:</strong> corregir datos inexactos o desactualizados.</li>
            <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos para fines específicos.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">7. Compartición de Datos</h2>
          <p className="text-gray-600 leading-relaxed">
            No compartimos sus datos personales con terceros no autorizados. La información de salud es
            compartida exclusivamente con los profesionales médicos, farmacias y laboratorios involucrados
            en su atención, y únicamente para los fines del servicio. Podemos divulgar información cuando
            sea requerido por ley o autoridad competente.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">8. Contacto</h2>
          <p className="text-gray-600 leading-relaxed">
            Para ejercer sus derechos o realizar consultas sobre esta Política de Privacidad, puede contactarnos
            a través de nuestra página de <Link href="/contacto" className="text-blue-600 hover:underline">Contacto</Link>.
          </p>
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
