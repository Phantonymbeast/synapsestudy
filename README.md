# 🧠 Synapse Study AI

> **AI that helps students think, not just get answers.**

## 🚀 Live Demo

**https://synapsestudy.lovable.app/**

Synapse Study AI is an adaptive AI study companion designed around one central idea: **AI should help students think, not think for them.** Instead of functioning as a conventional chatbot that immediately provides answers, Synapse uses guided learning to help students develop their own reasoning and problem-solving skills.

## 🎯 The Problem

Generative AI can make studying passive: a student asks a question and receives the final answer immediately. That may solve the immediate problem without developing the student's ability to reason independently.

Synapse changes the interaction from:

**Student → Question → Answer**

to:

**Student → Guidance → Reasoning → Feedback → Understanding**

## ✨ Key Features

### 🧠 Socratic Tutor / Direct Method

Synapse can begin with guiding questions, hints and smaller steps instead of immediately revealing a solution. As the student demonstrates understanding, the system can progressively reduce the scaffolding and move toward a direct explanation or answer. This turns an AI interaction into a learning process rather than simple answer retrieval.

### 🎯 Confidence-Based Learning

Students can indicate how confident they feel about a topic. Synapse can use that signal to adapt its teaching: lower confidence can lead to simpler explanations, analogies and additional guidance, while higher confidence can lead to more challenging problems and deeper application.

### 📊 Adaptive Assessment

Assessments are designed to be diagnostic rather than only producing a score. Synapse can identify concepts the student understands, areas of difficulty and what should be revised next.

### 📝 Tests & Quizzes

Students can practise and demonstrate understanding through structured tests and quizzes, creating a continuous cycle of learning, practice, assessment and revision.

### 📈 Progress, XP & Mastery

Synapse tracks learning progress through mastery-oriented progress indicators, XP and streaks. Gamification is used to make improvement visible and encourage consistency while keeping learning as the primary goal.

### 🪞 Reflection

Reflection helps students think about what they learned rather than ending a session immediately after an answer. It adds a metacognitive layer to the learning experience.

### 📅 Personalised Study Plans

Study planning can take the student's available time, current progress and weaker areas into account so that revision is prioritised instead of producing a generic timetable.

## 🧪 Educational Reasoning

The educational design is based on active learning and scaffolding. Synapse attempts to keep the student involved in the reasoning process, gradually reducing support as competence increases. Confidence signals, assessment results, progress and reflection provide feedback loops that can guide what the student should work on next.

The intended learning loop is:

**Learn → Practise → Assess → Analyse → Revise → Reassess → Master**

## 🛠️ Technology

Synapse is a modern TypeScript/React web application using Vite, TanStack tooling, Supabase and AI SDK integrations. The project also contains Electron tooling for the desktop build.

## ▶️ Run Locally

### Requirements

- Node.js (LTS recommended)
- npm
- Supabase project/configuration for the application's backend features

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
```

Then open the local URL shown by Vite in your terminal.

### Production build

```bash
npm run build
```

### Environment variables

Do **not** commit `.env` files or private credentials. Copy `.env.example` to your local environment configuration and provide the appropriate values there.

## 🌐 Hosted Application

**https://synapsestudy.lovable.app/**

## 🔮 What I Would Build Next

With more time, I would improve long-term mastery modelling, add spaced repetition, strengthen misconception detection, introduce subject-specific tutoring strategies, expand analytics for students and teachers, improve the adaptive difficulty model, and conduct structured testing with students to measure retention and independent problem-solving against conventional AI tutoring.

## 📜 Project Note

Synapse was built to explore a different role for AI in education: not replacing the student's thinking, but helping the student develop it.
