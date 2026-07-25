import { createFileRoute } from "@tanstack/react-router";
import { TutorView } from "@/components/tutor-view";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor · Synapse" }, { name: "description", content: "A Socratic AI tutor that thinks with you." }] }),
  component: () => <TutorView />,
});