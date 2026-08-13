import { createFileRoute } from "@tanstack/react-router";
import { TutorView } from "@/components/tutor-view";

export const Route = createFileRoute("/_authenticated/tutor/")({
  head: () => ({ meta: [
    { title: "AI Tutor · Synapse" },
    { name: "description", content: "Learn through guided questions with the Synapse Socratic AI tutor." },
    { property: "og:title", content: "AI Tutor · Synapse" },
    { property: "og:description", content: "Learn through guided questions with the Synapse Socratic AI tutor." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <TutorView />,
});