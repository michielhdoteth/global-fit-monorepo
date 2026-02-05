import { PrismaClient, ClientStatus, LeadStatus, AppointmentStatus, CampaignStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@globalfit.com' },
    update: {},
    create: {
      email: 'admin@globalfit.com',
      hashedPassword,
      fullName: 'Admin User',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created:', adminUser.email);

  const team = await prisma.team.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Default Team',
    },
  });

  console.log('Default team created:', team.name);

  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'maria.garcia@email.com' },
      update: {},
      create: {
        name: 'María García',
        email: 'maria.garcia@email.com',
        phone: '528331234567',
        whatsappNumber: '528331234567',
        plan: 'Premium',
        status: ClientStatus.ACTIVE,
        notes: 'Cliente preferente, entrena mañana y tarde',
        teamId: 1,
      },
    }),
    prisma.client.upsert({
      where: { email: 'juan.perez@email.com' },
      update: {},
      create: {
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '528339876543',
        whatsappNumber: '528339876543',
        plan: 'Básico',
        status: ClientStatus.ACTIVE,
        notes: 'Nuevo cliente, empezó hace 2 semanas',
        teamId: 1,
      },
    }),
    prisma.client.upsert({
      where: { email: 'ana.lopez@email.com' },
      update: {},
      create: {
        name: 'Ana López',
        email: 'ana.lopez@email.com',
        phone: '528335551111',
        whatsappNumber: '528335551111',
        plan: 'VIP',
        status: ClientStatus.ACTIVE,
        notes: 'Incluye sesiones con nutricionista',
        teamId: 1,
      },
    }),
    prisma.client.upsert({
      where: { email: 'carlos.martinez@email.com' },
      update: {},
      create: {
        name: 'Carlos Martínez',
        email: 'carlos.martinez@email.com',
        phone: '528334442222',
        whatsappNumber: '528334442222',
        plan: 'Premium',
        status: ClientStatus.ACTIVE,
        notes: 'Interesado en clases de spinning',
        teamId: 1,
      },
    }),
    prisma.client.upsert({
      where: { email: 'laura.hernandez@email.com' },
      update: {},
      create: {
        name: 'Laura Hernández',
        email: 'laura.hernandez@email.com',
        phone: '528336663333',
        whatsappNumber: '528336663333',
        plan: 'Básico',
        status: ClientStatus.PENDING,
        notes: 'Pendiente de pago inicial',
        teamId: 1,
      },
    }),
  ]);

  console.log('Sample clients created:', clients.length);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        title: 'Entrenamiento Personalizado',
        description: 'Sesión de entrenamiento con foco en cardio',
        date: formatDate(today),
        time: '08:00',
        duration: 60,
        status: AppointmentStatus.CONFIRMED,
        clientId: clients[0].id,
        location: 'Sala 1',
      },
    }),
    prisma.appointment.create({
      data: {
        title: 'Clase de Spinning',
        description: 'Clase grupal de spinning',
        date: formatDate(today),
        time: '18:00',
        duration: 45,
        status: AppointmentStatus.CONFIRMED,
        clientId: clients[1].id,
        location: 'Sala de Spinning',
      },
    }),
    prisma.appointment.create({
      data: {
        title: 'Evaluación Física',
        description: 'Evaluación inicial para nuevo plan',
        date: formatDate(tomorrow),
        time: '10:00',
        duration: 90,
        status: AppointmentStatus.PENDING,
        clientId: clients[4].id,
        location: 'Consultorio',
      },
    }),
    prisma.appointment.create({
      data: {
        title: 'Entrenamiento de Fuerza',
        description: 'Rutina de fuerza para miembros superiores',
        date: formatDate(nextWeek),
        time: '07:00',
        duration: 60,
        status: AppointmentStatus.CONFIRMED,
        clientId: clients[2].id,
        location: 'Sala 2',
      },
    }),
    prisma.appointment.create({
      data: {
        title: 'Clase de Yoga',
        description: 'Sesión de yoga relajante',
        date: formatDate(tomorrow),
        time: '19:00',
        duration: 60,
        status: AppointmentStatus.CONFIRMED,
        clientId: clients[3].id,
        location: 'Sala de Yoga',
      },
    }),
  ]);

  console.log('Sample appointments created:', appointments.length);

  const campaign = await prisma.campaign.create({
    data: {
      name: 'Promoción Enero 2025',
      description: 'Campaña de renovación de membresías',
      status: CampaignStatus.ACTIVE,
      type: 'whatsapp',
      content: '¡Hola! Tenemos una oferta especial para ti. Renueva tu membresía este mes y obtén 20% de descuento en tu siguiente mes. ¡Te esperamos en Global Fit!',
      clientId: clients[0].id,
      startDate: today,
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Sample campaign created:', campaign.name);

  await prisma.chatbotSettings.create({
    data: {
      isEnabled: true,
      defaultResponse: '¡Hola! Bienvenido a Global Fit Gym. ¿En qué puedo ayudarte hoy?',
      fallbackMessage: 'No entendí tu mensaje. ¿Podrías reformularlo?',
      systemPrompt: 'Eres el asistente virtual de Global Fit Gym. Ayudas con información sobre membresías, horarios de clases, servicios del gimnasio y atención al cliente. Sé amable, profesional y conciso.',
      sessionTimeoutMins: 30,
      businessHoursEnabled: false,
      respondMessages: true,
      useKnowledgeBase: true,
      instantReply: false,
      aiEnabled: true,
      aiProvider: 'deepseek',
      aiModel: 'deepseek-chat',
    },
  });

  console.log('Chatbot settings created');

  await prisma.llmSettings.create({
    data: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
      isEnabled: true,
    },
  });

  console.log('LLM settings created');

  await prisma.conversationFlow.createMany({
    data: [
      {
        name: ' Horarios',
        trigger: 'horario',
        steps: [
          { type: 'text', content: 'Nuestros horarios son:' },
          { type: 'text', content: 'Lunes a Viernes: 6:00 AM - 10:00 PM' },
          { type: 'text', content: 'Sábados y Domingos: 8:00 AM - 8:00 PM' },
        ],
        isActive: true,
      },
      {
        name: 'Precios',
        trigger: 'precio',
        steps: [
          { type: 'text', content: 'Nuestros planes:' },
          { type: 'text', content: 'Básico: $399/mes' },
          { type: 'text', content: 'Premium: $699/mes' },
          { type: 'text', content: 'VIP: $999/mes (incluye nutritionist)' },
        ],
        isActive: true,
      },
      {
        name: 'Inscripción',
        trigger: 'inscrib',
        steps: [
          { type: 'text', content: 'Para inscribirte:' },
          { type: 'text', content: '1. Visita nuestro gimnasio' },
          { type: 'text', content: '2. Trae una identificación' },
          { type: 'text', content: '3. Elige tu plan' },
          { type: 'text', content: '¿Te gustaría que un asesor te contacte?' },
        ],
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Conversation flows created');

  await prisma.keywordRule.createMany({
    data: [
      {
        name: 'Saludo',
        keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hello', 'hi'],
        matchType: 'contains',
        responseType: 'text',
        responseContent: { message: '¡Hola! Bienvenido a Global Fit Gym. ¿En qué puedo ayudarte?' },
        priority: 1,
        isEnabled: true,
      },
      {
        name: 'Cerrar',
        keywords: ['adiós', 'hasta luego', 'bye', 'gracias', 'thanks'],
        matchType: 'contains',
        responseType: 'text',
        responseContent: { message: '¡Gracias por contactarnos! Te esperamos en Global Fit. ¡Que tengas un excelente día!' },
        priority: 2,
        isEnabled: true,
      },
      {
        name: 'Clases',
        keywords: ['clase', 'spinning', 'yoga', 'pilates', 'crossfit'],
        matchType: 'contains',
        responseType: 'text',
        responseContent: { message: 'Ofrecemos diversas clases: Spinning, Yoga, Pilates, Crossfit y más. ¿Te interesa alguna en particular?' },
        priority: 3,
        isEnabled: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Keyword rules created');

  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
