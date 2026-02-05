/**
 * Shared Status Constants
 * Reduces duplication across pages (CRM, Campaigns, Reminders, etc.)
 */

export const CLIENT_STATUS = {
  ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', text: 'text-green-600' },
  INACTIVE: { label: 'Inactivo', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', text: 'text-gray-600' },
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', text: 'text-yellow-600' },
} as const;

export const CAMPAIGN_STATUS = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  SCHEDULED: { label: 'Programado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  COMPLETED: { label: 'Completado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  PAUSED: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
} as const;

export const REMINDER_STATUS = {
  PENDING: { label: 'Pendiente', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  SENT: { label: 'Enviado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  FAILED: { label: 'Fallido', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const;

export const REMINDER_TYPE = {
  APPOINTMENT: { label: 'Cita', icon: '📅' },
  PAYMENT: { label: 'Pago', icon: '💳' },
  FOLLOW_UP: { label: 'Seguimiento', icon: '📞' },
  GENERAL: { label: 'General', icon: '📝' },
} as const;

export const APPOINTMENT_STATUS = {
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  COMPLETED: { label: 'Completado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
} as const;

export const MESSAGE_STATUS = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  READ: { label: 'Leído', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  FAILED: { label: 'Fallido', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
} as const;
