import { useState, useCallback } from "react";
import { WHATSAPP_BASE_URL } from "@/data/constants";

type ContactStatus = "idle" | "sending" | "sent" | "error";

export function useContactForm(defaultMessage?: string) {
  const [status, setStatus] = useState<ContactStatus>("idle");

  const buildWhatsAppUrl = useCallback(
    (fields: { name?: string; email?: string; phone?: string; message?: string }) => {
      let text = defaultMessage || "Hola AUTEM, me gustaría recibir más información.";
      if (!defaultMessage) {
        const parts: string[] = [];
        if (fields.name) parts.push(`Soy ${fields.name}.`);
        if (fields.email) parts.push(`Mi correo es ${fields.email}.`);
        if (fields.phone) parts.push(`Mi teléfono es ${fields.phone}.`);
        if (fields.message) parts.push(fields.message);
        text = `Hola AUTEM, me gustaría recibir más información. ${parts.join(" ")}`.trim();
      }
      return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(text)}`;
    },
    [defaultMessage],
  );

  const handleSubmit = useCallback(
    (fields: { name?: string; email?: string; phone?: string; message?: string }) => {
      setStatus("sending");
      try {
        const url = buildWhatsAppUrl(fields);
        window.open(url, "_blank", "noopener,noreferrer");
        setStatus("sent");
      } catch {
        setStatus("error");
      }
    },
    [buildWhatsAppUrl],
  );

  const reset = useCallback(() => setStatus("idle"), []);

  return { status, handleSubmit, reset } as const;
}
