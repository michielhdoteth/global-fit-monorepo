import React from "react";
import {
  Heading,
  Text,
  Section,
  Button,
  Hr,
} from "@react-email/components";
import { BaseLayout } from "./components/BaseLayout";

interface CampaignEmailProps {
  clientName: string;
  campaignSubject: string;
  campaignContent: string;
  gymName?: string;
  gymPhone?: string;
  gymWebsite?: string;
  unsubscribeUrl?: string;
}

export const CampaignEmail = ({
  clientName = "Cliente",
  campaignSubject = "Mensaje de Global Fit",
  campaignContent = "",
  gymName = "Global Fit",
  gymPhone = "+52 833 443 0060",
  gymWebsite = "www.globalfit.com.mx",
  unsubscribeUrl = "#",
}: CampaignEmailProps) => {
  return (
    <BaseLayout previewText={campaignSubject} gymName={gymName}>
      <Heading className="m-0 mb-4 text-2xl font-bold text-gray-900">
        {campaignSubject}
      </Heading>
      <Text className="m-0 mb-6 text-base text-gray-600">
        Hola <strong className="text-gray-900">{clientName}</strong>,
      </Text>

      <Section className="my-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-4">
        <Text
          className="m-0 text-base text-gray-700"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {campaignContent}
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
          Visítanos en nuestras instalaciones
        </Text>
        <Text className="m-0 text-sm font-medium text-brand-600">
          {gymWebsite}
        </Text>
      </Section>

      <Hr className="my-8 border-gray-200" />

      <Section className="text-center">
        <Text className="m-0 text-xs text-gray-400">
          ¿No deseas recibir estos correos?{" "}
          <a
            href={unsubscribeUrl}
            className="text-brand-600 underline"
          >
            Dar de baja
          </a>
        </Text>
      </Section>
    </BaseLayout>
  );
};

export default CampaignEmail;
