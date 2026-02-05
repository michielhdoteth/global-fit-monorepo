import React from "react";
import {
  Heading,
  Text,
  Section,
  Button,
} from "@react-email/components";
import { BaseLayout } from "./components/BaseLayout";

interface WelcomeEmailProps {
  clientName: string;
  gymName?: string;
  gymPhone?: string;
  gymWebsite?: string;
}

export const WelcomeEmail = ({
  clientName = "Cliente",
  gymName = "Global Fit",
  gymPhone = "+52 833 443 0060",
  gymWebsite = "www.globalfit.com.mx",
}: WelcomeEmailProps) => {
  return (
    <BaseLayout previewText={`¡Bienvenido a ${gymName}!`} gymName={gymName}>
      <Heading className="m-0 mb-4 text-2xl font-bold text-gray-900">
        ¡Bienvenido a la familia {gymName}! 🎉
      </Heading>
      <Text className="m-0 mb-6 text-base text-gray-600">
        Hola <strong className="text-gray-900">{clientName}</strong>,
      </Text>
      <Text className="m-0 mb-6 text-base text-gray-600">
        ¡Estamos encantados de tenerte con nosotros! Gracias por confiar en{" "}
        {gymName} para tu viaje hacia una vida más saludable.
      </Text>

      <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
        <Text className="m-0 mb-3 text-sm font-semibold text-gray-900">
          📋 Próximos pasos:
        </Text>
        <Text className="m-0 text-sm text-gray-600">
          1. Programa tu primera sesión de entrenamiento<br />
          2. Explora nuestras clases grupales<br />
          3. Conoce nuestro equipo de instructores
        </Text>
      </Section>

      <Section className="mt-8 text-center">
        <Button
          href={`https://wa.me/${gymPhone.replace(/\D/g, "")}`}
        >
          Contáctanos por WhatsApp
        </Button>
      </Section>

      <Section className="mt-6 text-center">
        <Text className="m-0 text-sm text-gray-500">
          Visítanos: {gymWebsite}
        </Text>
      </Section>
    </BaseLayout>
  );
};

export default WelcomeEmail;
