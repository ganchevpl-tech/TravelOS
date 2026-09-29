import { createFileRoute } from "@tanstack/react-router";
import TravelOSUltimate from "@/components/TravelOS";

export const Route = createFileRoute("/")({
  component: TravelOSUltimate,
});
