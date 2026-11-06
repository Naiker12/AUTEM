import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import { formatLotPrice, type Lot } from "@/features/lots";
import { buildWhatsAppReserveUrl, submitLead } from "@/lib/repositories/leads-repository";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

  // Normalizar manzana y datos para evitar duplicados
  const cleanManzana = lot?.manzana ? lot.manzana.replace(/^M\s*/i, "").trim() : "";
  const manzanaLabel = cleanManzana ? `Manzana ${cleanManzana}` : "";
  const ubicacion = (lot?.metadata?.ubicacion as string) || "CENTRAL";
  const initialPayment = lot && lot.price > 0 ? Math.round(lot.price * 0.2) : 0;

  // Auto-llenar el mensaje cuando cambia el lote o se abre el diálogo
  useEffect(() => {
    if (open && lot) {
      const defaultMsg = `Hola, deseo reservar el Lote ${lotDisplay} (${manzanaLabel || "Manzana " + cleanManzana}) de ${lot.area} m². Deseo recibir información sobre facilidades de pago y separación.`;
      setMessage((prev) => (prev.trim() === "" ? defaultMsg : prev));
    }
  }, [open, lot, lotDisplay, manzanaLabel, cleanManzana]);

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
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border border-border/80 bg-background/98 shadow-2xl backdrop-blur-xl">
        {/* Cabecera elegante con Badge de Disponibilidad */}
        <DialogHeader className="border-b border-border/60 bg-muted/15 px-6 pt-6 pb-5 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b58e50]">
              {projectName.toUpperCase()} · RESERVA Y PRIORIDAD
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-700/50 text-[11px] font-bold shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DISPONIBLE
            </span>
          </div>

          <DialogTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            {submitted ? "¡Solicitud registrada!" : `Reservar Lote ${lotDisplay}`}
          </DialogTitle>

          {/* Tarjeta de Resumen del Lote (4 métricas) */}
          {lot && !submitted && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl border border-border/60 bg-muted/30">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  {manzanaLabel ? `${manzanaLabel.toUpperCase()} · ` : ""}{ubicacion.toUpperCase()}
                </div>
                <div className="font-serif text-base sm:text-lg font-bold text-foreground mt-0.5">
                  Lote {lotDisplay}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  ÁREA
                </div>
                <div className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                  {lot.area} m²
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  PRECIO
                </div>
                <div className="text-sm sm:text-base font-bold text-[#b58e50] dark:text-[#d4af37] mt-0.5">
                  {formatLotPrice(lot.price)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  INICIAL (20%)
                </div>
                <div className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                  {initialPayment > 0 ? formatLotPrice(initialPayment) : "A convenir"}
                </div>
              </div>
            </div>
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
          /* Formulario refinado según especificación */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-6 pt-4">
            {/* Aviso informativo de Sin cobro inmediato y prioridad 48h */}
            <div className="rounded-2xl border border-emerald-300/70 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/25 p-3 flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
              <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-300">
                <Clock className="size-4" />
              </div>
              <p className="text-xs font-medium leading-relaxed">
                <strong className="font-bold">Sin cobro inmediato:</strong> Aseguras prioridad
                exclusiva por 48 horas y un asesor te contacta con la documentación oficial.
              </p>
            </div>

            {/* Lote a reservar auto-asignado */}
            {lot && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-accent" />
                    Lote a reservar
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Auto-asignado
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5">
                  <span className="text-xs sm:text-sm font-semibold text-foreground truncate pr-2">
                    Lote {lotDisplay} · {manzanaLabel} · {lot.area} m² · {formatLotPrice(lot.price)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-amber-100/80 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:text-amber-300 shrink-0">
                    <Lock className="size-3" />
                    Lote {lotDisplay}
                  </span>
                </div>
              </div>
            )}

            {/* Nombre completo */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="reserve-name"
                  className="font-semibold text-foreground flex items-center gap-1.5"
                >
                  <User className="size-3.5 text-muted-foreground" />
                  Nombre completo
                </label>
                <span className="text-rose-500 font-semibold text-[11px]">Requerido</span>
              </div>
              <Input
                id="reserve-name"
                required
                placeholder="Ej. Carlos Ramírez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-xl border-border/70 bg-muted/20 px-3.5 text-sm focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            {/* Teléfono y Correo en 2 columnas */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="reserve-phone"
                    className="font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Phone className="size-3.5 text-muted-foreground" />
                    WhatsApp / Celular
                  </label>
                  <span className="text-rose-500 font-semibold text-[11px]">Requerido</span>
                </div>
                <Input
                  id="reserve-phone"
                  required
                  type="tel"
                  placeholder="Ej. 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-muted/20 px-3.5 text-sm focus-visible:ring-1 focus-visible:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="reserve-email"
                    className="font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Mail className="size-3.5 text-muted-foreground" />
                    Correo electrónico
                  </label>
                  <span className="text-muted-foreground text-[11px]">Opcional</span>
                </div>
                <Input
                  id="reserve-email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-muted/20 px-3.5 text-sm focus-visible:ring-1 focus-visible:ring-accent"
                />
              </div>
            </div>

            {/* Fecha estimada de visita */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="reserve-date"
                  className="font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Calendar className="size-3.5 text-muted-foreground" />
                  ¿Cuándo deseas visitar el proyecto o agendar llamada?
                </label>
                <span className="text-muted-foreground text-[11px]">Opcional</span>
              </div>
              <Input
                id="reserve-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-10 rounded-xl border-border/70 bg-muted/20 px-3.5 text-sm focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            {/* Mensaje o consulta adicional */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="reserve-message"
                  className="font-semibold text-foreground flex items-center gap-1.5"
                >
                  <MessageSquare className="size-3.5 text-muted-foreground" />
                  Mensaje o consulta adicional
                </label>
                <span className="text-muted-foreground text-[11px]">Opcional</span>
              </div>
              <Textarea
                id="reserve-message"
                rows={2}
                placeholder="¿Tienes alguna duda sobre formas de pago o ubicación?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border-border/70 bg-muted/20 p-2.5 text-xs resize-none focus-visible:ring-1 focus-visible:ring-accent leading-relaxed"
              />
            </div>

            {/* Habeas Data en tarjeta estilizada */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-start gap-2.5">
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
                className="text-[11px] leading-snug text-muted-foreground cursor-pointer select-none"
              >
                Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 (Habeas
                Data) para ser contactado por un asesor de AUTEM y {projectName}.
              </label>
            </div>

            {/* Footer con botones */}
            <div className="mt-2 flex items-center justify-end gap-3 border-t border-border/50 pt-3">
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
                className="h-10 gap-2 rounded-2xl bg-[#d6be9a] hover:bg-[#c9b08a] px-6 text-xs font-bold text-[#352717] shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
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
