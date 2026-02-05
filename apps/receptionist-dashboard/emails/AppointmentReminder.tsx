import React from "react";
import {
  Heading,
  Text,
  Section,
  Button,
} from "@react-email/components";
import { BaseLayout } from "./components/BaseLayout";
import { Card, InfoRow } from "./components/Card";

interface AppointmentReminderEmailProps {
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  gymName?: string;
  gymAddress?: string;
  gymPhone?: string;
}

export const AppointmentReminderEmail = ({
  clientName = "Cliente",
  appointmentDate = "Por confirmar",
  appointmentTime = "Por confirmar",
  gymName = "Global Fit",
  gymAddress = "Av. Principal 123, Ciudad",
  gymPhone = "+52 833 443 0060",
}: AppointmentReminderEmailProps) => {
  return (
    <BaseLayout previewText={`Recordatorio de tu cita en ${gymName}`} gymName={gymName}>
      <Heading className="m-0 mb-4 text-2xl font-bold text-gray-900">
        Recordatorio de Cita
      </Heading>
      <Text className="m-0 mb-6 text-base text-gray-600">
        Hola <strong className="text-gray-900">{clientName}</strong>,
      </Text>
      <Text className="m-0 mb-6 text-base text-gray-600">
        Este es un recordatorio de tu próxima cita en <strong className="text-gray-900">{gymName}</strong>.
        No olvides traer ropa cómoda y agua.
      </Text>

      <Card>
        <InfoRow
          label="Fecha"
          value={appointmentDate}
          icon="📅"
        />
        <InfoRow
          label="Hora"
          value={appointmentTime}
          icon="🕐"
        />
        <InfoRow
          label="Ubicación"
          value={gymAddress}
          icon="📍"
        />
      </Card>

      <Section className="mt-8 text-center">
        <Button
          href={`https://wa.me/${gymPhone.replace(/\D/g, "")}`}
        >
          Contactar por WhatsApp
        </Button>
      </Section>

      <Section className="mt-6 rounded-lg bg-yellow-50 px-4 py-3">
        <Text className="m-0 text-sm text-yellow-800">
          💡 <strong>Tip:</strong> Llega 10 minutos antes para cambiarte y prepararte mejor para tu sesión.
        </Text>
      </Section>
    </BaseLayout>
  );
};

export default AppointmentReminderEmail;
