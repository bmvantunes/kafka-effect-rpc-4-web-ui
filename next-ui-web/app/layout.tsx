import type { Metadata } from "next";
import { MonitorShell } from "../components/monitor-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse Monitor",
  description: "Cross-region heartbeat supervision for Kafka-driven systems"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MonitorShell>{children}</MonitorShell>
      </body>
    </html>
  );
}
