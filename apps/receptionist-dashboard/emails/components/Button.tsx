import React from "react";
import { Button as ReactEmailButton, Text } from "@react-email/components";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const Button = ({ href, children, variant = "primary" }: ButtonProps) => {
  const baseStyles = "rounded-lg px-6 py-3 text-sm font-semibold transition-colors";
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  return (
    <ReactEmailButton
      href={href}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {children}
    </ReactEmailButton>
  );
};
