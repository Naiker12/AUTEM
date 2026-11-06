import React, { useState } from "react";
import { Calendar, CheckCircle2, Mail, MessageSquare, Phone, Send, User } from "lucide-react";
import { formatLotPrice, type Lot } from "@/features/lots";
import { buildWhatsAppReserveUrl, submitLead } from "@/lib/repositories/leads-repository";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReserveLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: Lot | null;
  projectName?: string;
  projectId?: string;
  source?: string;
}

export default function ReserveLotDialog({
  open,
  onOpenChange,
  lot,
  projectName = "Villa Paraíso",
  projectId = "00000000-0000-0000-0000-000000000101",
  source = "plano",
}: ReserveLotDialogProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  const lotDisplay = lot?.id.replace(/^L-/, "") || "";

  // Normalizar manzana para evitar duplicados como "Manzana M 12"
  const cleanManzana = lot?.manzana ? lot.manzana.replace(/^M\s*/i, "").trim() : "";
  const manzanaLabel = cleanManzana ? `Manzana ${cleanManzana}` : "";
  const initialPayment = lot && lot.price > 0 ? Math.round(lot.price * 0.2) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !consent) return;

    setIsSubmitting(true);
    try {
      await submitLead({
        projectId,
        lotExternalId: lot?.id,
        lotNumber: lotDisplay ? parseInt(lotDisplay, 10) || undefined : undefined,
        intent: "reserve",
        fullName,
        phone,
        email,
        message,
        visitDate,
        source,
      });

      const waUrl = buildWhatsAppReserveUrl({
        fullName,
        phone,
        lotNumber: lotDisplay,
        projectName,
        areaM2: lot?.area,
        priceCop: lot?.price,
        visitDate,
      });

      setWhatsAppUrl(waUrl);
      setSubmitted(true);
    } catch (err) {
      console.error("Error al registrar solicitud:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setFullName("");
      setPhone("");
      setEmail("");
      setVisitDate("");
      setMessage("");
      setConsent(true);
    }, 300);
  };

  const isValid = fullName.trim().length > 0 && phone.trim().length > 0 && consent;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border border-border/80 bg-background/98 shadow-2xl backdrop-blur-xl">
        {/* Cabecera limpia y elegante (sin tarjetas amontonadas) */}
        <DialogHeader className="border-b border-border/60 bg-muted/15 px-6 pt-6 pb-4 text-left">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {projectName} · Solicitud de Reserva
          </span>
          <DialogTitle className="font-serif text-2xl font-bold tracking-tight text-foreground mt-0.5">
            {submitted ? "¡Solicitud registrada!" : `Reservar Lote ${lotDisplay}`}
          </DialogTitle>
          {lot && !submitted && (
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {manzanaLabel ? `${manzanaLabel} · ` : ""}
              <strong className="text-foreground">{lot.area} m²</strong>
              {lot.price > 0 && (
                <>
                  {" · "}
                  <strong className="text-accent">{formatLotPrice(lot.price)}</strong>
                  {initialPayment > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      (Inicial 20%: {formatLotPrice(initialPayment)})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        {submitted ? (
          /* Pantalla de Éxito / WhatsApp */
          <div className="flex flex-col items-center p-7 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-6 ring-emerald-500/5">
              <CheckCircle2 className="size-7" />
            </div>

            <h3 className="font-serif text-xl font-bold text-foreground">
              ¡Solicitud recibida, {fullName.split(" ")[0]}!
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Tu intención de compra sobre el <strong>Lote {lotDisplay}</strong> ha quedado
              guardada. Para coordinar el plano oficial y opciones de pago con tu asesor:
            </p>

            <div className="mt-5 flex w-full flex-col gap-2.5">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
              >
                <MessageSquare className="size-4" />
                <span>Continuar por WhatsApp</span>
              </a>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
              >
                Cerrar y seguir en el plano
              </Button>
            </div>
          </div>
        ) : (
          /* Formulario limpio, compacto y refinado */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-6">
            {/* Nombre completo */}
            <div className="space-y-1">
              <label htmlFor="reserve-name" className="text-xs font-medium text-foreground">
                Nombre completo <span className="text-rose-500">*</span>
              </label>
              <Input
                id="reserve-name"
                required
                placeholder="Ej. Carlos Ramírez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-xl border-border/70 bg-muted/20 px-3 text-sm focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            {/* Teléfono y Correo en 2 columnas */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="reserve-phone" className="text-xs font-medium text-foreground">
                  WhatsApp / Celular <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="reserve-phone"
                  required
                  type="tel"
                  placeholder="300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-muted/20 px-3 text-sm focus-visible:ring-1 focus-visible:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reserve-email" className="text-xs font-medium text-foreground">
                  Correo <span className="text-muted-foreground text-[10px]">(Opcional)</span>
                </label>
                <Input
                  id="reserve-email"
                  type="email"
                  placeholder="carlos@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-muted/20 px-3 text-sm focus-visible:ring-1 focus-visible:ring-accent"
                />
              </div>
            </div>

            {/* Fecha estimada de visita */}
            <div className="space-y-1">
              <label htmlFor="reserve-date" className="text-xs font-medium text-foreground">
                ¿Cuándo deseas visitar el proyecto?{" "}
                <span className="text-muted-foreground text-[10px]">(Opcional)</span>
              </label>
              <Input
                id="reserve-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-10 rounded-xl border-border/70 bg-muted/20 px-3 text-sm focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            {/* Mensaje opcional */}
            <div className="space-y-1">
              <label htmlFor="reserve-message" className="text-xs font-medium text-foreground">
                Mensaje o consulta{" "}
                <span className="text-muted-foreground text-[10px]">(Opcional)</span>
              </label>
              <Textarea
                id="reserve-message"
                rows={2}
                placeholder="¿Tienes alguna pregunta sobre formas de pago o ubicación?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border-border/70 bg-muted/20 p-2.5 text-xs resize-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            {/* Habeas Data limpio (sin caja gigante) */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="reserve-consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-accent focus:ring-accent/30 cursor-pointer accent-accent"
              />
              <label
                htmlFor="reserve-consent"
                className="text-[11px] leading-tight text-muted-foreground cursor-pointer select-none"
              >
                Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 para ser
                contactado por un asesor de {projectName}.
              </label>
            </div>

            {/* Footer con botones */}
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-xl px-4 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="h-10 gap-1.5 rounded-xl bg-accent px-5 text-xs font-bold text-accent-foreground shadow-sm hover:bg-accent/90 disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Enviando…</span>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Confirmar reserva</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
