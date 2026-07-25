import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/synapse.functions";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress \u00b7 Synapse" }, { name: "description", content: "Track your learning progress, quiz scores, streaks and mastery over time." }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const fn = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const scores = (data?.recentQuizzes ?? [])
    .filter((q) => q.completed_at)
    .slice()
    .reverse()
    .map((q, i) => ({ n: i + 1, pct: Math.round(((q.score ?? 0) / (q.total || 1)) * 100), subject: q.subject }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gradient-brand-soft p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <p className="text-sm text-muted-foreground">Your learning momentum, at a glance.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass p-5">
          <p className="text-xs text-muted-foreground">Total XP</p>
          <p className="text-3xl font-bold">{data?.totalXP ?? 0}</p>
        </Card>
        <Card className="glass p-5">
          <p className="text-xs text-muted-foreground">Current level</p>
          <p className="text-3xl font-bold">Lv {data?.level ?? 1}</p>
        </Card>
        <Card className="glass p-5">
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="text-3xl font-bold">{data?.streak ?? 0}\u00a0<span className="text-sm text-muted-foreground">days</span></p>
        </Card>
      </div>

      <Card className="glass p-5">
        <h3 className="mb-3 font-semibold">Quiz score trend</h3>
        <div className="h-64">
          {scores.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Take a quiz to see your progress.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="n" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="pct" stroke="oklch(0.72 0.2 285)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="glass p-5">
        <h3 className="mb-3 font-semibold">Recent quizzes</h3>
        <div className="space-y-2 text-sm">
          {data?.recentQuizzes.map((q) => (
            <div key={q.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <div>
                <div className="font-medium">{q.subject}</div>
                <div className="text-xs text-muted-foreground">{q.difficulty} \u00b7 {new Date(q.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-sm font-semibold">{q.score ?? "-"}/{q.total}</div>
            </div>
          ))}
          {(data?.recentQuizzes.length ?? 0) === 0 && <p className="text-muted-foreground">No quizzes yet.</p>}
        </div>
      </Card>
    </div>
  );
}