import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Lightbulb, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { submitReflection, listReflections } from "@/lib/synapse.functions";

export const Route = createFileRoute("/_authenticated/reflection")({
  head: () => ({ meta: [{ title: "Reflection \u00b7 Synapse" }, { name: "description", content: "End-of-session reflection with AI feedback." }] }),
  component: ReflectionPage,
});

function ReflectionPage() {
  const submit = useServerFn(submitReflection);
  const list = useServerFn(listReflections);
  const qc = useQueryClient();
  const [content, setContent] = useState("");

  const items = useQuery({ queryKey: ["reflections"], queryFn: () => list() });

  const mutation = useMutation({
    mutationFn: () => submit({ data: { content } }),
    onSuccess: () => { setContent(""); qc.invalidateQueries({ queryKey: ["reflections"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Reflection saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gradient-brand-soft p-2.5"><Lightbulb className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reflection</h1>
          <p className="text-sm text-muted-foreground">In one sentence \u2014 what did you learn today?</p>
        </div>
      </div>

      <Card className="glass p-5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Today I learned that..."
          className="resize-none"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={() => mutation.mutate()} disabled={!content.trim() || mutation.isPending} className="bg-gradient-brand text-white shadow-glow">
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Get Synapse feedback
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {items.data?.map((r) => (
          <Card key={r.id} className="glass p-5 animate-fade-in-up">
            <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            <p className="mt-1 text-sm italic">"{r.content}"</p>
            {r.ai_feedback && (
              <div className="mt-3 rounded-xl bg-gradient-brand-soft p-3">
                <Markdown>{r.ai_feedback}</Markdown>
              </div>
            )}
          </Card>
        ))}
        {items.data?.length === 0 && <p className="text-sm text-muted-foreground">No reflections yet.</p>}
      </div>
    </div>
  );
}