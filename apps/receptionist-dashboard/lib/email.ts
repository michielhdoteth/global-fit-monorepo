/**
 * Email Service - Simplified with shared utilities
 */

import { Resend } from 'resend';
import { render } from '@react-email/components';
import { AppointmentReminderEmail } from '../emails/AppointmentReminder';
import { CampaignEmail } from '../emails/CampaignEmail';
import { WelcomeEmail } from '../emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============== SHARED TEXT GENERATORS ==============

function generateFooter(gymName: string, gymPhone: string): string {
  return `© ${new Date().getFullYear()} ${gymName}. Todos los derechos reservados.
¿Dudas? Contáctanos por WhatsApp: ${gymPhone}`;
}

function generateEmailText(
  subject: string,
  clientName: string,
  content: string,
  gymName: string,
  gymPhone: string,
  extra?: string
): string {
  const footer = generateFooter(gymName, gymPhone);
  const base = `${gymName} - ${subject}

Hola ${clientName},

${content}

${footer}`;
  return extra ? `${base}

${extra}`.trim() : base.trim();
}

// ============== CORE EMAIL FUNCTION ==============

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key') {
    console.log('[EMAIL] Resend not configured, skipping:', { to, subject });
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@globalfit.com.mx',
      to,
      subject,
      html,
      text,
    });
    console.log('[EMAIL] Sent:', result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[EMAIL] Failed:', error);
    return { success: false, error };
  }
}

// ============== EMAIL TEMPLATES ==============

export async function sendAppointmentReminder({
  clientEmail,
  clientName,
  appointmentDate,
  appointmentTime,
  gymName = 'Global Fit',
  gymAddress = 'Av. Principal 123, Ciudad',
  gymPhone = '528334430060',
}: {
  clientEmail: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  gymName?: string;
  gymAddress?: string;
  gymPhone?: string;
}) {
  const html = await render(
    AppointmentReminderEmail({ clientName, appointmentDate, appointmentTime, gymName, gymAddress, gymPhone })
  );

  const content = `Este es un recordatorio de tu próxima cita en ${gymName}:

📅 Fecha: ${appointmentDate}
🕐 Hora: ${appointmentTime}
📍 Ubicación: ${gymAddress}

Te esperamos en ${gymName} para tu sesión.
No olvides traer ropa cómoda y agua.

¿Necesitas reprogramar? Contáctanos por WhatsApp: ${gymPhone}`;

  return sendEmail({
    to: clientEmail,
    subject: `Recordatorio de tu cita en ${gymName} - ${appointmentDate}`,
    html,
    text: generateEmailText('Recordatorio de Cita', clientName, content, gymName, gymPhone),
  });
}

export async function sendCampaignEmail({
  clientEmail,
  clientName,
  campaignSubject,
  campaignContent,
  gymName = 'Global Fit',
  gymPhone = '528334430060',
  gymWebsite = 'www.globalfit.com.mx',
  unsubscribeUrl = '#',
}: {
  clientEmail: string;
  clientName: string;
  campaignSubject: string;
  campaignContent: string;
  gymName?: string;
  gymPhone?: string;
  gymWebsite?: string;
  unsubscribeUrl?: string;
}) {
  const html = await render(
    CampaignEmail({ clientName, campaignSubject, campaignContent, gymName, gymPhone, gymWebsite, unsubscribeUrl })
  );

  const content = `${campaignContent}

¡Visítanos en nuestras instalaciones!
${gymWebsite}`;

  return sendEmail({
    to: clientEmail,
    subject: `${gymName} - ${campaignSubject}`,
    html,
    text: generateEmailText(campaignSubject, clientName, content, gymName, gymPhone, '¿No deseas recibir estos correos? Responde "BAJA" para darte de baja.'),
  });
}

export async function sendWelcomeEmail({
  clientEmail,
  clientName,
  gymName = 'Global Fit',
  gymPhone = '528334430060',
  gymWebsite = 'www.globalfit.com.mx',
}: {
  clientEmail: string;
  clientName: string;
  gymName?: string;
  gymPhone?: string;
  gymWebsite?: string;
}) {
  const html = await render(WelcomeEmail({ clientName, gymName, gymPhone, gymWebsite }));

  const content = `¡Estamos encantados de tenerte con nosotros! Gracias por confiar en ${gymName} para tu viaje hacia una vida más saludable.

Próximos pasos:
1. Programa tu primera sesión de entrenamiento
2. Explora nuestras clases grupales
3. Conoce nuestro equipo de instructores

Contáctanos por WhatsApp: ${gymPhone}
Visítanos: ${gymWebsite}`;

  return sendEmail({
    to: clientEmail,
    subject: `¡Bienvenido a ${gymName}!`,
    html,
    text: generateEmailText('¡Bienvenido a ' + gymName + '! 🎉', clientName, content, gymName, gymPhone),
  });
}
