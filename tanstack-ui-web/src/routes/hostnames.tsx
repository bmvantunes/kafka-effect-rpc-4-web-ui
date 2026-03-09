import { createFileRoute } from "@tanstack/react-router";
import { HostnamesView } from "../components/hostnames-view";

export const Route = createFileRoute("/hostnames")({
  component: HostnamesView
});
