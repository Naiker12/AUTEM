import { type ChangeEvent, type FormEvent, useEffect, useId, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, KeyRound, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requireSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({ meta: [{ title: "Mi perfil | AUTEM" }] }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const nameId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const client = requireSupabase();
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await client
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setName(profile?.full_name ?? String(user.user_metadata.full_name ?? ""));
      if (profile?.avatar_url) {
        const { data } = await client.storage
          .from("avatars")
          .createSignedUrl(profile.avatar_url, 3600);
        setAvatarUrl(data?.signedUrl ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const client = requireSupabase();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error("Tu sesión terminó.");
      const { error } = await client
        .from("profiles")
        .upsert({ id: user.id, full_name: name.trim() });
      if (error) throw error;
      await client.auth.updateUser({ data: { full_name: name.trim() } });
      toast.success("Perfil actualizado");
    } catch (error) {
      toast.error("No fue posible guardar el perfil", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      toast.error("Usa JPG, PNG o WebP de máximo 2 MB.");
      return;
    }
    try {
      const client = requireSupabase();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error("Tu sesión terminó.");
      const extension =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/perfil.${extension}`;
      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: profileError } = await client
        .from("profiles")
        .upsert({ id: user.id, avatar_url: path });
      if (profileError) throw profileError;
      const { data } = await client.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarUrl(data?.signedUrl ?? "");
      toast.success("Foto de perfil actualizada");
    } catch (error) {
      toast.error("No fue posible cargar la foto", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 12) {
      toast.error("La nueva contraseña debe tener al menos 12 caracteres.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Contraseña actualizada");
    } catch (error) {
      toast.error("No fue posible cambiar la contraseña", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "AU";
  if (loading)
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-accent" />
      </main>
    );
  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <header className="border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cuenta</p>
          <h1 className="mt-2 font-serif text-3xl">Mi perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestiona tus datos personales y la seguridad de tu acceso.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Identidad</CardTitle>
            <CardDescription>
              Tu foto se guarda privada y solo tú puedes reemplazarla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar className="size-20">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <label htmlFor="avatar-upload">
                    <Camera data-icon="inline-start" /> Cambiar foto
                  </label>
                </Button>
                <input
                  id="avatar-upload"
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadAvatar}
                />
                <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máximo 2 MB</p>
              </div>
            </div>
            <form className="mt-8" onSubmit={saveProfile}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={nameId}>Nombre</FieldLabel>
                  <Input
                    id={nameId}
                    placeholder="Tu nombre y apellido"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input value={email} disabled />
                  <FieldDescription>
                    El correo se cambia desde un flujo de confirmación independiente.
                  </FieldDescription>
                </Field>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? (
                    <LoaderCircle data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}{" "}
                  Guardar perfil
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>
              Confirma tu contraseña actual antes de crear una nueva.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={currentPasswordId}>Contraseña actual</FieldLabel>
                  <Input
                    id={currentPasswordId}
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={newPasswordId}>Contraseña nueva</FieldLabel>
                  <Input
                    id={newPasswordId}
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <FieldDescription>
                    Al menos 12 caracteres; usa mayúscula, minúscula, número y símbolo.
                  </FieldDescription>
                </Field>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? (
                    <LoaderCircle data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <KeyRound data-icon="inline-start" />
                  )}{" "}
                  Cambiar contraseña
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" /> Protección de la cuenta
            </CardTitle>
            <CardDescription>
              Los cambios sensibles se validan con Supabase Auth y las políticas de base de datos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
