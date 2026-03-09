/// <reference types="vite/client" />

import type { ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute
} from "@tanstack/react-router";
import { MonitorShell } from "../components/monitor-shell";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "Pulse Monitor TanStack"
      },
      {
        name: "description",
        content: "Cross-region heartbeat supervision with TanStack Start"
      }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <MonitorShell>
        <Outlet />
      </MonitorShell>
    </RootDocument>
  );
}

function RootDocument({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
