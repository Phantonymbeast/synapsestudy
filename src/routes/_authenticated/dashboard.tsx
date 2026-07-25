import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/synapse.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Flame, Trophy, Target, ListChecks, Lightbulb, CalendarClock, ArrowRight, Sparkles } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Synapse Study AI" }, { name: "description", content: "Your learning dashboard: streak, XP, quiz performance, and recent activity." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  if (isLoading || !data) return <DashboardSkeleton />;

  const xpPct = data.nextLevelXP ? Math.min(100, Math.round((data.totalXP / data.nextLevelXP) * 100)) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-brand-soft p-8">
        <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-brand opacity-25 blur-3xl animate-float-slow" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back{data.profile?.display_name ? `, ${data.profile.display_name}` : ""}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Let's think, <span className="text-gradient-brand">together</span>.</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Pick up where you left off, take a quick quiz, or reflect on today's session.</p>
          </div>
          <Link to="/tutor">
            <Button size="lg" className="bg-gradient-brand text-white shadow-glow">
              <Brain className="mr-2 h-4 w-4" /> Ask the tutor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Flame} label="Day streak" value={data.streak} accent="text-orange-500" />
        <StatCard icon={Trophy} label="Level" value={data.level} sub={`${data.totalXP} XP`} />
        <StatCard icon={Target} label="Avg quiz score" value={`${data.avgScore}%`} sub={`${data.quizCount} completed`} />
        <Card className="glass p-4">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Next level</div>
          <div className="text-2xl font-bold">Lv {data.level + 1}</div>
          <Progress value={xpPct} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">{data.totalXP} / {data.nextLevelXP} XP</div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction to="/quiz" icon={ListChecks} title="Generate a quiz" desc="Test what you know in 5 minutes" />
        <QuickAction to="/planner" icon={CalendarClock} title="Plan an exam" desc="Personalized timetable in seconds" />
        <QuickAction to="/reflection" icon={Lightbulb} title="Reflect on today" desc="One sentence. Deep insight." />
      </div>

      {/* Weekly + recent */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">This week's momentum</h3>
            <span className="text-xs text-muted-foreground">XP by day</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.2 285)" />
                    <stop offset="100%" stopColor="oklch(0.72 0.16 210)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="xp" fill="url(#xpGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-3 font-semibold">Recent activity</h3>
          <div className="space-y-2 text-sm">
            {data.recentConversations.length === 0 && data.recentQuizzes.length === 0 && (
              <p className="text-muted-foreground">No activity yet — start with the AI Tutor.</p>
            )}
            {data.recentConversations.slice(0, 3).map((c) => (
              <Link key={c.id} to="/tutor/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent">
                <div className="flex items-center gap-2 truncate"><Brain className="h-3.5 w-3.5 text-primary" /><span className="truncate">{c.title}</span></div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
            {data.recentQuizzes.slice(0, 3).map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                <div className="flex items-center gap-2 truncate"><ListChecks className="h-3.5 w-3.5 text-primary" /><span className="truncate">{q.subject}</span></div>
                <span className="text-xs text-muted-foreground">{q.score ?? "-"}/{q.total}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Philosophy card */}
      <Card className="glass border-primary/30 p-6">
        <p className="text-sm text-muted-foreground">Synapse philosophy</p>
        <p className="mt-1 text-lg font-medium">"The AI doesn't think <em>instead</em> of you. It thinks <span className="text-gradient-brand">with</span> you."</p>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <Card className="glass p-4 hover-lift hover:shadow-glow">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent ?? "text-primary"}`} /> {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to as never} className="group">
      <Card className="glass h-full p-5 hover-lift hover:shadow-glow">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-brand-soft p-2.5"><Icon className="h-4 w-4 text-primary" /></div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}