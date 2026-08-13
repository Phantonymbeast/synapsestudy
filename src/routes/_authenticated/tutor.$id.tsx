import { createFileRoute } from "@tanstack/react-router";
import { TutorView } from "@/components/tutor-view";

export const Route = createFileRoute("/_authenticated/tutor/$id")({
  head: () => ({ meta: [
    { title: "Tutor Conversation · Synapse" },
    { name: "description", content: "Continue your guided study conversation with Synapse AI." },
    { property: "og:title", content: "Tutor Conversation · Synapse" },
    { property: "og:description", content: "Continue your guided study conversation with Synapse AI." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => {
    const { id } = Route.useParams();
    return <TutorView conversationId={id} />;
  },
});