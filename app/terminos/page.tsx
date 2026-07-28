import Link from "next/link"
import { Heart, FileText, ArrowLeft } from "lucide-react"

export default function TerminosPage() {
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
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-blue-900">Términos y Condiciones</h1>
        </div>
        <p className="text-gray-500 mb-8">Última actualización: Julio 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">1. Aceptación de los Términos</h2>
          <p className="text-gray-600 leading-relaxed">
            Al registrarse y utilizar la plataforma MediLink+, el usuario declara haber leído, entendido y
            aceptado los presentes Términos y Condiciones. Si no está de acuerdo con alguno de estos términos,
            deberá abstenerse de utilizar el servicio.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">2. Descripción del Servicio</h2>
          <p className="text-gray-600 leading-relaxed">
            MediLink+ es una plataforma de telemedicina que facilita la conexión entre pacientes y profesionales
            de la salud, permitiendo la gestión de citas médicas, recetas electrónicas, resultados de laboratorio,
            y la coordinación con farmacias para la dispensación de medicamentos. La plataforma está diseñada
            para operar en todo el territorio peruano.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">3. Roles y Responsabilidades</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-3">
            <li><strong>Pacientes:</strong> Son responsables de proporcionar información veraz y mantener la confidencialidad de sus credenciales de acceso.</li>
            <li><strong>Médicos:</strong> Deben contar con título profesional registrado en el Colegio Médico del Perú y ejercer conforme a la lex artis médica.</li>
            <li><strong>Farmacias:</strong> Deben contar con registro DIGEMID vigente y dispensar medicamentos únicamente con receta válida.</li>
            <li><strong>Laboratorios:</strong> Deben cumplir con las normas de calidad y bioseguridad establecidas por el MINSA.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">4. Recetas Electrónicas</h2>
          <p className="text-gray-600 leading-relaxed">
            Las recetas electrónicas emitidas a través de MediLink+ tienen validez legal conforme a la normativa
            peruana vigente. Las recetas serán firmadas digitalmente por el médico tratante y solo podrán ser
            dispensadas por farmacias registradas en la plataforma. El paciente es responsable de verificar que
            los medicamentos prescritos corresponden a los entregados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">5. Teleconsulta</h2>
          <p className="text-gray-600 leading-relaxed">
            Las teleconsultas no reemplazan una evaluación médica presencial cuando esta sea necesaria.
            El médico determinará si el caso puede ser manejado de forma remota. En caso de emergencia,
            el paciente debe acudir al centro de salud más cercano o llamar al 911.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">6. Privacidad de Datos</h2>
          <p className="text-gray-600 leading-relaxed">
            El tratamiento de datos personales se rige por nuestra <Link href="/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</Link>.
            El usuario otorga su consentimiento para el tratamiento de sus datos al registrarse en la plataforma.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">7. Limitación de Responsabilidad</h2>
          <p className="text-gray-600 leading-relaxed">
            MediLink+ actúa como intermediario tecnológico y no se hace responsable por la calidad de la
            atención médica brindada por los profesionales de la salud registrados en la plataforma.
            Cada profesional es responsable de sus actos conforme a la ley peruana.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">8. Modificaciones</h2>
          <p className="text-gray-600 leading-relaxed">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los usuarios serán
            notificados de cambios significativos a través de la plataforma o correo electrónico.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">9. Legislación Aplicable</h2>
          <p className="text-gray-600 leading-relaxed">
            Estos Términos y Condiciones se rigen por la legislación de la República del Perú. Cualquier
            controversia será sometida a la jurisdicción de los tribunales de Lima, Perú.
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
