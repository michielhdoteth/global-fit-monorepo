import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============== STRING UTILS ==============

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// ============== STATUS MAPPERS ==============

export function mapClientStatus(status: string): 'Active' | 'Inactive' | 'Pending' {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'INACTIVE') return 'Inactive';
  return 'Pending';
}

export function mapCampaignStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Borrador', SCHEDULED: 'Programado', ACTIVE: 'Activo',
    COMPLETED: 'Completado', PAUSED: 'Pausado',
  };
  return map[status] || status;
}

export function mapReminderStatus(status: string): string {
  const map: Record<string, string> = { PENDING: 'Pendiente', SENT: 'Enviado', FAILED: 'Fallido' };
  return map[status] || status;
}

export function mapAppointmentStatus(status: string): string {
  const map: Record<string, string> = {
    CONFIRMED: 'Confirmado', PENDING: 'Pendiente', CANCELLED: 'Cancelado', COMPLETED: 'Completado',
  };
  return map[status] || status;
}

// ============== API HELPERS ==============

export function createApiError(message: string, status: number = 500) {
  return { error: message, status };
}
