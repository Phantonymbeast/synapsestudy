import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SynapseWordmark } from "@/components/synapse-logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Synapse Study AI" },
      { name: "description", content: "Sign in to your AI study companion." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Hard navigation guarantees the protected route re-evaluates with the
  // freshly persisted session (no manual refresh needed).
  const goToDashboard = () => {
    window.location.replace("/dashboard");
  };

  useEffect(() => {
    let done = false;
    const enter = () => {
      if (done) return;
      done = true;
      goToDashboard();
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) enter();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) enter();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleEmail = async (mode: "sign-in" | "sign-up") => {
    if (!email || !password) return toast.error("Enter your email and password");
    setLoading(true);
    try {
      const { error } =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            });
      if (error) throw error;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        toast.success("Welcome back!");
        goToDashboard();
        return;
      }
      toast.success("Check your email to confirm your account.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    goToDashboard();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-brand opacity-25 blur-3xl animate-float-slow" />
      </div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-6 flex justify-center"><SynapseWordmark /></div>
        <div className="glass rounded-2xl p-6 shadow-glow-lg">
          <h1 className="text-center text-2xl font-bold tracking-tight">Welcome to Synapse</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Learn Smarter. Think Together.</p>

          <Button variant="outline" className="mt-6 w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="sign-in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="sign-up">Create account</TabsTrigger>
            </TabsList>
            {(["sign-in", "sign-up"] as const).map((m) => (
              <TabsContent value={m} key={m} className="space-y-3 pt-4">
                <div className="space-y-1">
                  <Label htmlFor={`${m}-email`}>Email</Label>
                  <Input id={`${m}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`${m}-password`}>Password</Label>
                  <Input id={`${m}-password`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-95" onClick={() => handleEmail(m)} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {m === "sign-in" ? "Sign in" : "Create account"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}