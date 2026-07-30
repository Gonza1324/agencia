import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control Agencia",
  description: "Panel interno para control diario de caja y subagentes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
