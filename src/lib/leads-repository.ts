import { WHATSAPP_NUMBER } from "@/data/constants";
import { supabase } from "@/lib/supabase";

export type LeadStatus =
  "new" | "contacted" | "visit_scheduled" | "negotiating" | "reserved" | "won" | "lost";

export type LeadIntent = "reserve" | "info" | "visit";

export type LeadEventKind =
  "created" | "note" | "call" | "whatsapp" | "email" | "status_change" | "lot_change";

export interface LeadRecord {
  id: string;
  organization_id: string;
  project_id: string;
  lot_id: string | null;
  lot_external_id: string | null;
  lot_number: number | null;
  intent: LeadIntent;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  visit_date: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  consent_at: string;
  source: string | null;
  utm: Record<string, unknown>;
  next_followup_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined or resolved fields
  project_name?: string;
  assigned_user_name?: string;
  events?: LeadEventRecord[];
}

export interface LeadEventRecord {
  id: string;
  lead_id: string;
  author_id: string | null;
  kind: LeadEventKind;
  body: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface CreateLeadInput {
  projectId: string;
  organizationId?: string;
  lotId?: string;
  lotExternalId?: string;
  lotNumber?: number;
  intent?: LeadIntent;
  fullName: string;
  phone: string;
  email?: string;
  message?: string;
  visitDate?: string;
  source?: string;
  utm?: Record<string, unknown>;
}

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; badgeClass: string; order: number }
> = {
  new: {
    label: "Nueva solicitud",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    order: 1,
  },
  contacted: {
    label: "Contactado",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    order: 2,
  },
  visit_scheduled: {
    label: "Visita agendada",
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    order: 3,
  },
  negotiating: {
    label: "En negociación",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    order: 4,
  },
  reserved: {
    label: "Reservado",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    order: 5,
  },
  won: {
    label: "Venta cerrada",
    badgeClass: "bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 border-emerald-600/40",
    order: 6,
  },
  lost: {
    label: "No concretado",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    order: 7,
  },
};

/**
 * Builds direct WhatsApp URL carrying the preformatted message for quick customer follow-up
 */
export function buildWhatsAppReserveUrl(params: {
  fullName: string;
  phone: string;
  lotNumber?: string | number;
  projectName?: string;
  areaM2?: number;
  priceCop?: number;
  visitDate?: string;
}) {
  const { fullName, lotNumber, projectName = "Villa Paraíso", areaM2, visitDate } = params;

  let msg = `Hola equipo AUTEM, mi nombre es *${fullName.trim()}*.\n`;
  if (lotNumber) {
    msg += `Estoy interesado en reservar el *Lote ${lotNumber}* del proyecto *${projectName}*`;
    if (areaM2) msg += ` (${areaM2} m²)`;
    msg += `.\n`;
  } else {
    msg += `Quiero más información sobre disponibilidad y lotes en *${projectName}*.\n`;
  }

  if (visitDate) {
    msg += `Me gustaría programar una visita para el día: *${visitDate}*.\n`;
  }

  msg += `Quedo atento para recibir información sobre el proceso de reserva y separación. ¡Muchas gracias!`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/**
 * Submits a new lead from the public lot viewer
 */
export async function submitLead(
  input: CreateLeadInput,
): Promise<{ id?: string; success: boolean }> {
  try {
    if (!supabase) {
      console.warn("Supabase no configurado, guardando en contingencia local.");
      saveLocalLeadBackup(input);
      return { success: true };
    }

    // Si no viene organizationId, obtenerlo del proyecto
    let orgId = input.organizationId;
    if (!orgId) {
      const { data: proj } = await supabase
        .from("projects")
        .select("organization_id")
        .eq("id", input.projectId)
        .maybeSingle();

      orgId = proj?.organization_id || "00000000-0000-0000-0000-000000000001";
    }

    const payload = {
      organization_id: orgId,
      project_id: input.projectId,
      lot_id: input.lotId || null,
      lot_external_id: input.lotExternalId || null,
      lot_number: input.lotNumber || null,
      intent: input.intent || "reserve",
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      message: input.message?.trim() || null,
      visit_date: input.visitDate || null,
      status: "new" as const,
      consent_at: new Date().toISOString(),
      source: input.source || "plano",
      utm: input.utm || {},
    };

    const { data, error } = await supabase.from("leads").insert(payload).select("id").single();

    if (error) {
      console.warn("Aviso al insertar en tabla leads (contingencia activada):", error.message);
      saveLocalLeadBackup(input);
      return { success: true };
    }

    // Registrar evento inicial
    if (data?.id) {
      await supabase.from("lead_events").insert({
        lead_id: data.id,
        kind: "created",
        body: `Solicitud de reserva recibida desde la vista ${input.source || "plano"}.`,
        meta: {
          lot: input.lotExternalId || input.lotNumber,
          phone: input.phone,
        },
      });
    }

    return { id: data?.id, success: true };
  } catch (err) {
    console.error("Error al procesar solicitud de reserva:", err);
    saveLocalLeadBackup(input);
    return { success: true };
  }
}

function saveLocalLeadBackup(input: CreateLeadInput) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("autem_pending_leads") || "[]");
    existing.push({ ...input, createdAt: new Date().toISOString() });
    localStorage.setItem("autem_pending_leads", JSON.stringify(existing));
  } catch {
    /* ignore local storage error */
  }
}

/**
 * List leads for admin CRM
 */
export async function listLeads(
  organizationId: string,
  options?: {
    projectId?: string;
    status?: LeadStatus | "all";
    query?: string;
  },
): Promise<LeadRecord[]> {
  if (!supabase) return [];

  let query = supabase
    .from("leads")
    .select("*, project:projects(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (options?.projectId) {
    query = query.eq("project_id", options.projectId);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al consultar solicitudes/leads:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    project_name: (row.project as { name?: string } | undefined)?.name,
  })) as LeadRecord[];
}

/**
 * Get lead detail with its timeline events
 */
export async function getLeadDetail(leadId: string): Promise<LeadRecord | null> {
  if (!supabase) return null;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*, project:projects(name)")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) return null;

  const { data: events } = await supabase
    .from("lead_events")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  return {
    ...lead,
    project_name: (lead as Record<string, unknown> & { project?: { name?: string } }).project?.name,
    events: events || [],
  } as LeadRecord;
}

/**
 * Update status of a lead and record an event
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  note?: string,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    console.error("Error al actualizar estado del lead:", error);
    return false;
  }

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    kind: "status_change",
    body: note || `Estado actualizado a: ${LEAD_STATUS_CONFIG[status]?.label || status}`,
    meta: { new_status: status },
  });

  return true;
}

/**
 * Add a follow-up note, call or WhatsApp message record to a lead
 */
export async function addLeadEvent(
  leadId: string,
  kind: LeadEventKind,
  body: string,
  meta: Record<string, unknown> = {},
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("lead_events").insert({
    lead_id: leadId,
    kind,
    body,
    meta,
  });

  if (error) return false;

  // Actualizar last_contact_at en el lead
  await supabase
    .from("leads")
    .update({ last_contact_at: new Date().toISOString() })
    .eq("id", leadId);

  return true;
}
