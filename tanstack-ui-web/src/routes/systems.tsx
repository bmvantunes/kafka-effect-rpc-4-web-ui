import { createFileRoute } from "@tanstack/react-router";
import { SystemsView } from "../components/systems-view";

export const Route = createFileRoute("/systems")({
  component: SystemsView
});
