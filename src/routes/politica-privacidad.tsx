import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/politica-privacidad")({
  component: PoliticaPrivacidad,
});

function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      <Navbar variant="inner" />

      <main id="main-content" className="mx-auto max-w-3xl px-6 pt-32 pb-20 md:px-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Legal</span>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">Política de Privacidad</h1>
        <p className="mt-2 text-xs text-muted-foreground">Última actualización: julio 2026</p>

        <div className="prose-sm mt-10 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-foreground">1. Información que recopilamos</h2>
            <p className="mt-2">
              AUTEM recopila información que usted nos proporciona directamente al completar
              formularios de contacto, incluyendo nombre, correo electrónico, número de teléfono y
              mensaje. También recopilamos datos de navegación de forma automática (IP, tipo de
              navegador, páginas visitadas) mediante herramientas de analítica.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">2. Uso de la información</h2>
            <p className="mt-2">
              Utilizamos su información para: (a) responder a sus consultas y proporcionar asesoría
              personalizada sobre propiedades; (b) enviar información sobre nuevos lanzamientos y
              oportunidades de inversión si usted ha dado su consentimiento; (c) mejorar nuestro
              sitio web y servicios; (d) cumplir con obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">
              3. Cookies y tecnologías de rastreo
            </h2>
            <p className="mt-2">
              Utilizamos cookies y tecnologías similares para mejorar su experiencia de navegación,
              analizar el tráfico del sitio y personalizar el contenido. Puede configurar su
              navegador para rechazar cookies, aunque esto podría afectar la funcionalidad del
              sitio. Al continuar navegando, usted acepta el uso de cookies conforme se describe en
              esta política.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">
              4. Compartir información con terceros
            </h2>
            <p className="mt-2">
              No vendemos ni compartimos su información personal con terceros, excepto cuando sea
              necesario para: (a) cumplir con un requisito legal; (b) proteger los derechos de
              AUTEM; (c) con proveedores de servicios que nos ayudan a operar el sitio (por ejemplo,
              proveedores de correo electrónico), bajo acuerdos de confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">5. Sus derechos</h2>
            <p className="mt-2">
              Usted tiene derecho a: (a) acceder a su información personal; (b) solicitar la
              corrección o eliminación de sus datos; (c) oponerse al procesamiento de sus datos; (d)
              solicitar la portabilidad de sus datos. Para ejercer estos derechos, contáctenos en{" "}
              <span className="text-foreground">hola@autem.es</span>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">6. Seguridad de los datos</h2>
            <p className="mt-2">
              Implementamos medidas de seguridad técnicas y organizativas para proteger su
              información personal contra acceso no autorizado, pérdida o alteración. Sin embargo,
              ningún método de transmisión por Internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">7. Retención de datos</h2>
            <p className="mt-2">
              Conservamos su información personal solo durante el tiempo necesario para los fines
              para los que fue recopilada, o según lo requiera la legislación aplicable en Colombia.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">8. Cambios en esta política</h2>
            <p className="mt-2">
              Nos reservamos el derecho de actualizar esta política de privacidad en cualquier
              momento. Los cambios serán publicados en esta página con la fecha de última
              actualización.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground">9. Contacto</h2>
            <p className="mt-2">
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos en:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Correo: <span className="text-foreground">hola@autem.es</span>
              </li>
              <li>
                Teléfono: <span className="text-foreground">+57 300 720 0894</span>
              </li>
              <li>Ubicación: Cartagena, Bolívar, Colombia</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
