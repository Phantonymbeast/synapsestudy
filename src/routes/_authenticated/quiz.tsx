import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Loader2, Sparkles, ListChecks, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { generateQuiz, submitQuiz } from "@/lib/synapse.functions";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({ meta: [{ title: "Quiz Generator · Synapse" }, { name: "description", content: "AI-generated quizzes with mistake analysis." }] }),
  component: QuizPage,
});

type Question = { question: string; options: string[]; answer_index: number; explanation: string };
type Quiz = { id: string; subject: string; topic: string | null; difficulty: string; total: number; questions: Question[] };

function QuizPage() {
  const gen = useServerFn(generateQuiz);
  const submit = useServerFn(submitQuiz);

  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("Newton's Laws");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Awaited<ReturnType<typeof submit>> | null>(null);

  const genMutation = useMutation({
    mutationFn: () => gen({ data: { subject, topic, difficulty, count, type: "mcq" } }),
    onSuccess: (q) => {
      setQuiz(q as Quiz);
      setAnswers(new Array((q as Quiz).questions.length).fill(-1));
      setResult(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const submitMutation = useMutation({
    mutationFn: () => submit({ data: { id: quiz!.id, answers } }),
    onSuccess: (r) => {
      setResult(r);
      if (r.score / r.total >= 0.8) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!quiz) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <PageHeader icon={ListChecks} title="Quiz Generator" desc="Test what you know. Learn from what you don't." />
        <Card className="glass p-6 mt-6">
          <div className="grid gap-4">
            <div className="grid gap-1"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="grid gap-1"><Label>Topic (optional)</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Number of questions</Label>
                <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[3, 5, 8, 10].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => genMutation.mutate()}
              disabled={genMutation.isPending}
              className="bg-gradient-brand text-white shadow-glow"
            >
              {genMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const answered = answers.filter((a) => a >= 0).length;
  const allAnswered = answered === quiz.questions.length;

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <PageHeader icon={ListChecks} title="Your results" desc={`${quiz.subject}${quiz.topic ? ` \u00b7 ${quiz.topic}` : ""}`} />
        <Card className="glass overflow-hidden">
          <div className="bg-gradient-brand p-6 text-white">
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold">{result.score}<span className="text-2xl opacity-70">/{result.total}</span></div>
              <div>
                <div className="text-lg font-semibold">{pct}%</div>
                <div className="text-xs opacity-80">{pct >= 80 ? "\u{1F389} Excellent" : pct >= 60 ? "\ud83d\udc4d Solid" : "\ud83d\udcaa Room to grow"}</div>
              </div>
            </div>
            <Progress value={pct} className="mt-4 h-2 bg-white/20" />
          </div>
          <div className="p-6">
            <h3 className="mb-2 font-semibold">Mistake analysis</h3>
            <Markdown>{result.analysis}</Markdown>
          </div>
        </Card>

        {quiz.questions.map((q, i) => {
          const chose = answers[i];
          const correct = chose === q.answer_index;
          return (
            <Card key={i} className={`glass p-4 ${correct ? "border-primary/40" : "border-destructive/40"}`}>
              <div className="flex items-start gap-2">
                {correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <XCircle className="mt-0.5 h-4 w-4 text-destructive" />}
                <div className="flex-1">
                  <p className="font-medium">{i + 1}. {q.question}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {q.options.map((o, oi) => (
                      <div key={oi} className={`rounded px-2 py-1 ${oi === q.answer_index ? "bg-primary/10 text-primary font-medium" : oi === chose ? "bg-destructive/10 text-destructive" : "text-muted-foreground"}`}>
                        {String.fromCharCode(65 + oi)}. {o}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Why:</span> {q.explanation}</p>
                </div>
              </div>
            </Card>
          );
        })}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setQuiz(null); setResult(null); }}><RotateCcw className="mr-2 h-4 w-4" />Another quiz</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <PageHeader icon={ListChecks} title={quiz.subject} desc={quiz.topic ?? undefined} />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="outline">{quiz.difficulty}</Badge>
        <span>{answered}/{quiz.questions.length} answered</span>
      </div>
      <Progress value={(answered / quiz.questions.length) * 100} className="h-1" />

      {quiz.questions.map((q, i) => (
        <Card key={i} className="glass p-5 animate-fade-in-up">
          <p className="font-medium">{i + 1}. {q.question}</p>
          <RadioGroup
            value={answers[i] >= 0 ? String(answers[i]) : ""}
            onValueChange={(v) => setAnswers((a) => { const n = [...a]; n[i] = Number(v); return n; })}
            className="mt-3"
          >
            {q.options.map((o, oi) => (
              <label key={oi} htmlFor={`q${i}-${oi}`} className="flex items-center gap-2 rounded-lg border border-transparent p-2 text-sm hover:border-border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value={String(oi)} id={`q${i}-${oi}`} />
                <span>{String.fromCharCode(65 + oi)}. {o}</span>
              </label>
            ))}
          </RadioGroup>
        </Card>
      ))}

      <Button
        onClick={() => submitMutation.mutate()}
        disabled={!allAnswered || submitMutation.isPending}
        className="bg-gradient-brand text-white shadow-glow"
        size="lg"
      >
        {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit answers
      </Button>
    </div>
  );
}

function PageHeader({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-gradient-brand-soft p-2.5"><Icon className="h-5 w-5 text-primary" /></div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
    </div>
  );
}