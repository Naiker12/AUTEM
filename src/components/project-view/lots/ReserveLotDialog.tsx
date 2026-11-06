import React, { useState } from "react";
import { CheckCircle2, MessageSquare, Send, ShieldCheck, X } from "lucide-react";
import { formatLotPrice, type Lot } from "@/features/lots";
import { buildWhatsAppReserveUrl, submitLead } from "@/lib/leads-repository";
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
    // Reset state after dialog closes
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl">
        <DialogHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-accent">
            <span>{projectName}</span>
            <span>·</span>
            <span>Reserva Oficial</span>
          </div>
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            {submitted ? "¡Solicitud recibida!" : `Reservar Lote ${lotDisplay}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {submitted
              ? "Tu intención de compra ha quedado registrada en el sistema."
              : lot
                ? `${lot.manzana ? `Manzana ${lot.manzana} · ` : ""}${lot.area} m² · ${
                    lot.price > 0 ? formatLotPrice(lot.price) : "Precio lista"
                  }`
                : "Completa tus datos para iniciar el proceso de separación."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>

            <h3 className="font-serif text-xl font-medium text-foreground">
              ¡Gracias, {fullName.split(" ")[0]}!
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Hemos registrado tu solicitud para el <strong>Lote {lotDisplay}</strong>. Para darte
              prioridad y coordinar los detalles con un asesor de AUTEM, continúa por WhatsApp
              ahora:
            </p>

            <div className="mt-6 flex w-full flex-col gap-2.5">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="size-4" />
                <span>Continuar por WhatsApp</span>
              </a>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-full text-xs text-muted-foreground"
              >
                Cerrar y seguir explorando el plano
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="reserve-name" className="text-xs font-semibold text-foreground">
                  Nombre completo <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="reserve-name"
                  required
                  placeholder="Ej. Carlos Ramírez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl bg-background/60"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reserve-phone" className="text-xs font-semibold text-foreground">
                  Celular / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="reserve-phone"
                  required
                  type="tel"
                  placeholder="Ej. 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl bg-background/60"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reserve-email" className="text-xs font-semibold text-foreground">
                  Correo electrónico{" "}
                  <span className="text-muted-foreground text-[10px]">(Opcional)</span>
                </label>
                <Input
                  id="reserve-email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl bg-background/60"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="reserve-date" className="text-xs font-semibold text-foreground">
                  ¿Cuándo deseas visitar el proyecto?{" "}
                  <span className="text-muted-foreground text-[10px]">(Opcional)</span>
                </label>
                <Input
                  id="reserve-date"
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="rounded-xl bg-background/60"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="reserve-message" className="text-xs font-semibold text-foreground">
                  Mensaje o consulta adicional{" "}
                  <span className="text-muted-foreground text-[10px]">(Opcional)</span>
                </label>
                <Textarea
                  id="reserve-message"
                  rows={2}
                  placeholder="¿Tienes alguna duda sobre formas de pago o ubicación?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-xl bg-background/60 text-xs resize-none"
                />
              </div>
            </div>

            <div className="mt-1 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3">
              <input
                id="reserve-consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-accent focus:ring-accent"
              />
              <label
                htmlFor="reserve-consent"
                className="text-[11px] leading-tight text-muted-foreground cursor-pointer select-none"
              >
                Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 (Habeas
                Data) para ser contactado por un asesor de AUTEM.
              </label>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-full text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !fullName.trim() || !phone.trim() || !consent}
                className="gap-2 rounded-full bg-accent px-5 font-bold text-accent-foreground hover:bg-accent/90 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <span>Registrando…</span>
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
