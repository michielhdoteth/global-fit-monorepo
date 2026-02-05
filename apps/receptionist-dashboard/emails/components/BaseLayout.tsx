import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

interface BaseLayoutProps {
  previewText?: string;
  children: React.ReactNode;
  gymName?: string;
}

export const BaseLayout = ({
  previewText = "Mensaje de Global Fit",
  children,
  gymName = "Global Fit",
}: BaseLayoutProps) => {
  return (
    <Html lang="es">
      <Head>
        <style>{`
          .hover-bg-brand-600:hover { background-color: #4f5df0; }
          .hover-text-brand-500:hover { color: #667eea; }
          a { text-decoration: underline; }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: {
                  50: "#f0f4ff",
                  100: "#e0e8ff",
                  200: "#c7d4fe",
                  300: "#a3b6fc",
                  400: "#7d8ff8",
                  500: "#667eea",
                  600: "#4f5df0",
                  700: "#3f46e1",
                  800: "#3539c4",
                  900: "#3033a1",
                  950: "#1e1d5f",
                },
              },
              fontFamily: {
                sans: [
                  "ui-sans-serif",
                  "system-ui",
                  "sans-serif",
                  "Apple Color Emoji",
                  "Segoe UI Emoji",
                  "Segoe UI Symbol",
                  "Noto Color Emoji",
                ],
              },
            },
          },
        }}
      >
        <Body className="bg-gray-100 font-sans text-gray-900">
          <Container className="mx-auto my-0 max-w-[600px] rounded-none bg-white pt-0">
            <Section className="mt-0 mb-0 bg-gradient-to-r from-brand-500 to-brand-700 px-8 py-10 text-center">
              <Img
                src="https://placehold.co/120x60/ffffff/ffffff?text=GF"
                width="60"
                height="30"
                alt={gymName}
                className="mx-auto"
              />
              <Heading className="m-0 text-2xl font-bold text-white">
                {gymName}
              </Heading>
            </Section>
            <Section className="bg-gray-50 px-8 py-10">{children}</Section>
            <Section className="border-t border-gray-200 bg-white px-8 py-8 text-center">
              <Text className="m-0 mb-2 text-sm text-gray-500">
                © {new Date().getFullYear()} {gymName}. Todos los derechos reservados.
              </Text>
              <Text className="m-0 text-xs text-gray-400">
                ¿Dudas? Contáctanos por WhatsApp
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
