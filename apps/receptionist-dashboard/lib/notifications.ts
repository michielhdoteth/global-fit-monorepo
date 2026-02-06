/**
 * Notification Helper Functions
 * Used to create notifications from various parts of the application
 */

import { prisma } from "@/lib/database";

export type NotificationType = "NEW_CLIENT" | "APPOINTMENT_SCHEDULED" | "APPOINTMENT_CANCELLED" | "PAYMENT_DUE" | "CAMPAIGN_COMPLETED" | "REMINDER_PENDING" | "MESSAGE_RECEIVED" | "GENERAL";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface CreateNotificationOptions {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  userId?: number;
}

/**
 * Create a new notification
 */
export async function createNotification(options: CreateNotificationOptions) {
  return await prisma.notification.create({
    data: {
      type: options.type,
      priority: options.priority || "NORMAL",
      title: options.title,
      message: options.message,
      actionUrl: options.actionUrl,
      metadata: options.metadata,
      userId: options.userId,
    },
  });
}

/**
 * Create a notification for a new client
 */
export async function notifyNewClient(clientName: string, clientId: number) {
  return await createNotification({
    type: "NEW_CLIENT",
    priority: "NORMAL",
    title: `Nuevo cliente registrado: ${clientName}`,
    message: `Se ha registrado un nuevo cliente en el sistema.`,
    actionUrl: `/crm?client=${clientId}`,
    metadata: { clientId, clientName },
  });
}

/**
 * Create a notification for appointment scheduled
 */
export async function notifyAppointmentScheduled(clientName: string, appointmentId: number, date: string) {
  return await createNotification({
    type: "APPOINTMENT_SCHEDULED",
    priority: "NORMAL",
    title: `Cita agendada: ${clientName}`,
    message: `Cita programada para el ${date}`,
    actionUrl: `/schedule`,
    metadata: { appointmentId, clientName, date },
  });
}

/**
 * Create a notification for appointment cancelled
 */
export async function notifyAppointmentCancelled(clientName: string, appointmentId: number) {
  return await createNotification({
    type: "APPOINTMENT_CANCELLED",
    priority: "HIGH",
    title: `Cita cancelada: ${clientName}`,
    message: `El cliente ha cancelado su cita.`,
    actionUrl: `/schedule`,
    metadata: { appointmentId, clientName },
  });
}

/**
 * Create a notification for payment due
 */
export async function notifyPaymentDue(clientName: string, amount: string, clientId: number) {
  return await createNotification({
    type: "PAYMENT_DUE",
    priority: "HIGH",
    title: `Pago pendiente: ${clientName}`,
    message: `Pago de ${amount} pendiente.`,
    actionUrl: `/crm?client=${clientId}`,
    metadata: { clientId, clientName, amount },
  });
}

/**
 * Create a notification for campaign completed
 */
export async function notifyCampaignCompleted(campaignName: string, sentCount: number) {
  return await createNotification({
    type: "CAMPAIGN_COMPLETED",
    priority: "NORMAL",
    title: `Campaña completada: ${campaignName}`,
    message: `Se enviaron ${sentCount} mensajes exitosamente.`,
    actionUrl: `/campaigns`,
    metadata: { campaignName, sentCount },
  });
}

/**
 * Create a notification for pending reminders
 */
export async function notifyReminderPending(count: number) {
  return await createNotification({
    type: "REMINDER_PENDING",
    priority: "NORMAL",
    title: `${count} recordatorios pendientes`,
    message: `Tienes recordatorios que deben ser enviados.`,
    actionUrl: `/reminders`,
    metadata: { count },
  });
}

/**
 * Create a notification for new message received
 */
export async function notifyMessageReceived(senderName: string, conversationId: number) {
  return await createNotification({
    type: "MESSAGE_RECEIVED",
    priority: "NORMAL",
    title: `Nuevo mensaje de ${senderName}`,
    message: `Has recibido un nuevo mensaje.`,
    actionUrl: `/chats`,
    metadata: { conversationId, senderName },
  });
}

/**
 * Create a general notification
 */
export async function notifyGeneral(title: string, message: string, actionUrl?: string) {
  return await createNotification({
    type: "GENERAL",
    priority: "NORMAL",
    title,
    message,
    actionUrl,
  });
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(ids: number[]) {
  return await prisma.notification.updateMany({
    where: { id: { in: ids } },
    data: { isRead: true },
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  return await prisma.notification.count({
    where: { isRead: false },
  });
}

/**
 * Get recent notifications
 */
export async function getRecentNotifications(limit: number = 20) {
  return await prisma.notification.findMany({
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}

/**
 * Clean old notifications (keep last N days)
 */
export async function cleanOldNotifications(daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  });
}
