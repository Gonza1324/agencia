import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Control Agencia",
  title: {
    default: "Control Agencia",
    template: "%s | Control Agencia",
  },
  description: "Panel interno para control diario de caja y subagentes.",
  robots: {
    index: false,
    follow: false,
  },
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
