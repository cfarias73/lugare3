import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Logo />
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
          >
            Regresar
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-800">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-2">
            Aviso de Privacidad Integral de Lugare
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
            Fecha de última actualización: 20 de agosto de 2026
          </p>

          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
            <p className="lead">
              En cumplimiento con lo establecido por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (en adelante, la "Ley" o "LFPDPPP"), su Reglamento y los Lineamientos del Aviso de Privacidad, <strong>LUGARE MEXICO, S.A. DE C.V.</strong> (en lo sucesivo, "Lugare", "nosotros" o el "Responsable"), pone a su disposición el presente Aviso de Privacidad Integral.
            </p>
            <p>
              Lugare existe para revolucionar la forma en que las personas conectan, alquilan y gestionan espacios, recintos y locaciones para eventos, construyendo un ecosistema transaccional transparente, seguro y libre de fraudes. Nuestra comunidad se basa en la confianza, por lo cual la protección, confidencialidad y el tratamiento legítimo de sus datos personales es nuestra máxima prioridad.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">1. Identidad y Domicilio del Responsable</h2>
            <p>
              Lugare es la persona moral responsable del tratamiento (obtención, uso, acceso, manejo, aprovechamiento, transferencia o disposición) de los datos personales de los usuarios de su sitio web, aplicaciones móviles y plataforma tecnológica (conjuntamente, la "Plataforma"). Para efectos del presente Aviso de Privacidad, señalamos como nuestro domicilio legal el ubicado en:
            </p>
            <p className="font-medium">
              Av. Belisario Domínguez 3500, Int: C1503, Margarita Maza de Juarez. C.P. 44300, Guadalajara, Jalisco. México.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">2. Glosario y Definiciones</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Anfitrión:</strong> Persona física o moral que utiliza la Plataforma para publicar y ofrecer el alquiler de espacios, recintos o locaciones.</li>
              <li><strong>Usuario / Huésped:</strong> Persona física o moral que utiliza la Plataforma para buscar, reservar y pagar por el alquiler de un espacio.</li>
              <li><strong>Titular:</strong> La persona física a quien corresponden los datos personales (usted).</li>
              <li><strong>Datos Personales:</strong> Cualquier información concerniente a una persona física identificada o identificable.</li>
              <li><strong>Datos Personales Sensibles:</strong> Aquellos que afecten a la esfera más íntima de su titular, o cuya utilización indebida pueda dar origen a discriminación o conlleve un riesgo grave.</li>
              <li><strong>Derechos ARCO:</strong> Derechos de Acceso, Rectificación, Cancelación y Oposición.</li>
            </ul>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">3. Datos Personales que Recabamos y Somemos a Tratamiento</h2>

            <h3 className="font-semibold text-lg mt-6 mb-2">3.1. Datos de Identificación, Contacto y Creación de Cuenta</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre completo y apellidos.</li>
              <li>Dirección de correo electrónico.</li>
              <li>Número de teléfono (móvil y/o fijo).</li>
              <li>Fotografía de perfil y fecha de nacimiento.</li>
              <li>Información de identificación oficial (credencial para votar INE, Pasaporte, Cédula Profesional) y validación biométrica facial (selfie) para procesos de <em>Know Your Customer</em> (KYC).</li>
              <li>Registro Federal de Contribuyentes (RFC) y Clave Única de Registro de Población (CURP).</li>
              <li>Comprobantes de domicilio.</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6 mb-2">3.2. Datos Patrimoniales y Financieros</h3>
            <p>
              Para procesar las reservas, realizar los cobros y efectuar las dispersiones de fondos (Esquema de <em>Escrow</em> o depósito en garantía), recabamos:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de tarjetas de crédito y/o débito (procesados y tokenizados de forma segura a través de nuestro proveedor de pagos, Stripe).</li>
              <li>Información de cuentas bancarias (CLABE interbancaria, banco, titular de la cuenta).</li>
              <li>Dirección de facturación e historial de transacciones en la Plataforma.</li>
            </ul>
            <p className="text-sm italic">
              Nota: De conformidad con el artículo 8 de la LFPDPPP, al proporcionar estos datos financieros, usted otorga su consentimiento expreso para su tratamiento conforme a este Aviso.
            </p>

            <h3 className="font-semibold text-lg mt-6 mb-2">3.3. Datos Específicos para Anfitriones</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Títulos de propiedad, contratos de arrendamiento u otra documentación que acredite la legítima posesión o administración del recinto.</li>
              <li>Licencias de uso de suelo, permisos de operación comercial y protección civil municipales.</li>
              <li>Fotografías, ubicación exacta (geolocalización) y características de los inmuebles anunciados.</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6 mb-2">3.4. Datos de Comunicaciones, Inteligencia Artificial y Soporte (Wati / Astra)</h3>
            <p>
              Historial de mensajes, correos electrónicos y grabaciones de llamadas de soporte. Al contactarnos a través de WhatsApp para recibir soporte o asistencia, recopilaremos su número telefónico, metadatos de conexión y el contenido de la conversación. Es importante destacar que estas interacciones pueden ser procesadas, analizadas y gestionadas por "Astra", nuestro agente virtual impulsado por Inteligencia Artificial, el cual opera a través de la infraestructura de Wati y Meta Cloud API.
            </p>

            <h3 className="font-semibold text-lg mt-6 mb-2">3.5. Datos de Terceros (Módulo de Invitaciones)</h3>
            <p>
              La Plataforma ofrece un módulo de invitaciones donde el Usuario puede cargar bases de datos de sus invitados. Para este proceso, el usuario puede ingresar los datos manualmente o cargar archivos en formato CSV o XLSX. Los datos recabados en este rubro incluyen nombres y direcciones de correo electrónico de terceros. <em>Al utilizar esta función y subir archivos CSV o XLSX, el Titular declara bajo protesta de decir verdad que cuenta con el consentimiento previo, expreso e informado de dichos terceros para compartir su información con Lugare, liberando a Lugare de cualquier controversia al respecto.</em> Lugare utilizará esta información única y exclusivamente para generar un enlace y preparar el envío masivo de las invitaciones generadas por el Usuario organizador.
            </p>

            <h3 className="font-semibold text-lg mt-6 mb-2">3.6. Datos de Navegación y Dispositivos (Recopilación Automática)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dirección IP, tipo de navegador, sistema operativo, identificadores únicos de dispositivo (MAC address).</li>
              <li>Geolocalización aproximada o precisa (sujeta a los permisos otorgados en su dispositivo).</li>
              <li>Historial de búsquedas, preferencias de navegación, clics y tiempo de permanencia en la Plataforma.</li>
            </ul>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">4. Finalidades del Tratamiento de los Datos Personales</h2>

            <h3 className="font-semibold text-lg mt-6 mb-2">4.1. Finalidades Primarias (Estrictamente necesarias)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear, verificar y administrar su cuenta de Usuario o Anfitrión dentro de la Plataforma.</li>
              <li>Facilitar la búsqueda, reservación y contratación de espacios y recintos para eventos.</li>
              <li>Generar y formalizar los acuerdos, contratos y confirmaciones digitales de arrendamiento temporal entre Usuarios y Anfitriones.</li>
              <li>Procesar pagos, retenciones, depósitos en garantía (<em>Escrow</em>) y dispersión de fondos a través de nuestras pasarelas de pago autorizadas.</li>
              <li>Cumplir con las obligaciones legales de prevención de lavado de dinero y financiamiento al terrorismo, autenticando identidades y validando la titularidad de las propiedades.</li>
              <li>Brindar atención al cliente, soporte técnico y resolución de controversias, operando a través de canales humanos y de nuestro agente virtual de Inteligencia Artificial (Astra) vía WhatsApp.</li>
              <li>Facilitar la coordinación logística mediante el envío de correos, notificaciones transaccionales y la gestión de invitaciones a través de la carga de archivos CSV o XLSX solicitada por el Usuario.</li>
              <li>Cumplir con requerimientos legales, fiscales (facturación electrónica ante el SAT) o de autoridades judiciales competentes.</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6 mb-2">4.2. Finalidades Secundarias (No esenciales)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Realizar estudios de mercado, métricas de uso, análisis estadísticos y evaluación de la calidad de nuestros servicios.</li>
              <li>Desarrollar, entrenar y mejorar nuestros algoritmos de Inteligencia Artificial y motores de recomendación.</li>
              <li>Envío de boletines informativos (newsletters), publicidad, promociones, descuentos y comunicaciones de marketing de Lugare y/o sus socios comerciales.</li>
            </ul>
            <p>
              En caso de que no desee que sus datos personales sean tratados para las Finalidades Secundarias, usted puede enviar un correo electrónico a <a href="mailto:privacidad@lugare.mx" className="text-primary hover:underline">privacidad@lugare.mx</a> manifestando su negativa. La negativa para el uso de sus datos para finalidades secundarias no será motivo para negarle los servicios principales de la Plataforma.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">5. Transferencia de Datos Personales</h2>
            <p>
              Para poder cumplir con las finalidades descritas, Lugare requiere compartir sus datos personales con terceros, tanto a nivel nacional como internacional. Al aceptar este Aviso de Privacidad, usted consiente la transferencia de sus datos a:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Otros Usuarios / Anfitriones:</strong> Para la correcta ejecución del servicio, compartiremos información de contacto básica entre el Huésped y el Anfitrión una vez confirmada la reserva, a fin de coordinar el acceso al inmueble.</li>
              <li><strong>Proveedores de Procesamiento de Pagos (Ej. Stripe):</strong> Para la validación, autorización y liquidación de transacciones financieras.</li>
              <li><strong>Proveedores de Servicios en la Nube y Alojamiento (Ej. AWS, Vercel):</strong> Para el almacenamiento seguro y cifrado de las bases de datos de Lugare.</li>
              <li><strong>Proveedores de Mensajería e Inteligencia Artificial:</strong> Empresas como Wati, Meta (WhatsApp Cloud API) y proveedores de modelos de lenguaje (LLM) que dan soporte a <strong>Astra</strong>, nuestro agente virtual.</li>
              <li><strong>Autoridades Gubernamentales y Judiciales:</strong> Cuando sea requerido por mandato de ley, auditorías fiscales, investigaciones de fraude o para proteger los derechos, propiedad y seguridad de Lugare, sus usuarios o el público en general.</li>
            </ul>
            <p className="text-sm italic">
              Las transferencias mencionadas no requieren de su consentimiento expreso por ser necesarias para el mantenimiento y cumplimiento de la relación jurídica entre usted y Lugare, según lo establecido en el artículo 37 de la LFPDPPP.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">6. Ejercicio de los Derechos ARCO y Revocación del Consentimiento</h2>
            <p>
              Como titular de los datos, usted tiene derecho a <strong>Acceder</strong> a sus datos personales; <strong>Rectificarlos</strong> en caso de ser inexactos o incompletos; <strong>Cancelarlos</strong> cuando considere que no se requieren para alguna de las finalidades señaladas; u <strong>Oponerse</strong> al tratamiento de los mismos para fines específicos (Derechos ARCO). Asimismo, puede revocar el consentimiento que nos ha otorgado.
            </p>
            <p>
              Para ejercer estos derechos, deberá enviar una solicitud por escrito al correo electrónico <a href="mailto:privacidad@lugare.mx" className="text-primary hover:underline">privacidad@lugare.mx</a>, dirigida a nuestro Departamento de Protección de Datos Personales, la cual deberá contener:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre completo del titular, domicilio y correo electrónico para comunicarle la respuesta.</li>
              <li>Copia de un documento de identidad oficial vigente (INE, Pasaporte).</li>
              <li>Descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO.</li>
              <li>Cualquier otro elemento o documento que facilite la localización de los datos personales (ej. número de reserva o correo asociado a la cuenta).</li>
            </ul>
            <p>
              Lugare le comunicará la determinación adoptada en un plazo máximo de 20 (veinte) días hábiles contados desde la fecha en que se recibió la solicitud. De resultar procedente, se hará efectiva dentro de los 15 (quince) días hábiles siguientes.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">7. Limitación de Uso y Divulgación de la Información</h2>
            <p>
              Si usted desea limitar el uso o divulgación de sus datos (por ejemplo, para dejar de recibir correos publicitarios), puede inscribirse en el Registro Público para Evitar Publicidad (REPEP) de la Procuraduría Federal del Consumidor (PROFECO). Adicionalmente, puede solicitar su inscripción en nuestro listado de exclusión interno enviando un correo a <a href="mailto:privacidad@lugare.mx" className="text-primary hover:underline">privacidad@lugare.mx</a>.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">8. Uso de Cookies, Web Beacons y Tecnologías Similares</h2>
            <p>
              Le informamos que en nuestra Plataforma utilizamos cookies, web beacons y otras tecnologías a través de las cuales es posible monitorear su comportamiento como usuario de Internet, brindarle un mejor servicio y experiencia al navegar en nuestra página, así como ofrecerle nuevos productos y servicios basados en sus preferencias.
            </p>
            <p>
              Los datos personales que obtenemos de estas tecnologías de rastreo incluyen: identificadores de sesión, tipo de navegador, sistema operativo, idioma, páginas visitadas y dirección IP. Estas tecnologías podrán deshabilitarse consultando las opciones de privacidad y seguridad de su navegador de Internet (ej. Chrome, Safari, Firefox).
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">9. Medidas de Seguridad y Conservación</h2>
            <p>
              Lugare ha implementado y mantiene estrictas medidas de seguridad administrativas, técnicas y físicas, consistentes en protocolos de encriptación de datos en tránsito y en reposo (ej. certificados SSL/TLS), controles de acceso biométricos e informáticos, y políticas internas de privacidad, con el objetivo de proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado.
            </p>
            <p>
              Conservaremos sus datos personales durante el tiempo que mantenga su cuenta activa en la Plataforma, y posteriormente, por los plazos de prescripción legales aplicables (materia fiscal, comercial y civil) para cumplir con obligaciones normativas y defender a Lugare ante posibles reclamaciones.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">10. Modificaciones al Aviso de Privacidad</h2>
            <p>
              Lugare se reserva el derecho de efectuar en cualquier momento modificaciones, actualizaciones o adiciones al presente Aviso de Privacidad, derivadas de nuevos requerimientos legales; de nuestras propias necesidades por los servicios que ofrecemos; de nuestras prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas.
            </p>
            <p>
              Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso, a través de una notificación genérica publicada en la página principal de nuestra Plataforma web y aplicación móvil, así como mediante un mensaje enviado al correo electrónico que usted tenga registrado.
            </p>

            <h2 className="font-display font-bold text-xl mt-8 mb-3">11. Autoridad Competente</h2>
            <p>
              Si usted considera que su derecho a la protección de datos personales ha sido lesionado por alguna conducta u omisión de nuestra parte, o presume alguna violación a las disposiciones previstas en la LFPDPPP, podrá interponer su inconformidad o denuncia ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI). Para mayor información, le sugerimos visitar su sitio web oficial: <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.inai.org.mx</a>.
            </p>

            <p className="mt-10 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-medium">
              Al crear una cuenta, navegar, registrar espacios o realizar transacciones en la Plataforma Lugare, usted reconoce que ha leído, comprendido y aceptado incondicionalmente los términos expuestos en este Aviso de Privacidad Integral.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
