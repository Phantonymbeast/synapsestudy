import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SynapseWordmark } from "@/components/synapse-logo";
import { ArrowRight, Brain, Lightbulb, Sparkles, Target, MessagesSquare, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Synapse Study AI — Learn Smarter. Think Together." },
      { name: "description", content: "Synapse is an AI study companion that guides you through problems instead of solving them for you. Socratic tutoring, adaptive quizzes, and personalized plans." },
      { property: "og:title", content: "Synapse Study AI" },
      { property: "og:description", content: "The AI that thinks WITH you — not instead of you." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-brand opacity-30 blur-3xl animate-float-slow" />
        <div className="absolute top-40 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-brand opacity-25 blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-brand opacity-20 blur-3xl animate-float-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <SynapseWordmark />
        <div className="flex items-center gap-3">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth"><Button size="sm" className="bg-gradient-brand text-white shadow-glow hover:opacity-95">Get started</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="animate-fade-in-up mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            SYNAPTICA · Duality of Mind
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            The AI that thinks <span className="text-gradient-brand">with</span> you —{" "}
            <span className="text-gradient-brand">not instead</span> of you.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Synapse is your Socratic study companion. It guides, coaches, adapts — and hands you the answer only once you're ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="group bg-gradient-brand text-white shadow-glow-lg hover:opacity-95">
                Start learning free
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">See how it works</Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Learn Smarter. Think Together.</p>
        </div>

        <div id="features" className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            { icon: Brain, title: "Socratic Tutor", desc: "Guiding questions before answers. You do the thinking; Synapse keeps you moving." },
            { icon: Target, title: "Confidence-based teaching", desc: "Rate your confidence — the AI switches between analogies, harder problems, or gentle recaps." },
            { icon: MessagesSquare, title: "Adaptive quizzes", desc: "Not just a score. Get an AI breakdown of what you get, what you don't, and what to revise next." },
            { icon: Lightbulb, title: "Reflection mode", desc: "One sentence at end of session. Synapse surfaces the idea you almost missed." },
            { icon: LineChart, title: "Progress that motivates", desc: "XP, streaks, mastery — gamified in a way that reinforces learning, not distracts from it." },
            { icon: Sparkles, title: "Personalised plans", desc: "Exam in 3 days? Synapse builds you a realistic timetable, prioritising your weak spots." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover-lift hover:shadow-glow">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand-soft">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 rounded-3xl border border-border/60 bg-gradient-brand-soft p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Stop copying answers. Start understanding.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Join the students who use Synapse to think deeper, not less.</p>
          <Link to="/auth"><Button size="lg" className="mt-6 bg-gradient-brand text-white shadow-glow-lg">Get started free</Button></Link>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Synapse Study AI · SYNAPTICA – Duality of Mind
      </footer>
    </div>
  );
}
