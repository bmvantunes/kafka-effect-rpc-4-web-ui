import { createFileRoute } from "@tanstack/react-router";
import { ProcessNamesView } from "../components/process-names-view";

export const Route = createFileRoute("/process-names")({
  component: ProcessNamesView
});
