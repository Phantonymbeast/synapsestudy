import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, CalendarClock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateStudyPlan, listStudyPlans } from "@/lib/synapse.functions";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Study Planner \u00b7 Synapse" }, { name: "description", content: "Personalized AI study timetables for your exams." }] }),
  component: PlannerPage,
});

type Plan = {
  overview: string;
  days: Array<{ date: string; focus: string; blocks: Array<{ time: string; subject: string; activity: string }> }>;
  tips: string[];
};

function PlannerPage() {
  const gen = useServerFn(generateStudyPlan);
  const list = useServerFn(listStudyPlans);
  const qc = useQueryClient();

  const plans = useQuery({ queryKey: ["plans"], queryFn: () => list() });

  const [examName, setExamName] = useState("Biology Final");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10);
  });
  const [subjects, setSubjects] = useState("Cell biology, Genetics, Ecology");
  const [hours, setHours] = useState(3);
  const [weak, setWeak] = useState("Genetics ratios");
  const [strong, setStrong] = useState("Cell structure");

  const genMutation = useMutation({
    mutationFn: () => gen({ data: { exam_name: examName, exam_date: examDate, subjects, hours_per_day: hours, weak_topics: weak, strong_topics: strong } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("Plan ready!"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gradient-brand-soft p-2.5"><CalendarClock className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-sm text-muted-foreground">A realistic timetable, personalized to your gaps.</p>
        </div>
      </div>

      <Card className="glass p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1"><Label>Exam name</Label><Input value={examName} onChange={(e) => setExamName(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Exam date</Label><Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></div>
          <div className="grid gap-1 md:col-span-2"><Label>Subjects / topics</Label><Textarea rows={2} value={subjects} onChange={(e) => setSubjects(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Daily study hours</Label><Input type="number" min={0.5} max={16} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} /></div>
          <div className="grid gap-1"><Label>Weak topics</Label><Input value={weak} onChange={(e) => setWeak(e.target.value)} /></div>
          <div className="grid gap-1 md:col-span-2"><Label>Strong topics</Label><Input value={strong} onChange={(e) => setStrong(e.target.value)} /></div>
        </div>
        <Button onClick={() => genMutation.mutate()} disabled={genMutation.isPending} className="mt-4 bg-gradient-brand text-white shadow-glow">
          {genMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate plan
        </Button>
      </Card>

      {plans.data?.map((p) => {
        const plan = p.plan as Plan;
        return (
          <Card key={p.id} className="glass p-6 animate-fade-in-up">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{p.exam_name}</h2>
                <p className="text-xs text-muted-foreground">Exam on {p.exam_date}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{plan.overview}</p>
            <div className="mt-4 grid gap-3">
              {plan.days?.map((d, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-background/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-medium">{d.date}</div>
                    <div className="text-xs text-primary">{d.focus}</div>
                  </div>
                  <div className="space-y-1">
                    {d.blocks?.map((b, bi) => (
                      <div key={bi} className="flex gap-3 text-sm">
                        <span className="w-28 shrink-0 text-muted-foreground">{b.time}</span>
                        <span className="font-medium">{b.subject}</span>
                        <span className="text-muted-foreground">\u2014 {b.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {plan.tips && plan.tips.length > 0 && (
              <div className="mt-4 rounded-xl bg-gradient-brand-soft p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Tips</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">{plan.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}