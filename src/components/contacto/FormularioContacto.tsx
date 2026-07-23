import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validation";
import { useContactForm } from "@/hooks/useContactForm";
import { Send, User, Mail, MessageSquare, CheckCircle2 } from "lucide-react";

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
    <div className="rounded-xl border border-white/15 bg-white/5 p-6 md:p-8 backdrop-blur-xl shadow-xl">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-200">
        Agendar Consultoría Privada
      </h3>

      <form
        className="space-y-4"
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
          <input
            {...register("name")}
            type="text"
            placeholder="Ej. María Elena Vargas"
            className="w-full rounded-lg border border-white/20 bg-stone-900/90 px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-stone-400 focus:border-accent focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-accent/50"
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
          <input
            {...register("email")}
            type="email"
            placeholder="inversionista@ejemplo.com"
            className="w-full rounded-lg border border-white/20 bg-stone-900/90 px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-stone-400 focus:border-accent focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          {errors.email && (
            <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Campo Mensaje */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            <MessageSquare size={12} /> Proyecto de interés / Mensaje
          </label>
          <textarea
            {...register("message")}
            rows={3}
            placeholder="Me interesa recibir el dossier con los planos, ROI estimado y lista de precios..."
            className="w-full rounded-lg border border-white/20 bg-stone-900/90 px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-stone-400 focus:border-accent focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          {errors.message && (
            <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.message.message}</p>
          )}
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={contactForm.status === "sending"}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-[0_0_18px_rgba(197,160,89,0.35)] transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_rgba(197,160,89,0.6)] hover:scale-[1.01] active:scale-95 disabled:opacity-50"
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
        </button>

        <p className="text-center text-[9px] text-stone-400 font-light">
          Al enviar este formulario aceptas nuestra política de confidencialidad y tratamiento de datos.
        </p>
      </form>
    </div>
  );
}
