import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatComplete, chatJSON, type ChatMsg } from "./ai.server";
import {
  ConversationIdInput,
  DIRECT_SYSTEM,
  PlannerInput,
  QuizGenInput,
  ReflectionInput,
  REVISION_SYSTEM,
  SendMessageInput,
  SOCRATIC_SYSTEM,
  SubmitQuizInput,
} from "./synapse-inputs";

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => SendMessageInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get or create conversation
    let convoId = data.conversationId;
    if (!convoId) {
      const title = data.content.slice(0, 60);
      const { data: c, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title, mode: data.mode })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      convoId = c.id;
    } else {
      const { data: existing, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", convoId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!existing) throw new Error("Conversation not found");
    }

    // Load history
    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })
      .limit(40);
    if (historyError) throw new Error(historyError.message);

    const systemPrompt =
      data.mode === "revision" ? REVISION_SYSTEM : data.mode === "direct" ? DIRECT_SYSTEM : SOCRATIC_SYSTEM;

    const userContent = data.confidence
      ? `[Student confidence: ${data.confidence}/5]\n${data.content}`
      : data.content;

    const messages: ChatMsg[] = [
      { role: "system", content: systemPrompt },
      ...((history ?? []).map((m) => ({ role: m.role as ChatMsg["role"], content: m.content }))),
      { role: "user", content: userContent },
    ];

    // Save user message
    const { error: userMessageError } = await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: userId,
      role: "user",
      content: data.content,
      confidence: data.confidence ?? null,
    });
    if (userMessageError) throw new Error(userMessageError.message);

    // Call AI
    const reply = await chatComplete({ messages, temperature: 0.8 });

    // Save assistant reply
    if (!reply.trim()) throw new Error("The tutor returned an empty response. Please try again.");

    const { error: assistantMessageError } = await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: userId,
      role: "assistant",
      content: reply,
    });
    if (assistantMessageError) throw new Error(assistantMessageError.message);

    // Touch conversation
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);

    // XP for engagement
    await supabase.from("xp_events").insert({ user_id: userId, kind: "chat", xp: 5 });

    return { conversationId: convoId, reply };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select("id, title, mode, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ConversationIdInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: convo, error: convoError } = await context.supabase
      .from("conversations")
      .select("id, title, mode")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (convoError) throw new Error(convoError.message);
    if (!convo) throw new Error("Not found");
    const { data: msgs, error: messagesError } = await context.supabase
      .from("messages")
      .select("id, role, content, confidence, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (messagesError) throw new Error(messagesError.message);
    return { conversation: convo, messages: msgs ?? [] };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ConversationIdInput.parse(v))
  .handler(async ({ data, context }) => {
    await context.supabase.from("conversations").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });

type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
};

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => QuizGenInput.parse(v))
  .handler(async ({ data, context }) => {
    const prompt = `Generate a ${data.difficulty} quiz on subject "${data.subject}"${data.topic ? ` (topic: ${data.topic})` : ""}.
Return strict JSON of shape:
{"questions":[{"question":"...","options":["A","B","C","D"],"answer_index":0,"explanation":"..."}]}
Rules:
- Exactly ${data.count} multiple-choice questions.
- 4 options each. answer_index is 0-3.
- Explanations should teach the concept, not just state the answer.
- Vary question style. Include at least one applied/scenario question.`;

    const parsed = await chatJSON<{ questions: QuizQuestion[] }>({
      messages: [
        { role: "system", content: "You are a rigorous quiz generator. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    });

    const { data: row, error } = await context.supabase
      .from("quizzes")
      .insert({
        user_id: context.userId,
        subject: data.subject,
        topic: data.topic ?? null,
        difficulty: data.difficulty,
        questions: parsed.questions,
        total: parsed.questions.length,
      })
      .select("id, questions, subject, topic, difficulty, total")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => SubmitQuizInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: quiz } = await context.supabase
      .from("quizzes")
      .select("id, subject, topic, questions")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    const questions = quiz.questions as QuizQuestion[];
    let score = 0;
    const wrong: Array<{ q: string; chose: string; correct: string; explanation: string }> = [];
    questions.forEach((q, i) => {
      if (data.answers[i] === q.answer_index) score++;
      else
        wrong.push({
          q: q.question,
          chose: q.options[data.answers[i]] ?? "(no answer)",
          correct: q.options[q.answer_index],
          explanation: q.explanation,
        });
    });

    // Ask AI for mistake analysis
    let analysis = "";
    if (wrong.length > 0) {
      analysis = await chatComplete({
        messages: [
          {
            role: "system",
            content: "You are a supportive tutor analyzing quiz mistakes. Be warm, specific, and actionable in under 180 words. Use short markdown bullet points.",
          },
          {
            role: "user",
            content: `Subject: ${quiz.subject}${quiz.topic ? `, Topic: ${quiz.topic}` : ""}
Score: ${score}/${questions.length}
Mistakes:
${wrong.map((w, i) => `${i + 1}. Q: ${w.q}\n   Chose: ${w.chose} | Correct: ${w.correct}\n   Why: ${w.explanation}`).join("\n")}

Give:
- **What you understand**
- **Where you're getting stuck** (be specific)
- **Suggested revision plan** (topics + estimated minutes)`,
          },
        ],
        temperature: 0.7,
      });
    } else {
      analysis = "**Perfect score!** You've mastered these questions. Try increasing the difficulty or exploring an adjacent topic to keep the challenge alive.";
    }

    await context.supabase
      .from("quizzes")
      .update({
        answers: data.answers,
        score,
        analysis,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    await context.supabase.from("xp_events").insert({
      user_id: context.userId,
      kind: "quiz",
      xp: score * 10,
      meta: { total: questions.length, score },
    });

    return { score, total: questions.length, wrong, analysis, questions };
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => PlannerInput.parse(v))
  .handler(async ({ data, context }) => {
    const parsed = await chatJSON<{
      overview: string;
      days: Array<{ date: string; focus: string; blocks: Array<{ time: string; subject: string; activity: string }> }>;
      tips: string[];
    }>({
      messages: [
        {
          role: "system",
          content: "You are an expert academic coach. Return strict JSON only. Be concrete, realistic, and encouraging.",
        },
        {
          role: "user",
          content: `Create a personalized study plan.
Exam: ${data.exam_name} on ${data.exam_date}
Subjects: ${data.subjects}
Daily hours: ${data.hours_per_day}
Weak topics: ${data.weak_topics || "not specified"}
Strong topics: ${data.strong_topics || "not specified"}

Return JSON:
{
  "overview": "1-2 sentence strategy",
  "days": [{"date":"YYYY-MM-DD","focus":"topic","blocks":[{"time":"9:00-10:30","subject":"...","activity":"..."}]}],
  "tips": ["...", "..."]
}
Prioritise weak topics. Include short breaks and one revision day near the exam.`,
        },
      ],
      temperature: 0.5,
    });

    const { data: row, error } = await context.supabase
      .from("study_plans")
      .insert({
        user_id: context.userId,
        exam_name: data.exam_name,
        exam_date: data.exam_date,
        plan: parsed,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listStudyPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const submitReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ReflectionInput.parse(v))
  .handler(async ({ data, context }) => {
    const feedback = await chatComplete({
      messages: [
        {
          role: "system",
          content: "You are a warm coach reading a student's one-sentence reflection about today's learning. In under 100 words: (1) affirm what they grasped, (2) surface ONE gap or nuance you noticed is missing, (3) suggest one concrete next step. Use markdown bullets. Speak WITH them, not AT them.",
        },
        { role: "user", content: data.content },
      ],
      temperature: 0.7,
    });
    const { data: row, error } = await context.supabase
      .from("reflections")
      .insert({ user_id: context.userId, content: data.content, ai_feedback: feedback })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("xp_events").insert({ user_id: context.userId, kind: "reflection", xp: 15 });
    return row;
  });

export const listReflections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("reflections")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

// ---------- Dashboard / progress ----------
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, xpRes, quizRes, convRes, reflRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("xp_events").select("xp, kind, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      supabase.from("quizzes").select("id, subject, score, total, difficulty, created_at, completed_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("conversations").select("id, title, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5),
      supabase.from("reflections").select("id, content, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    const xpEvents = xpRes.data ?? [];
    const totalXP = xpEvents.reduce((s, e) => s + (e.xp ?? 0), 0);
    const level = Math.max(1, Math.floor(Math.sqrt(totalXP / 25)) + 1);
    const nextLevelXP = 25 * level * level;

    // Streak: unique days with any xp event, counting back from today
    const days = new Set(xpEvents.map((e) => e.created_at.slice(0, 10)));
    let streak = 0;
    const d = new Date();
    for (;;) {
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
      else break;
    }

    // Confidence trend from quizzes: percent last 7
    const completedQuizzes = (quizRes.data ?? []).filter((q) => q.completed_at);
    const avgScore = completedQuizzes.length
      ? Math.round((completedQuizzes.reduce((s, q) => s + (q.score ?? 0) / (q.total || 1), 0) / completedQuizzes.length) * 100)
      : 0;

    // Weekly xp by day, last 7
    const now = new Date();
    const weekly: Array<{ day: string; xp: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(now);
      dd.setUTCDate(dd.getUTCDate() - i);
      const key = dd.toISOString().slice(0, 10);
      const xp = xpEvents.filter((e) => e.created_at.slice(0, 10) === key).reduce((s, e) => s + (e.xp ?? 0), 0);
      weekly.push({ day: dd.toLocaleDateString(undefined, { weekday: "short" }), xp });
    }

    return {
      profile: profileRes.data,
      totalXP,
      level,
      nextLevelXP,
      streak,
      avgScore,
      quizCount: completedQuizzes.length,
      recentQuizzes: quizRes.data ?? [],
      recentConversations: convRes.data ?? [],
      recentReflections: reflRes.data ?? [],
      weekly,
    };
  });