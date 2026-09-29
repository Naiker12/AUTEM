import { type FormEvent, useEffect, useId, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock3, LoaderCircle, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";

import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

interface AdminPasswordRecoveryProps {
  onRequestCode: (email: string) => Promise<void>;
  onVerifyCode: (email: string, code: string) => Promise<void>;
}

const CODE_LENGTH = 8;
const CODE_EXPIRY_SECONDS = 60 * 60;
const RESEND_DELAY_SECONDS = 60;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function AdminPasswordRecovery({ onRequestCode, onVerifyCode }: AdminPasswordRecoveryProps) {
  const navigate = useNavigate();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(CODE_EXPIRY_SECONDS);
  const [resendSeconds, setResendSeconds] = useState(RESEND_DELAY_SECONDS);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isSent) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isSent]);

  const sendCode = async (address: string, isResend = false) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await onRequestCode(address);
      setEmail(address);
      setCode("");
      setIsSent(true);
      setRemainingSeconds(CODE_EXPIRY_SECONDS);
      setResendSeconds(RESEND_DELAY_SECONDS);
      toast.success(isResend ? "Código reenviado" : "Código enviado", {
        description: "Revisa tu correo para continuar la recuperación.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible enviar el código.";
      setErrorMessage(message);
      toast.error("No fue posible enviar el código", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    await sendCode(normalizedEmail);
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length !== CODE_LENGTH || remainingSeconds === 0) return;

    setErrorMessage("");
    setIsVerifying(true);
    try {
      await onVerifyCode(email, code);
      toast.success("Código verificado", {
        description: "Ahora puedes crear tu contraseña nueva.",
      });
      await navigate({ to: "/actualizar-contrasena" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible validar el código.";
      setErrorMessage(message);
      toast.error("No fue posible verificar el código", { description: message });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-svh bg-[#f6f1eb] p-4 text-[#403a34] sm:p-6 lg:grid lg:grid-cols-2 lg:p-0">
      <section className="relative hidden min-h-svh overflow-hidden bg-[#403a34] lg:block">
        <div className="admin-login-brand-wall absolute inset-0" aria-hidden="true" />
        <div className="relative flex h-full items-center justify-center p-10 xl:p-14">
          <Link
            to="/"
            aria-label="AUTEM, volver al inicio"
            className="flex flex-col items-center text-center"
          >
            <span className="admin-login-brand-mark flex size-32 items-center justify-center rounded-full xl:size-36">
              <AutemBrandIcon size={88} />
            </span>
            <span className="admin-login-brand-rule mt-8" aria-hidden="true" />
            <span className="mt-7 flex font-serif text-[clamp(5rem,9.5vw,9.5rem)] font-normal leading-[0.84] tracking-[-0.07em]">
              {"AUTEM".split("").map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  aria-hidden="true"
                  className="admin-login-brand-letter"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  {letter}
                </span>
              ))}
            </span>
            <span className="admin-login-brand-tagline mt-7">Arquitectura y territorio</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-md flex-col justify-center py-10 lg:min-h-svh lg:px-10">
        <Link
          to="/login-admin"
          className="mb-auto inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#403a34]/65 transition-colors hover:text-[#403a34]"
        >
          <ArrowLeft className="size-3.5" /> Volver al acceso
        </Link>
        <div className="my-auto w-full">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <AutemBrandIcon size={36} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">AUTEM</span>
          </div>
          {isSent ? (
            <form className="flex flex-col gap-5" onSubmit={handleVerify}>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e682b]">
                  Código enviado
                </p>
                <h1 className="mt-3 text-4xl leading-tight">Verifica tu correo</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                  Escribe el código de 8 dígitos enviado a{" "}
                  <span className="font-medium text-[#403a34]">{email}</span>.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-[#403a34]/15 bg-white/60 p-5">
                <Label className="text-sm font-medium text-[#403a34]">Código de verificación</Label>
                <InputOTP
                  maxLength={CODE_LENGTH}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={code}
                  onChange={setCode}
                  disabled={isVerifying || remainingSeconds === 0}
                  aria-invalid={Boolean(errorMessage)}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    {[4, 5, 6, 7].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <p className="flex items-center justify-center gap-2 text-xs text-[#555555]">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {remainingSeconds > 0
                    ? `El código vence en ${formatTime(remainingSeconds)}.`
                    : "El código venció."}
                </p>
              </div>
              <Button
                type="submit"
                disabled={code.length !== CODE_LENGTH || isVerifying || remainingSeconds === 0}
                className="h-11 w-full rounded-2xl bg-[#403a34] text-xs font-semibold uppercase tracking-[0.16em] text-[#f6f1eb] shadow-none hover:bg-[#27231f]"
              >
                {isVerifying ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : (
                  <ShieldCheck data-icon="inline-start" />
                )}
                {isVerifying ? "Verificando" : "Continuar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting || resendSeconds > 0}
                onClick={() => void sendCode(email, true)}
                className="h-10 text-xs text-[#555555] hover:bg-transparent hover:text-[#403a34]"
              >
                {isSubmitting ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                {resendSeconds > 0 ? `Reenviar en ${resendSeconds}s` : "Reenviar código"}
              </Button>
              {errorMessage && (
                <p className="text-sm leading-relaxed text-destructive">{errorMessage}</p>
              )}
            </form>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e682b]">
                  Recuperar acceso
                </p>
                <h1 className="mt-3 text-4xl leading-tight">Recupera tu acceso</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                  Escribe tu correo y te enviaremos un código seguro para crear una contraseña
                  nueva.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={emailId} className="text-sm font-medium text-[#403a34]">
                  Correo electrónico
                </Label>
                <Input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl border-[#403a34]/20 bg-white/70 px-4 shadow-none focus-visible:ring-[#c5a059]"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-2xl bg-[#403a34] text-xs font-semibold uppercase tracking-[0.16em] text-[#f6f1eb] shadow-none hover:bg-[#27231f]"
              >
                {isSubmitting ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : (
                  <MailCheck data-icon="inline-start" />
                )}
                {isSubmitting ? "Enviando" : "Enviar código"}
              </Button>
              {errorMessage && (
                <p className="text-sm leading-relaxed text-destructive">{errorMessage}</p>
              )}
            </form>
          )}
        </div>
        <p className="mt-10 text-xs leading-relaxed text-[#555555]">
          Por seguridad, cada código vence y solo puede utilizarse una vez.
        </p>
      </section>
    </main>
  );
}
