import { type FormEvent, useId, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link } from "@tanstack/react-router";

import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminLoginProps {
  onSignIn: () => void;
}

/**
 * Presentational login gate. Credential validation will be added when the
 * administration API and authentication provider are connected.
 */
export function AdminLogin({ onSignIn }: AdminLoginProps) {
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSignIn();
  };

  return (
    <main className="min-h-svh bg-[#f6f1eb] p-4 text-[#403a34] sm:p-6 lg:grid lg:grid-cols-2 lg:p-0">
      <section className="relative hidden min-h-svh overflow-hidden bg-[#403a34] lg:block">
        <div className="admin-login-brand-wall absolute inset-0" aria-hidden="true" />
        <div className="relative flex h-full items-center justify-center p-10 xl:p-14">
          <Link
            to="/"
            aria-label="AUTEM, volver al inicio"
            className="group flex flex-col items-center text-center outline-offset-8"
          >
            <span className="admin-login-brand-mark flex size-32 items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-105 xl:size-36">
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
          to="/"
          className="mb-auto inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#403a34]/65 transition-colors hover:text-[#403a34] lg:hidden"
        >
          <ArrowLeft className="size-3.5" /> Volver al sitio
        </Link>

        <div className="my-auto w-full">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <AutemBrandIcon size={36} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">AUTEM</span>
          </div>
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8e682b]">
              Área privada
            </p>
            <h2 className="mt-3 text-4xl leading-tight">Bienvenido de nuevo</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#555555]">
              Ingresa tus datos para continuar al panel de administración.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={emailId} className="text-sm font-medium text-[#403a34]">
                Correo electrónico
              </Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@autem.co"
                required
                className="h-11 rounded-2xl border-[#403a34]/20 bg-white/70 px-4 shadow-none placeholder:text-[#555555]/60 focus-visible:ring-[#c5a059]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor={passwordId} className="text-sm font-medium text-[#403a34]">
                  Contraseña
                </Label>
                <span className="text-xs text-[#555555]">Recuperación próximamente</span>
              </div>
              <div className="relative">
                <Input
                  id={passwordId}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-2xl border-[#403a34]/20 bg-white/70 px-4 pr-11 shadow-none placeholder:text-[#555555]/60 focus-visible:ring-[#c5a059]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#555555] transition-colors hover:text-[#403a34]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-2xl bg-[#403a34] text-xs font-semibold uppercase tracking-[0.16em] text-[#f6f1eb] shadow-none hover:bg-[#27231f]"
            >
              <LockKeyhole className="size-4" /> Ingresar al panel
            </Button>
          </form>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-[#555555]">
          Acceso visual en desarrollo. La verificación de credenciales se habilitará al conectar el
          servicio de autenticación.
        </p>
      </section>
    </main>
  );
}
