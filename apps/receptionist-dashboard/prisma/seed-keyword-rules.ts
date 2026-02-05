/**
 * Seed script for default keyword rules
 * Run with: npx tsx prisma/seed-keyword-rules.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultRules = [
  {
    name: "Horarios",
    keywords: ["horario", "hora", "abierto", "abren", "cierran", "cuando abre", "a que hora"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Nuestros horarios son: Lunes a Viernes 6:00-22:00, Sabados 8:00-20:00. Domingos cerrado." },
    priority: 100,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Precios",
    keywords: ["precio", "costo", "cuota", "mensualidad", "tarifa", "plan", "cuanto cuesta", "cuanto vale"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Tenemos planes desde $29.99/mes. Incluye acceso a gym, clases grupales y vestidores. Pregunta por 'planes' para ver detalles completos." },
    priority: 100,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Clases",
    keywords: ["clase", "actividad", "yoga", "crossfit", "spinning", "zumba", "pilates", "clases grupales"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Ofrecemos Yoga, Crossfit, Spinning, Zumba y Pilates. Revisa el horario de clases en nuestra app o web." },
    priority: 90,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Ubicacion",
    keywords: ["ubicacion", "donde quedan", "direccion", "como llegar", "donde estan", "direccion"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Estamos ubicados en Av. Principal #123. Estacionamiento gratuito disponible para miembros." },
    priority: 90,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Contacto",
    keywords: ["telefono", "contacto", "whatsapp", "llamar", "email", "numero"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Puedes contactarnos por WhatsApp al +52 833 443 0060 o por email a info@globalfit.com.mx" },
    priority: 90,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Inscripcion",
    keywords: ["inscribirme", "registrarme", "unirme", "empezar", "inicio", "primer dia", "nuevo"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Para inscribirte, visita nuestra sucursal o completa el formulario en nuestra web. Traine ropa comoda y llegue 10 minutos antes para tu induccion." },
    priority: 95,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Transferir Humano",
    keywords: ["humano", "persona", "agente", "ayuda real", "hablar con alguien", "asesor", "representante"],
    matchType: "contains",
    responseType: "transfer",
    responseContent: { body: "Un momento, te transfiero con un agente humano que te podra ayudar mejor." },
    priority: 200,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Promociones",
    keywords: ["promocion", "descuento", "oferta", "promo", "descuentos", "ofertas", "especial"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Tenemos promociones especiales este mes. 50% de descuento en tu inscripcion y 2 semanas gratis. Pregunta por 'promo' en sucursal para mas detalles." },
    priority: 95,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Servicios",
    keywords: ["servicios", "instalaciones", "amenidades", "tienen", "cuentan con", "disponen"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Nuestros servicios incluyen: area de pesas, cardio, clases grupales, entrenadores personales, vestidores con lockers, regaderas y estacionamiento." },
    priority: 85,
    isEnabled: true,
    caseSensitive: false,
  },
  {
    name: "Saludo",
    keywords: ["hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal"],
    matchType: "contains",
    responseType: "text",
    responseContent: { body: "Hola! Bienvenido a Global Fit. En que puedo ayudarte hoy? Puedes preguntarme por horarios, precios, clases o ubicacion." },
    priority: 80,
    isEnabled: true,
    caseSensitive: false,
  },
];

async function main() {
  console.log('Starting keyword rules seed...');

  // Clear existing rules (optional, comment out if you want to keep existing)
  const existingCount = await prisma.keywordRule.count();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing rules. Skipping seed to avoid duplicates.`);
    console.log('To reseed, delete existing rules first or modify this script.');
    return;
  }

  // Create default rules
  for (const rule of defaultRules) {
    await prisma.keywordRule.create({
      data: rule,
    });
    console.log(`Created rule: ${rule.name}`);
  }

  console.log(`Seed completed! Created ${defaultRules.length} keyword rules.`);
}

main()
  .catch((e) => {
    console.error('Error seeding keyword rules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
