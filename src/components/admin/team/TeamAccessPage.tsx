import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FolderKanban,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getCurrentAdminAccess } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Role = "superadmin" | "administrador" | "editor" | "comercial";
type MemberStatus = "Activo" | "Invitación pendiente";
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  projects: string[];
  status: MemberStatus;
  emailConfirmedAt?: string | null;
  invitation?: {
    sentAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    lastResentAt: string | null;
    resendCount: number;
  } | null;
};

type RoleAccess = {
  description: string;
  permissions: string[];
  scope: string;
};

const roleLabels: Record<Role, string> = {
  superadmin: "Superadministrador",
  administrador: "Administrador",
  editor: "Editor de contenido",
  comercial: "Equipo comercial",
};

const roleAccess: Record<Role, RoleAccess> = {
  superadmin: {
    description: "Control total de la organización.",
    permissions: [
      "Gestionar usuarios y roles",
      "Administrar todos los proyectos",
      "Configurar organización e integraciones",
    ],
    scope: "Todos los proyectos",
  },
  administrador: {
    description: "Gestiona los proyectos que tiene asignados.",
    permissions: [
      "Administrar contenido y medios",
      "Gestionar inventario y experiencias",
      "Coordinar el proyecto asignado",
    ],
    scope: "Proyectos asignados",
  },
  editor: {
    description: "Edita la información pública de sus proyectos.",
    permissions: ["Editar contenido", "Gestionar medios", "Actualizar experiencias del proyecto"],
    scope: "Proyectos asignados",
  },
  comercial: {
    description: "Consulta la información comercial autorizada.",
    permissions: [
      "Consultar inventario",
      "Consultar contactos",
      "Ver información de proyectos asignados",
    ],
    scope: "Proyectos asignados",
  },
};

const teamSeed: TeamMember[] = [
  {
    id: "owner",
    name: "Equipo AUTEM",
    email: "administracion@autem.co",
    role: "superadmin",
    projects: ["Todos los proyectos"],
    status: "Activo",
  },
];

const villaParaisoId = "00000000-0000-0000-0000-000000000101";

export function TeamAccessPage() {
  const [members, setMembers] = useState(teamSeed);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToManage, setMemberToManage] = useState<TeamMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [role, setRole] = useState<Role>("editor");
  const [hasVillaParaiso, setHasVillaParaiso] = useState(true);
  const [inviteFeedback, setInviteFeedback] = useState("");
  const [teamLoadError, setTeamLoadError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [memberToResend, setMemberToResend] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const selectedRoleAccess = roleAccess[role];
  const summary = useMemo(
    () => ({
      total: members.length,
      pending: members.filter((member) => memberInvitationStatus(member) === "Invitación pendiente")
        .length,
    }),
    [members],
  );

  useEffect(() => {
    async function loadMembers() {
      try {
        const access = await getCurrentAdminAccess();
        if (!access) return;
        setOrganizationId(access.organizationId);
        setCurrentRole(access.role);
        const { data, error } = await requireSupabase().functions.invoke("invite-user", {
          body: { action: "list", organizationId: access.organizationId },
        });
        if (error || !data?.members) {
          setTeamLoadError("No fue posible sincronizar las invitaciones guardadas en Supabase.");
          return;
        }
        setTeamLoadError("");
        setMembers(
          data.members.map((member: Omit<TeamMember, "status">) => ({
            ...member,
            status:
              member.emailConfirmedAt || member.invitation?.acceptedAt
                ? "Activo"
                : "Invitación pendiente",
          })),
        );
      } catch {
        setTeamLoadError("No fue posible conectar el panel con las invitaciones guardadas.");
      }
    }
    void loadMembers();
  }, []);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    if (!email || !name) return;
    const existingMember = members.find(
      (member) => member.email.toLowerCase() === email.toLowerCase(),
    );
    if (existingMember) {
      const alreadyActive = memberInvitationStatus(existingMember) === "Activo";
      toast.info(
        alreadyActive ? "Esta persona ya tiene acceso" : "Esta invitación ya está registrada",
        {
          description: alreadyActive
            ? `${email} ya forma parte del equipo.`
            : "Puedes reenviar el enlace desde la tabla de personas con acceso.",
        },
      );
      return;
    }
    setIsInviting(true);
    setInviteFeedback("");
    try {
      const access = await getCurrentAdminAccess();
      if (!access || access.role !== "superadmin") {
        throw new Error("Solo un superadministrador puede invitar personas.");
      }
      const { data, error } = await requireSupabase().functions.invoke("invite-user", {
        body: {
          email,
          fullName: name,
          organizationId: access.organizationId,
          role,
          projectIds: role === "superadmin" || !hasVillaParaiso ? [] : [villaParaisoId],
        },
      });
      if (error) throw error;
      if (data?.status === "already_active" || data?.status === "already_invited") {
        toast.info(
          data.status === "already_active"
            ? "Esta persona ya tiene acceso"
            : "Esta invitación ya está registrada",
          {
            description:
              data.status === "already_active"
                ? `${email} ya forma parte del equipo.`
                : "Puedes reenviar el enlace desde la tabla de personas con acceso.",
          },
        );
        return;
      }
      setMembers((current) => [
        ...current,
        {
          id: data?.userId,
          name,
          email,
          role,
          projects:
            role === "superadmin"
              ? ["Todos los proyectos"]
              : hasVillaParaiso
                ? ["Villa Paraíso"]
                : [],
          status: "Invitación pendiente",
          invitation: {
            sentAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            acceptedAt: null,
            lastResentAt: null,
            resendCount: 0,
          },
        },
      ]);
      setDialogOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteFeedback(
        `Invitación enviada a ${email}. La persona recibirá un correo para activar su acceso.`,
      );
      toast.success("Invitación enviada", { description: `Se envió a ${email}.` });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const message = rawMessage.includes("Edge Function")
        ? "La función de invitación todavía no está desplegada en Supabase."
        : rawMessage || "No fue posible enviar la invitación.";
      setInviteFeedback(message);
      toast.error("No fue posible enviar la invitación", { description: message });
    } finally {
      setIsInviting(false);
    }
  }

  async function handleResend() {
    if (!memberToResend || !organizationId) return;
    setIsResending(true);
    try {
      const { error } = await requireSupabase().functions.invoke("invite-user", {
        body: { action: "resend", organizationId, userId: memberToResend.id },
      });
      if (error) throw error;
      const sentAt = new Date();
      setMembers((current) =>
        current.map((member) =>
          member.id === memberToResend.id
            ? {
                ...member,
                status: "Invitación pendiente",
                invitation: {
                  sentAt: sentAt.toISOString(),
                  expiresAt: new Date(sentAt.getTime() + 60 * 60 * 1000).toISOString(),
                  acceptedAt: null,
                  lastResentAt: sentAt.toISOString(),
                  resendCount: (member.invitation?.resendCount ?? 0) + 1,
                },
              }
            : member,
        ),
      );
      toast.success("Invitación reenviada", {
        description: `Se envió un nuevo enlace a ${memberToResend.email}.`,
      });
      setMemberToResend(null);
    } catch (error) {
      toast.error("No fue posible reenviar la invitación", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleUpdatePermissions(member: TeamMember, nextRole: Role, hasProject: boolean) {
    if (!organizationId) throw new Error("No fue posible identificar la organización.");
    const { error } = await requireSupabase().functions.invoke("invite-user", {
      body: {
        action: "update",
        organizationId,
        userId: member.id,
        role: nextRole,
        projectIds: nextRole === "superadmin" || !hasProject ? [] : [villaParaisoId],
      },
    });
    if (error) throw error;
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id
          ? {
              ...item,
              role: nextRole,
              projects:
                nextRole === "superadmin"
                  ? ["Todos los proyectos"]
                  : hasProject
                    ? ["Villa Paraíso"]
                    : [],
            }
          : item,
      ),
    );
    setSelectedMember(null);
    setMemberToManage(null);
    toast.success("Permisos actualizados", {
      description: `Se actualizó el acceso de ${member.name}.`,
    });
  }

  async function handleRemoveAccess() {
    if (!memberToRemove || !organizationId) return;
    setIsRemoving(true);
    try {
      const { error } = await requireSupabase().functions.invoke("invite-user", {
        body: { action: "remove", organizationId, userId: memberToRemove.id },
      });
      if (error) throw error;
      setMembers((current) => current.filter((member) => member.id !== memberToRemove.id));
      toast.success("Acceso retirado", {
        description: `${memberToRemove.name} ya no puede entrar al panel.`,
      });
      setMemberToRemove(null);
    } catch (error) {
      toast.error("No fue posible retirar el acceso", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <main className="w-full p-4 sm:p-5 lg:p-6 2xl:p-8">
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-1.5 border-l-2 border-accent pl-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Administración de acceso
            </p>
            <h1 className="font-serif text-2xl text-foreground">Equipo y accesos</h1>
            <p className="text-sm leading-5 text-muted-foreground">
              Invita al equipo y define qué puede administrar cada persona, incluyendo el alcance
              por proyecto.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus data-icon="inline-start" /> Invitar usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="grid max-h-[min(90svh,48rem)] w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
              <DialogHeader className="border-b px-6 pb-4 pt-6">
                <DialogTitle>Invitar al equipo</DialogTitle>
                <DialogDescription>
                  Define el rol y el alcance antes de enviar la invitación. El servidor valida el
                  rol antes de conceder acceso.
                </DialogDescription>
              </DialogHeader>
              <form className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]" onSubmit={handleInvite}>
                <div className="min-h-0 overflow-y-auto px-6 py-5">
                  <div className="flex flex-col gap-5">
                    <FieldSet className="gap-4">
                      <FieldGroup className="grid gap-5 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="invite-name">Nombre</FieldLabel>
                          <Input
                            id="invite-name"
                            name="name"
                            placeholder="Nombre y apellido"
                            required
                            value={inviteName}
                            onChange={(event) => setInviteName(event.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="invite-email">Correo de trabajo</FieldLabel>
                          <Input
                            id="invite-email"
                            name="email"
                            type="email"
                            placeholder="nombre@empresa.com"
                            required
                            value={inviteEmail}
                            onChange={(event) => setInviteEmail(event.target.value)}
                          />
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                    <FieldSet className="gap-4">
                      <FieldLegend>Rol y alcance</FieldLegend>
                      <FieldDescription>
                        El rol define las acciones disponibles; el alcance limita sobre qué
                        proyectos se aplican.
                      </FieldDescription>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="invite-role">Rol</FieldLabel>
                          <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                            <SelectTrigger id="invite-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {Object.entries(roleLabels)
                                  .filter(
                                    ([value]) =>
                                      currentRole === "superadmin" ||
                                      !["superadmin", "administrador"].includes(value),
                                  )
                                  .map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <RoleAccessSummary role={role} compact />
                        </Field>
                        <Field
                          orientation="horizontal"
                          className="rounded-xl border p-4"
                          data-disabled={role === "superadmin" || undefined}
                        >
                          <FieldContent>
                            <FieldLabel htmlFor="villa-paraiso-access">
                              Acceso a Villa Paraíso
                            </FieldLabel>
                            <FieldDescription>
                              {role === "superadmin"
                                ? "Los superadministradores tienen acceso a todos los proyectos."
                                : `${selectedRoleAccess.description} Actívalo solo si debe trabajar en este proyecto.`}
                            </FieldDescription>
                          </FieldContent>
                          <Switch
                            id="villa-paraiso-access"
                            checked={role === "superadmin" || hasVillaParaiso}
                            disabled={role === "superadmin"}
                            onCheckedChange={setHasVillaParaiso}
                          />
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                    <Card className="border-dashed bg-muted/30 shadow-none" size="sm">
                      <CardHeader className="gap-3">
                        <CardDescription>Vista previa de la persona invitada</CardDescription>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {(inviteName || "Nueva persona")
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <CardTitle className="truncate text-base">
                              {inviteName || "Nueva persona"}
                            </CardTitle>
                            <p className="truncate text-sm text-muted-foreground">
                              {inviteEmail || "correo@empresa.com"}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{roleLabels[role]}</Badge>
                          <Badge variant="outline">
                            {role === "superadmin"
                              ? "Todos los proyectos"
                              : hasVillaParaiso
                                ? "Villa Paraíso"
                                : "Sin proyectos"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <DialogFooter className="border-t bg-background px-6 py-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? (
                      <LoaderCircle data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Plus data-icon="inline-start" />
                    )}
                    {isInviting ? "Enviando" : "Enviar invitación"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>
        <section className="grid gap-3 md:grid-cols-3">
          <Card size="sm">
            <CardHeader className="gap-1.5">
              <UsersRound className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Miembros del equipo</CardTitle>
              <CardDescription>
                {summary.total} persona{summary.total === 1 ? "" : "s"} con acceso configurado.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader className="gap-1.5">
              <KeyRound className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Invitaciones pendientes</CardTitle>
              <CardDescription>
                {summary.pending} invitación{summary.pending === 1 ? "" : "es"} pendiente
                {summary.pending === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader className="gap-1.5">
              <ShieldCheck className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Modelo de seguridad</CardTitle>
              <CardDescription>Roles globales y acceso limitado por proyecto.</CardDescription>
            </CardHeader>
          </Card>
        </section>
        {inviteFeedback && (
          <Alert className="border-primary/30 bg-primary/5">
            <CheckCircle2 className="size-4 text-primary" />
            <AlertTitle>Invitación enviada</AlertTitle>
            <AlertDescription className="text-muted-foreground">{inviteFeedback}</AlertDescription>
          </Alert>
        )}
        {teamLoadError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el equipo</AlertTitle>
            <AlertDescription>{teamLoadError}</AlertDescription>
          </Alert>
        )}
        <Card size="sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <CardTitle>Personas con acceso</CardTitle>
                <CardDescription>
                  Selecciona una persona para revisar su perfil, alcance y permisos efectivos.
                </CardDescription>
              </div>
              <Badge variant="outline">Estado verificado</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Proyectos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback>
                            {member.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === "superadmin" ? "default" : "secondary"}>
                        {roleLabels[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.projects.length ? (
                        member.projects.join(", ")
                      ) : (
                        <span className="text-muted-foreground">Sin proyectos asignados</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <InvitationBadge member={member} />
                      {member.invitation && memberInvitationStatus(member) !== "Activo" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invitationTiming(member.invitation)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canResendInvitation(member) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToResend(member)}
                          >
                            <RefreshCw data-icon="inline-start" /> Reenviar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver perfil"
                          aria-label={`Ver perfil de ${member.name}`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <Eye />
                        </Button>
                        {canManageMember(currentRole, member) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar permisos"
                              aria-label={`Editar permisos de ${member.name}`}
                              onClick={() => setMemberToManage(member)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Retirar acceso"
                              aria-label={`Retirar acceso de ${member.name}`}
                              onClick={() => setMemberToRemove(member)}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <MemberProfileDialog
        member={selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
        onManage={() => {
          if (!selectedMember) return;
          setMemberToManage(selectedMember);
          setSelectedMember(null);
        }}
      />
      <MemberPermissionDialog
        member={memberToManage}
        onOpenChange={(open) => !open && setMemberToManage(null)}
        onSave={handleUpdatePermissions}
      />
      <AlertDialog
        open={Boolean(memberToResend)}
        onOpenChange={(open) => !open && setMemberToResend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reenviar invitación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un enlace nuevo a {memberToResend?.email}. El enlace anterior dejará de ser
              válido y el nuevo vencerá en una hora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isResending} onClick={handleResend}>
              {isResending ? "Reenviando…" : "Reenviar invitación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <AlertDialogTitle>¿Retirar acceso al panel?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción quita la membresía y los permisos de AUTEM.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{memberToRemove?.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{memberToRemove?.email}</p>
          </div>
          <AlertDialogDescription>
            La cuenta de Supabase no se elimina y podrá volver a invitarse después. Esta persona
            perderá el acceso inmediatamente.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={handleRemoveAccess}
            >
              {isRemoving ? "Retirando…" : "Retirar acceso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function memberInvitationStatus(member: TeamMember) {
  if (member.status === "Activo" || member.emailConfirmedAt || member.invitation?.acceptedAt)
    return "Activo";
  if (member.invitation && new Date(member.invitation.expiresAt).getTime() <= Date.now())
    return "Expirada";
  return "Invitación pendiente";
}

function canResendInvitation(member: TeamMember) {
  return memberInvitationStatus(member) !== "Activo" && Boolean(member.invitation);
}

function canManageMember(currentRole: Role | null, member: TeamMember) {
  if (currentRole === "superadmin") return member.role !== "superadmin";
  return currentRole === "administrador" && ["editor", "comercial"].includes(member.role);
}

function invitationTiming(invitation: NonNullable<TeamMember["invitation"]>) {
  const remaining = new Date(invitation.expiresAt).getTime() - Date.now();
  if (remaining <= 0) return "Venció; puedes enviar un nuevo enlace.";
  return `Vence en ${Math.max(1, Math.ceil(remaining / 60_000))} min`;
}

function InvitationBadge({ member }: { member: TeamMember }) {
  const status = memberInvitationStatus(member);
  return (
    <Badge variant={status === "Activo" ? "outline" : "secondary"}>
      {status === "Activo" && <UserRoundCheck data-icon="inline-start" />}
      {status}
    </Badge>
  );
}

function RoleAccessSummary({ role, compact = false }: { role: Role; compact?: boolean }) {
  const access = roleAccess[role];
  return (
    <div
      className={
        compact
          ? "mt-3 flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
          : "flex flex-col gap-3"
      }
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{roleLabels[role]}</p>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{access.description}</p>
      <ul className="flex flex-col gap-1.5">
        {access.permissions.map((permission) => (
          <li key={permission} className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
            {permission}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemberProfileDialog({
  member,
  onOpenChange,
  onManage,
}: {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  onManage: () => void;
}) {
  if (!member) return null;
  const access = roleAccess[member.role];
  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Perfil de acceso</DialogTitle>
          <DialogDescription>
            Este resumen muestra el alcance efectivo de la persona dentro de AUTEM.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
            <Avatar className="size-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate font-medium">{member.name}</p>
              <p className="truncate text-sm text-muted-foreground">{member.email}</p>
            </div>
            <InvitationBadge member={member} />
          </div>

          <section className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Rol y permisos
            </p>
            <RoleAccessSummary role={member.role} />
          </section>

          <section className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Alcance asignado
            </p>
            <div className="flex items-start gap-3 rounded-xl border p-4">
              <FolderKanban className="mt-0.5 size-4 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {member.projects.length ? member.projects.join(", ") : "Sin proyectos asignados"}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {access.scope}. Los permisos se aplican únicamente dentro de este alcance.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4">
            <LockKeyhole className="mt-0.5 size-4 text-muted-foreground" />
            <p className="text-xs leading-5 text-muted-foreground">
              La base de datos y la función de invitación vuelven a validar este rol y alcance en
              cada operación sensible.
            </p>
          </div>
        </div>
        <DialogFooter>
          {member.role !== "superadmin" && (
            <Button type="button" onClick={onManage}>
              Gestionar permisos
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberPermissionDialog({
  member,
  onOpenChange,
  onSave,
}: {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  onSave: (member: TeamMember, role: Role, hasProject: boolean) => Promise<void>;
}) {
  const [role, setRole] = useState<Role>("editor");
  const [hasProject, setHasProject] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setRole(member.role);
    setHasProject(member.projects.includes("Villa Paraíso"));
  }, [member]);

  if (!member) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(member, role, hasProject);
    } catch (error) {
      toast.error("No fue posible actualizar los permisos", {
        description: error instanceof Error ? error.message : "Inténtalo nuevamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90svh,44rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gestionar permisos</DialogTitle>
          <DialogDescription>
            Define qué puede administrar {member.name}. Estos cambios se validan en el servidor y se
            aplican al próximo acceso.
          </DialogDescription>
        </DialogHeader>
        <FieldSet className="gap-4">
          <Field>
            <FieldLabel htmlFor="member-role">Rol</FieldLabel>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger id="member-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(roleLabels)
                    .filter(([value]) => value !== "superadmin")
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <RoleAccessSummary role={role} compact />
          <Field orientation="horizontal" className="rounded-xl border p-4">
            <FieldContent>
              <FieldLabel htmlFor="member-villa-access">Acceso a Villa Paraíso</FieldLabel>
              <FieldDescription>
                Actívalo si esta persona debe trabajar dentro de este proyecto.
              </FieldDescription>
            </FieldContent>
            <Switch id="member-villa-access" checked={hasProject} onCheckedChange={setHasProject} />
          </Field>
        </FieldSet>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Guardando…" : "Guardar permisos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
