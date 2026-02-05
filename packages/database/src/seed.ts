import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, ClientStatus, AppointmentStatus, CampaignStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const email = (process.env.ADMIN_EMAIL || "admin@globalfit.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const fullName = process.env.ADMIN_NAME || "Global Fit Admin";

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      hashedPassword,
      fullName,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email,
      hashedPassword,
      fullName,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('Admin user created/updated');

  await prisma.team.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Default Team' },
  });

  console.log('Default team created');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

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
      },
    }),
  ]);

  console.log('Created', clients.length, 'clients');

  await prisma.appointment.createMany({
    data: [
      { title: 'Entrenamiento Personalizado', description: 'Sesión de entrenamiento con foco en cardio', date: formatDate(today), time: '08:00', duration: 60, status: AppointmentStatus.CONFIRMED, clientId: clients[0].id, location: 'Sala 1' },
      { title: 'Clase de Spinning', description: 'Clase grupal de spinning', date: formatDate(today), time: '18:00', duration: 45, status: AppointmentStatus.CONFIRMED, clientId: clients[1].id, location: 'Sala de Spinning' },
      { title: 'Evaluación Física', description: 'Evaluación inicial para nuevo plan', date: formatDate(tomorrow), time: '10:00', duration: 90, status: AppointmentStatus.PENDING, clientId: clients[4].id, location: 'Consultorio' },
      { title: 'Entrenamiento de Fuerza', description: 'Rutina de fuerza para miembros superiores', date: formatDate(nextWeek), time: '07:00', duration: 60, status: AppointmentStatus.CONFIRMED, clientId: clients[2].id, location: 'Sala 2' },
      { title: 'Clase de Yoga', description: 'Sesión de yoga relajante', date: formatDate(tomorrow), time: '19:00', duration: 60, status: AppointmentStatus.CONFIRMED, clientId: clients[3].id, location: 'Sala de Yoga' },
    ],
    skipDuplicates: true,
  });

  console.log('Created 5 appointments');

  await prisma.campaign.create({
    data: {
      name: 'Promoción Enero 2025',
      description: 'Campaña de renovación de membresías',
      status: CampaignStatus.ACTIVE,
      type: 'whatsapp',
      content: '¡Hola! Tenemos una oferta especial para ti. Renueva tu membresía este mes y obtén 20% de descuento.',
      clientId: clients[0].id,
      startDate: today,
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Created campaign');

  await prisma.chatbotSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isEnabled: true,
      defaultResponse: '¡Hola! Bienvenido a Global Fit Gym. ¿En qué puedo ayudarte hoy?',
      fallbackMessage: 'No entendí tu mensaje. ¿Podrías reformularlo?',
      systemPrompt: 'Eres el asistente virtual de Global Fit Gym. Ayudas con información sobre membresías, horarios y servicios.',
      aiEnabled: true,
      aiProvider: 'deepseek',
      aiModel: 'deepseek-chat',
    },
  });

  await prisma.llmSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, provider: 'deepseek', model: 'deepseek-chat', temperature: 0.7, maxTokens: 1000, isEnabled: true },
  });

  console.log('Created chatbot and LLM settings');

  await prisma.conversationFlow.createMany({
    data: [
      { name: 'Horarios', trigger: 'horario', steps: [{ type: 'text', content: 'Lunes-Viernes: 6AM-10PM, Sábados-Domingos: 8AM-8PM' }], isActive: true },
      { name: 'Precios', trigger: 'precio', steps: [{ type: 'text', content: 'Básico: $399, Premium: $699, VIP: $999/mes' }], isActive: true },
      { name: 'Inscripción', trigger: 'inscrib', steps: [{ type: 'text', content: 'Visítanos con ID y elige tu plan. ¿Te contactamos?' }], isActive: true },
    ],
    skipDuplicates: true,
  });

  console.log('Created conversation flows');

  await prisma.keywordRule.createMany({
    data: [
      { name: 'Saludo', keywords: ['hola', 'buenos días', 'hello', 'hi'], matchType: 'contains', responseType: 'text', responseContent: { message: '¡Hola! Bienvenido a Global Fit Gym. ¿En qué puedo ayudarte?' }, priority: 1, isEnabled: true },
      { name: 'Cerrar', keywords: ['adiós', 'gracias', 'bye'], matchType: 'contains', responseType: 'text', responseContent: { message: '¡Gracias! Te esperamos en Global Fit.' }, priority: 2, isEnabled: true },
      { name: 'Clases', keywords: ['clase', 'spinning', 'yoga'], matchType: 'contains', responseType: 'text', responseContent: { message: 'Ofrecemos Spinning, Yoga, Pilates y más. ¿Te interesa alguna?' }, priority: 3, isEnabled: true },
    ],
    skipDuplicates: true,
  });

  console.log('Created keyword rules');
  console.log('Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
