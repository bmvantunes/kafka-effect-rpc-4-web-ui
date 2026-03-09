import { createFileRoute } from "@tanstack/react-router";
import { AppNamesView } from "../components/appnames-view";

export const Route = createFileRoute("/appnames")({
  component: AppNamesView
});
