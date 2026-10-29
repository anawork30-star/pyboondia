import Footer from '../components/Footer'
import Header from '../components/Header'
import { BRAND, CONTACT } from '../config/brand'

// Textos legales base. Son una plantilla razonable para Colombia (Ley 1581 de 2012 y Decreto
// 1377 de 2013); deben ser revisados por un asesor legal y completados con los datos del
// responsable (razón social, NIT, dirección) antes de publicar en producción.

const PENDING = '[pendiente de configurar]'

const channel = () => (CONTACT.email ? CONTACT.email : `el formulario de contacto del sitio ${PENDING}`)

const DOCS = {
  privacidad: {
    title: 'Política de tratamiento de datos personales',
    updated: '28 de octubre de 2026',
    sections: [
      {
        h: '1. Responsable del tratamiento',
        p: [
          `${BRAND.legalName}${BRAND.legalName === BRAND.name ? ` ${PENDING}` : ''}, en adelante "la agencia", es responsable del tratamiento de los datos personales recolectados a través de ${BRAND.siteUrl}.`,
          `Canal de atención para asuntos de datos personales: ${channel()}.`,
        ],
      },
      {
        h: '2. Datos que recolectamos',
        p: [
          'A través del formulario de contacto recolectamos: nombre, correo electrónico, empresa (opcional), servicio de interés, presupuesto estimado (opcional) y la descripción del proyecto que nos compartes.',
          'No solicitamos datos sensibles. Te pedimos no incluirlos en la descripción del proyecto.',
        ],
      },
      {
        h: '3. Finalidades',
        p: [
          'Usamos tus datos para: responder tu solicitud, preparar y enviarte propuestas comerciales, hacer seguimiento a la conversación iniciada por ti y cumplir obligaciones legales.',
          'No vendemos ni cedemos tus datos a terceros con fines comerciales.',
        ],
      },
      {
        h: '4. Almacenamiento y seguridad',
        p: [
          'La información se almacena en una base de datos alojada por un proveedor de infraestructura en la nube (Supabase), con acceso restringido al personal autorizado de la agencia y controles de seguridad a nivel de fila.',
          'Conservamos los datos durante el tiempo necesario para atender la finalidad para la que fueron recolectados y los plazos que exija la ley.',
        ],
      },
      {
        h: '5. Tus derechos',
        p: [
          'Como titular puedes conocer, actualizar, rectificar y suprimir tus datos, solicitar prueba de la autorización otorgada, ser informado sobre el uso dado a tus datos, revocar la autorización y presentar quejas ante la Superintendencia de Industria y Comercio.',
          `Para ejercerlos escribe a ${channel()} indicando tu nombre, el derecho que deseas ejercer y un medio de respuesta. Atenderemos consultas en un máximo de diez (10) días hábiles y reclamos en un máximo de quince (15) días hábiles.`,
        ],
      },
      {
        h: '6. Cambios a esta política',
        p: ['Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha de actualización.'],
      },
    ],
  },
  terminos: {
    title: 'Términos de uso',
    updated: '28 de octubre de 2026',
    sections: [
      {
        h: '1. Objeto',
        p: [`Estos términos regulan el uso del sitio ${BRAND.siteUrl}, que presenta los servicios de ${BRAND.legalName}.`],
      },
      {
        h: '2. Contenido del sitio',
        p: [
          'La información publicada es de carácter informativo y no constituye una oferta vinculante. Cada proyecto se formaliza mediante una propuesta y un acuerdo específicos.',
          'Los proyectos del portafolio identificados como "concepto demostrativo" son ejemplos ilustrativos del tipo de trabajo que realizamos y no corresponden a clientes reales.',
        ],
      },
      {
        h: '3. Propiedad intelectual',
        p: [
          'Los textos, el diseño y la marca del sitio pertenecen a la agencia. Las fotografías de referencia provienen de bancos de imágenes con licencia que permite su uso comercial.',
        ],
      },
      {
        h: '4. Uso adecuado',
        p: ['Te comprometes a no usar el sitio ni sus formularios para enviar contenido ilícito, spam o información de terceros sin autorización.'],
      },
      {
        h: '5. Contacto',
        p: [`Para cualquier inquietud sobre estos términos escribe a ${channel()}.`],
      },
    ],
  },
}

export default function Legal({ doc }) {
  const content = DOCS[doc] ?? DOCS.privacidad
  return (
    <>
      <Header onHome={false} />
      <main id="contenido" className="pb-24 pt-36 sm:pt-44">
        <article className="container-x max-w-3xl">
          <p className="eyebrow text-violet">Legal</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{content.title}</h1>
          <p className="mt-4 text-muted">Última actualización: {content.updated}</p>
          <div className="mt-12 space-y-10">
            {content.sections.map((s) => (
              <section key={s.h}>
                <h2 className="text-2xl font-bold">{s.h}</h2>
                {s.p.map((text) => (
                  <p key={text} className="mt-3 text-[17px] leading-relaxed text-ink/85">
                    {text}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer onHome={false} />
    </>
  )
}
