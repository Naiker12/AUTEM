import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validation";
import { useContactForm } from "@/hooks/useContactForm";
import { Send, User, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FormularioContacto() {
  const contactForm = useContactForm();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  return (
    <Card className="rounded-[1.5rem] border-border/70 bg-background/55 shadow-none">
      <CardHeader className="border-b border-border/70 p-5 sm:p-6">
        <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-accent">
          Solicitud confidencial
        </p>
        <CardTitle className="font-serif text-2xl font-normal tracking-[-0.025em] sm:text-3xl">
          Agendar consultoría privada
        </CardTitle>
        <p className="text-[11px] leading-5 text-muted-foreground">
          Cuéntanos qué estás buscando y prepararemos una orientación personalizada.
        </p>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            if (formData.get("website")) return;
            handleSubmit((data) => {
              contactForm.handleSubmit({
                name: data.name,
                email: data.email,
                message: data.message,
              });
            })(e);
          }}
        >
          {/* Anti-spam */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <label htmlFor="website">No llenes esto</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {/* Campo Nombre */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              <User size={12} /> Nombre completo
            </label>
            <Input
              {...register("name")}
              type="text"
              placeholder="Ej. María Elena Vargas"
              className="h-11 rounded-xl border-border bg-card/65 px-3.5 text-xs shadow-none placeholder:text-muted-foreground/65 focus-visible:border-accent focus-visible:ring-accent/20 md:text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Campo Correo */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              <Mail size={12} /> Correo electrónico
            </label>
            <Input
              {...register("email")}
              type="email"
              placeholder="inversionista@ejemplo.com"
              className="h-11 rounded-xl border-border bg-card/65 px-3.5 text-xs shadow-none placeholder:text-muted-foreground/65 focus-visible:border-accent focus-visible:ring-accent/20 md:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Campo Mensaje */}
          <div className="sm:col-span-2">
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              <MessageSquare size={12} /> Proyecto de interés / Mensaje
            </label>
            <Textarea
              {...register("message")}
              rows={3}
              placeholder="Me interesa recibir el dossier con los planos, ROI estimado y lista de precios..."
              className="min-h-24 resize-y rounded-xl border-border bg-card/65 px-3.5 py-3 text-xs shadow-none placeholder:text-muted-foreground/65 focus-visible:border-accent focus-visible:ring-accent/20 md:text-sm"
            />
            {errors.message && (
              <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.message.message}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-[10px] leading-relaxed text-muted-foreground sm:col-span-2">
            <input type="checkbox" required className="mt-0.5 accent-accent" />
            <span>
              Autorizo el tratamiento de mis datos para atender esta solicitud y entiendo que se
              abrirá WhatsApp para enviar el mensaje. Consulta la{" "}
              <a
                href={`${import.meta.env.BASE_URL}politica-privacidad`}
                className="text-accent underline"
              >
                Política de Privacidad
              </a>
              .
            </span>
          </label>

          {/* Botón de Envío */}
          <Button
            type="submit"
            disabled={contactForm.status === "sending"}
            className="h-12 w-full rounded-xl bg-accent text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground shadow-[0_12px_28px_rgba(197,160,89,.2)] hover:bg-accent/90 sm:col-span-2"
          >
            {contactForm.status === "sent" ? (
              <>
                <CheckCircle2 size={16} />
                <span>✓ Mensaje Enviado Correctamente</span>
              </>
            ) : contactForm.status === "sending" ? (
              <span>Enviando información...</span>
            ) : (
              <>
                <Send size={14} />
                <span>Agendar Consultoría Privada</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
