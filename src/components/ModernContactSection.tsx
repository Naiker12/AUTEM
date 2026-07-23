import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validation";
import { useContactForm } from "@/hooks/useContactForm";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import {
  Send,
  ShieldCheck,
  MessageCircle,
  Clock,
  MapPin,
  Sparkles,
  User,
  Mail,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export default function ModernContactSection() {
  const contactForm = useContactForm();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const whatsappDirectUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent("Hola AUTEM, me interesa recibir asesoría privada sobre sus proyectos en Cartagena y Bolívar.");

  return (
    <section
      id="contacto"
      data-animate
      className="relative border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-100/50 dark:bg-stone-900/30 py-16 md:py-24 opacity-0 overflow-hidden"
    >
      
      {/* Container: Compact Dark Obsidian Luxury Card without heavy drop shadows */}
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-stone-950 text-white p-6 md:p-10 shadow-xl backdrop-blur-xl">

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-center">
            
            {/* Left Column: VIP Information & Value Proposition (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
                  <Sparkles size={11} className="animate-pulse" />
                  AUTEM Private Advisory
                </span>

                <h2 className="mt-3 font-serif text-2xl font-light leading-tight text-stone-100 md:text-3xl lg:text-4xl">
                  Hablemos de tu <br className="hidden md:block" />
                  <span className="italic font-normal text-accent">próxima inversión</span>.
                </h2>

                <p className="mt-3 text-xs leading-relaxed text-stone-300 font-light">
                  Asesoría privada para la adquisición de propiedades exclusivas en Cartagena, Barú y Turbaco con gestión fiduciaria y licencias turísticas.
                </p>
              </div>

              {/* VIP Perks */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:border-accent/40">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Respuesta en menos de 24h</h4>
                    <p className="text-[10px] text-stone-400">Un consultor especializado te contactará personalmente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:border-accent/40">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Confidencialidad Garantizada (NDA)</h4>
                    <p className="text-[10px] text-stone-400">Tratamiento privado de información para inversionistas.</p>
                  </div>
                </div>

                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-400 transition-all hover:bg-emerald-900/50 hover:border-emerald-500/60"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle size={18} className="text-emerald-400 animate-bounce" />
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider">Atención VIP por WhatsApp</span>
                      <span className="text-[9px] text-emerald-300/80">Asesor disponible ahora en línea</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold">→</span>
                </a>
              </div>

              {/* Office Location Footer */}
              <div className="border-t border-white/10 pt-3 text-[10px] text-stone-400 flex items-center gap-2">
                <MapPin size={12} className="text-accent shrink-0" />
                <span>Bocagrande, Av. San Martín 10-45 · Cartagena de Indias</span>
              </div>
            </div>

            {/* Right Column: Modern Glass Form Card (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-white/15 bg-white/5 p-5 md:p-7 backdrop-blur-xl">
                
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
                  {/* Honeypot anti-spam */}
                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label htmlFor="website">No llenes esto</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  {/* Input 1: Nombre */}
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
                      <User size={11} /> Nombre completo
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      placeholder="Ej. María Elena Vargas"
                      className="w-full rounded-lg border border-white/15 bg-stone-900/80 px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-stone-500 backdrop-blur-md transition-all focus:border-accent focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                    {errors.name && (
                      <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Input 2: Correo Electrónico */}
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
                      <Mail size={11} /> Correo electrónico
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="inversionista@ejemplo.com"
                      className="w-full rounded-lg border border-white/15 bg-stone-900/80 px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-stone-500 backdrop-blur-md transition-all focus:border-accent focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                    {errors.email && (
                      <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Input 3: Mensaje */}
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
                      <MessageSquare size={11} /> Proyecto de interés / Mensaje
                    </label>
                    <textarea
                      {...register("message")}
                      rows={2.5}
                      placeholder="Me interesa recibir el dossier con los planos, ROI estimado y lista de precios..."
                      className="w-full rounded-lg border border-white/15 bg-stone-900/80 px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-stone-500 backdrop-blur-md transition-all focus:border-accent focus:bg-stone-950 focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                    {errors.message && (
                      <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={contactForm.status === "sending"}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-all hover:bg-accent/90 hover:shadow-[0_0_22px_rgba(197,160,89,0.5)] hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                  >
                    {contactForm.status === "sent" ? (
                      <>
                        <CheckCircle2 size={15} />
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
                    Al enviar este formulario aceptas nuestra política de confidencialidad y datos.
                  </p>

                </form>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
