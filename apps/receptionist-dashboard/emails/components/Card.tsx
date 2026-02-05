import React from "react";
import { Section, Text } from "@react-email/components";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => {
  return (
    <Section
      className={`my-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </Section>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
}

export const InfoRow = ({ label, value, icon }: InfoRowProps) => {
  return (
    <div className="mb-3 flex items-start">
      <span className="mr-3 text-lg">{icon || "•"}</span>
      <div>
        <Text className="m-0 text-sm font-medium text-gray-500">{label}</Text>
        <Text className="m-0 text-base font-semibold text-gray-900">{value}</Text>
      </div>
    </div>
  );
};
