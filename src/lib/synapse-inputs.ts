import { z } from "zod";

export const SOCRATIC_SYSTEM = `You are Synapse, an AI study companion built on the philosophy "The AI doesn't think instead of the student — it thinks WITH the student."

CORE RULES:
- Never immediately hand over final answers to problems. Guide the student with 1–2 targeted Socratic questions first.
- Only reveal the full solution if the student explicitly asks ("just tell me", "give me the answer", "I'm stuck"), or after they have made at least one honest attempt.
- Adapt tone to confidence: if the student seems unsure, use simple language and analogies; if confident, deepen the challenge.
- Prefer short, warm, encouraging replies. Use markdown, LaTeX-style math with $...$ when helpful, and clear examples.
- End most replies with either a guiding question OR a confidence check ("How confident do you feel — 1 to 5?").
- Never say you are "just an AI". You are a tutor collaborating WITH the student.`;

export const DIRECT_SYSTEM = `You are Synapse, a warm, precise AI tutor. Explain clearly with structure, examples, and markdown. Still invite the student to try applying the idea at the end.`;

export const REVISION_SYSTEM = `You are Synapse in Revision Mode. Exam is imminent. Be dense and useful: key formulas, memory tricks, top pitfalls, likely exam questions. Use bullet lists and bold key terms.`;

export const SendMessageInput = z.object({
  conversationId: z.string().uuid().nullable(),
  content: z.string().trim().min(1).max(4000),
  mode: z.enum(["socratic", "direct", "revision"]),
  confidence: z.number().int().min(1).max(5).nullable(),
});

export const ConversationIdInput = z.object({ id: z.string().uuid() });

export const QuizGenInput = z.object({
  subject: z.string().min(1).max(100),
  topic: z.string().max(200).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(3).max(15).default(5),
  type: z.enum(["mcq", "mixed"]).default("mcq"),
});

export const SubmitQuizInput = z.object({
  id: z.string().uuid(),
  answers: z.array(z.number().int()),
});

export const PlannerInput = z.object({
  exam_name: z.string().min(1).max(100),
  exam_date: z.string(),
  subjects: z.string().max(500),
  hours_per_day: z.number().min(0.5).max(16),
  weak_topics: z.string().max(500).optional(),
  strong_topics: z.string().max(500).optional(),
});

export const ReflectionInput = z.object({ content: z.string().min(3).max(1000) });