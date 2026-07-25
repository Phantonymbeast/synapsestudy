import { createFileRoute } from "@tanstack/react-router";
import { TutorView } from "@/components/tutor-view";

export const Route = createFileRoute("/_authenticated/tutor/$id")({
  head: () => ({ meta: [{ title: "AI Tutor · Synapse" }] }),
  component: () => {
    const { id } = Route.useParams();
    return <TutorView conversationId={id} />;
  },
});