import { createFileRoute } from "@tanstack/react-router";
import { RegionsView } from "../components/regions-view";

export const Route = createFileRoute("/regions")({
  component: RegionsView
});
