import TarjetaBeneficios from "./TarjetaBeneficios";
import FormularioContacto from "./FormularioContacto";
import { Card, CardContent } from "@/components/ui/card";
import SectionMeasureLine from "@/components/SectionMeasureLine";
import Container from "@/components/layout/Container";

export default function SeccionContacto() {
  return (
    <section
      id="contacto"
      className="contact-section relative overflow-hidden border-t border-border bg-background py-16 text-foreground md:py-20"
    >
      <SectionMeasureLine index={4} total={4} label="Contacto" />
      <div className="contact-section__glow pointer-events-none absolute -right-32 top-0 size-[480px] rounded-full bg-accent/[0.08] blur-[140px]" />
      <Container className="section-scroll-content relative px-5 sm:px-8 lg:px-12">
        <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/78 shadow-[0_28px_90px_rgba(35,28,18,.12)] backdrop-blur-xl dark:bg-card/62">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-6 py-4 sm:px-8 lg:px-10">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-accent">
              Asesoría privada AUTEM
            </p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Cartagena · Colombia
            </p>
          </div>
          <CardContent className="grid p-0 lg:grid-cols-12">
            <div className="border-b border-border/70 p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r lg:p-10 xl:p-12">
              <TarjetaBeneficios />
            </div>
            <div className="p-6 sm:p-8 lg:col-span-7 lg:p-10 xl:p-12">
              <FormularioContacto />
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
