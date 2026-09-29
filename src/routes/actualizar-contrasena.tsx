import { type FormEvent, useEffect, useId, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { requireSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const passwordRules = [
  { label: "12 caracteres como mínimo", test: (value: string) => value.length >= 12 },
  { label: "Una letra mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /\d/.test(value) },
  { label: "Un símbolo", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function getPasswordStrength(completedRules: number) {
  if (completedRules <= 1) return { label: "Aún no es segura", value: 20 };
  if (completedRules <= 3) return { label: "Puede mejorar", value: 55 };
  if (completedRules === 4) return { label: "Casi lista", value: 80 };
  return { label: "Contraseña segura", value: 100 };
}

export const Route = createFileRoute("/actualizar-contrasena")({
  head: () => ({ meta: [{ title: "Actualizar contraseña | AUTEM" }] }),
  component: UpdatePasswordRoute,
});

function UpdatePasswordRoute() {
  const navigate = useNavigate();
  const passwordId = useId();
  const confirmationId = useId();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "success">("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const passwordRuleResults = passwordRules.map((rule) => ({
    ...rule,
    complete: rule.test(password),
  }));
  const completedRules = passwordRuleResults.filter((rule) => rule.complete).length;
  const passwordIsSecure = completedRules === passwordRules.length;
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const strength = getPasswordStrength(completedRules);

  useEffect(() => {
    let active = true;

    void requireSupabase()
      .auth.getUser()
      .then(({ data, error }) => {
        if (!active) return;
        setStatus(!error && data.user ? "ready" : "invalid");
      })
      .catch(() => {
        if (active) setStatus("invalid");
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!passwordIsSecure) {
      setErrorMessage("Completa todos los requisitos de seguridad antes de continuar.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) throw error;
      setStatus("success");
      window.setTimeout(() => void navigate({ to: "/admin" }), 900);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const sessionIsInvalid = message.includes("session") || message.includes("not authenticated");

      if (sessionIsInvalid) {
        setErrorMessage("El enlace ya no es válido. Solicita una nueva recuperación.");
        setStatus("invalid");
      } else {
        setErrorMessage(
          "La contraseña no cumple los requisitos de seguridad. Revisa que incluya mayúscula, minúscula, número y símbolo.",
        );
      }
    } finally {
      setIsSubmitting(false);
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

          {status === "checking" && (
            <div className="flex min-h-52 flex-col justify-center">
              <LoaderCircle className="size-5 animate-spin text-[#8e682b]" aria-hidden="true" />
              <p className="mt-4 text-sm text-[#555555]">Validando el enlace seguro…</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e682b]">
                  Enlace no disponible
                </p>
                <h1 className="mt-3 text-4xl leading-tight">Solicita uno nuevo</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                  Por seguridad, los enlaces de recuperación vencen y solo pueden usarse una vez.
                </p>
              </div>
              <Button
                asChild
                className="h-11 w-full rounded-2xl bg-[#403a34] text-xs font-semibold uppercase tracking-[0.16em] text-[#f6f1eb] hover:bg-[#27231f]"
              >
                <Link to="/login-admin">Ir al inicio de sesión</Link>
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle2 className="size-7 text-[#8e682b]" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e682b]">
                  Contraseña actualizada
                </p>
                <h1 className="mt-3 text-4xl leading-tight">Acceso protegido</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                  Redirigiendo al panel…
                </p>
              </div>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="mb-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e682b]">
                  Recuperación segura
                </p>
                <h1 className="mt-3 text-4xl leading-tight">Crea una contraseña nueva</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                  Elige una clave única, de al menos 12 caracteres.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-5">
                  <Field>
                    <PasswordField
                      id={passwordId}
                      label="Contraseña nueva"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword((current) => !current)}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                    />
                    <PasswordStrength
                      rules={passwordRuleResults}
                      completedRules={completedRules}
                      label={strength.label}
                      value={strength.value}
                    />
                  </Field>
                  <Field data-invalid={confirmation.length > 0 && !passwordsMatch}>
                    <PasswordField
                      id={confirmationId}
                      label="Confirmar contraseña"
                      value={confirmation}
                      onChange={setConfirmation}
                      show={showPassword}
                      onToggle={() => setShowPassword((current) => !current)}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      invalid={confirmation.length > 0 && !passwordsMatch}
                    />
                    {confirmation.length > 0 && (
                      <p
                        className={cn(
                          "flex items-center gap-2 text-xs",
                          passwordsMatch ? "text-[#6b5734]" : "text-destructive",
                        )}
                      >
                        {passwordsMatch ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Circle className="size-3.5" />
                        )}
                        {passwordsMatch
                          ? "Las contraseñas coinciden."
                          : "Las contraseñas no coinciden."}
                      </p>
                    )}
                  </Field>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !passwordIsSecure || !passwordsMatch}
                    className="h-11 w-full rounded-2xl bg-[#403a34] text-xs font-semibold uppercase tracking-[0.16em] text-[#f6f1eb] shadow-none hover:bg-[#27231f]"
                  >
                    {isSubmitting ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {isSubmitting ? "Actualizando" : "Guardar contraseña"}
                  </Button>
                  {errorMessage && <FieldError>{errorMessage}</FieldError>}
                </FieldGroup>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
  autoComplete,
  invalid = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled: boolean;
  autoComplete: "new-password";
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id} className="text-sm font-medium text-[#403a34]">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={12}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-11 rounded-2xl border-[#403a34]/20 bg-white/70 px-4 pr-11 shadow-none focus-visible:ring-[#c5a059]"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#555555] transition-colors hover:text-[#403a34]"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({
  rules,
  completedRules,
  label,
  value,
}: {
  rules: Array<{ label: string; complete: boolean }>;
  completedRules: number;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#403a34]/10 bg-white/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#403a34]">Seguridad</p>
        <p className="text-xs font-medium text-[#8e682b]">
          {completedRules}/{rules.length} · {label}
        </p>
      </div>
      <Progress value={value} className="mt-2 h-1 bg-[#403a34]/10 [&>div]:bg-[#8e682b]" />
      {completedRules === rules.length && (
        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#6b5734]">
          <ShieldCheck className="size-3.5" /> Cumple los requisitos de AUTEM.
        </p>
      )}
      {completedRules !== rules.length && (
        <p className="mt-2 text-xs leading-relaxed text-[#555555]">
          Falta:{" "}
          {rules
            .filter((rule) => !rule.complete)
            .map((rule) => rule.label.toLowerCase())
            .join(", ")}
          .
        </p>
      )}
    </div>
  );
}
