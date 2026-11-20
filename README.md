<div align="center">

# LabLuyen — AI-Powered EdTech Web

**An exam-prep platform for Vietnamese high-school Physics, Chemistry and Biology: topic-based question bank, timed mock exams, AI quiz generation from any document, an AI tutor, live multiplayer quiz battles, and gamified study progress.**

Next.js 16 • React 19 • TypeScript • Gemini • Firebase Auth • Upstash Redis

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-7-000000?style=flat-square&logo=vercel&logoColor=white)](https://ai-sdk.dev/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/docs/auth)
[![Upstash](https://img.shields.io/badge/Upstash-Redis-00E9A3?style=flat-square&logo=upstash&logoColor=black)](https://upstash.com/)
[![Status](https://img.shields.io/badge/Status-Beta-F59E0B?style=flat-square)](#9-scope-limitations--caveats)
[![License](https://img.shields.io/badge/License-MIT-16A34A?style=flat-square)](#12-license)

[✨ Features](#2-features) • [🏗️ Architecture](#3-system-architecture) • [🚀 Quick Start](#6-quick-start) • [🔐 Security](#8-security--reliability-design) • [⚠️ Limitations](#9-scope-limitations--caveats)

</div>

---

## 1. Overview

LabLuyen (*Lab* + *Luyện* — "practice") is a Vietnamese-language web app built for the THPT national exam. It serves three audiences with one product:

| Audience | What they get |
| :--- | :--- |
| **Students** | Topic-based practice with explanations, timed mock exams scored on a 10-point scale, an AI tutor for any question, streaks / XP / badges, and live battles with classmates. |
| **Teachers** | Quizzes generated in minutes from a PDF, Word or PowerPoint file, an article link, a YouTube video or pasted text; live in-class quiz rooms with a real-time leaderboard; class-level statistics showing which topics students get wrong; printable exam papers. |
| **Self-study groups & parents** | Attempt history, study streaks and shared battle rooms — free, with no login required to start. |

**Design goals**

1. **Low friction** — guests can practise, take mock exams and join live rooms immediately; sign-in only separates progress per account.
2. **Graceful degradation** — every external dependency (Gemini, Firebase, Redis, AI Gateway) is optional; features that lack configuration fail with a clear, localized message instead of breaking the app (see §6.3).
3. **Safe handling of untrusted input** — uploaded files, URLs and document text are treated as data, never as instructions (see §8).

> **Product language.** The user interface and AI prompts are in Vietnamese. This README is written in English for the wider developer audience.

---

## 2. Features

### 2.1 Learning

| Feature | Details |
| :--- | :--- |
| **Question bank** | Physics, Chemistry and Biology for grades 10–12, organized by grade → topic → difficulty. **353 questions across 28 topics** ship with the repository. |
| **Four question types** | Multiple choice (A–D), True/False with four statements a–d, Short answer, and **Drag & drop** matching (5 slots plus distractor chips). |
| **Three difficulty levels** | Easy (*Nhận biết*), Medium (*Thông hiểu*), Hard (*Vận dụng*). Practice sessions can filter by type and level. |
| **Timed mock exams** | Countdown timer, per-exam duration (45 / 50 / 90 min in the bundled exams), result page with 10-point score and per-topic breakdown. |
| **Exam-style grading** | True/False questions use the official partial-credit scheme: 1 / 2 / 3 / 4 correct statements → **0.10 / 0.25 / 0.50 / 1.00** of the question's marks. |
| **AI tutor** | A chat panel attached to each question. The prompt carries subject, grade, topic, question, options, the correct answer, the student's answer and the stored explanation, and asks for step-by-step Vietnamese explanations. |
| **Attempt history** | Every attempt is stored and can be reviewed at `#/history` and `#/result/<id>`. |

### 2.2 AI Quiz Generator

Turn teaching material into a ready-to-use quiz, summary and key-point list.

| Source | Supported input | Handling |
| :--- | :--- | :--- |
| **File** | `.pdf`, `.docx`, `.pptx` (≤ 4 MB) | PDF is passed to the model natively. DOCX/PPTX text is extracted server-side from the OOXML (PowerPoint speaker notes included). Legacy `.doc` / `.ppt` are rejected with guidance. |
| **Article link** | Public `http(s)` page | Fetched through an SSRF-hardened client, main content extracted from `<article>` / `<main>`. |
| **YouTube** | `youtube.com`, `youtu.be`, Shorts, embeds | URL is normalized and passed to the model as a video input. |
| **Pasted text** | Free text (200 – 60,000 chars) | Cleaned and passed as a delimited document block. |

**Options:** subject (Physics / Chemistry / Biology / General), grade 10–12, **3–20 questions**, difficulty (mixed ≈ 40 % easy / 40 % medium / 20 % hard, or a fixed level) and question types.

**Output:** title, a 4–6 sentence summary, 5–8 key points, and questions tagged with a consistent *topic* (3–8 topics per quiz) so results can be aggregated by chapter. Quizzes (up to 20 per account) are kept in the browser, can be practised like bank questions, and exported as an exam paper.

### 2.3 Live Quiz Battles

A Kahoot-style experience designed for classrooms.

- The host creates a room (title, 8–90 s per question, up to 40 multiple-choice questions) and receives a **6-digit join code**; students join from their phones — up to **200 players** per room.
- **Speed-based scoring:** `points = round(1000 × (1 − 0.5 × elapsed / timeLimit))` for a correct answer, plus a **streak bonus of +50 per consecutive correct answer (capped at 5)**.
- The question ends when time expires or when every player has answered; the reveal shows the correct answer, the explanation, the distribution of choices (A/B/C/D) and a leaderboard.
- Ties are broken by total answer time, then by join time. Rooms expire automatically after **6 hours**.

### 2.4 Statistics

- **Personal mode:** accuracy by topic and difficulty, plus "review these topics first" recommendations.
- **Class mode (teacher):** students export a `labluyen-results` JSON file; the teacher imports several files to see class-wide weak topics, hardest questions and students who need support. A built-in sample of 14 simulated students lets teachers explore the view before importing real data.

### 2.5 Gamification

| Mechanic | Rule |
| :--- | :--- |
| **XP** | +10 finishing a practice session · +40 finishing a mock exam · +5 per fully correct question · +20 / +40 for ≥ 80 % / 100 % accuracy · +15 to +45 for the first study of a streak day · +30 for joining a live match (plus rank bonuses). |
| **Level** | `level = ⌊√(XP / 60)⌋ + 1` (the XP threshold for level *n* is `60·(n−1)²`), with ten themed rank titles from *Tân binh phòng thí nghiệm* to *Huyền thoại khoa học*. |
| **Streaks** | One completed activity per calendar day keeps the streak; missing a day resets it. |
| **Badges** | 18 badges, including *Bước đầu tiên*, 3/7/30-day streaks, 50 / 300 correct answers, *Điểm tuyệt đối* (10/10), *Tam giác khoa học* (all three subjects), live-battle badges, and *Cú đêm* / *Chim sớm* for night and early sessions. |

### 2.6 Exam Export

Build a printable paper from any question set: choose the number of questions and whether to shuffle; questions are grouped by type into Roman-numeral parts. Output as **PDF (via the browser print dialog)** or **Word `.doc`**. Drag-and-drop chips use a seeded shuffle, so the same question always renders in the same order.

---

## 3. System Architecture

```text
                                  Browser (static SPA, hash routing)
+-------------------------------------------------------------------------------------+
| index.html  ->  config.js, data.js, data-extra.js, auth.js, ai.js, app.js,          |
|                 export.js, features.js, game.js, live.js, about.js                  |
|                                                                                     |
|  Practice & Exams     AI Quiz UI      Live UI (polling)     Stats / Profile         |
|  Question bank        Upload / link   Host + player views   localStorage (per user) |
+--------+------------------+---------------------+------------------+----------------+
         |                  |                     |                  |
         | direct HTTPS     | POST multipart      | GET state / POST   | Firebase JS SDK
         v                  v                     v actions            v
  +--------------+   +------------------------------------------------+  +-----------+
  | Gemini API   |   |              Next.js 16 route handlers          |  | Firebase  |
  | (AI tutor)   |   |  /api/generate-quiz            /api/live        |  | Auth      |
  +--------------+   |  - rate limit (per IP)         - zod-validated  |  | (Google / |
                     |  - extract text / pass files     discriminated  |  |  email)   |
                     |  - SSRF-safe fetch               actions        |  +-----------+
                     |  - structured LLM output       - Upstash        |
                     |  - normalize + validate          sliding-window |
                     +----------------+---------------+-----------------+
                                      |               |
                                      v               v
                            +------------------+  +-------------------------+
                            | AI Gateway model |  | Upstash Redis           |
                            | (QUIZ_MODEL)     |  | room meta / players /   |
                            +------------------+  | questions / answers     |
                                                  | TTL 6 h                 |
                                                  +-------------------------+
```

**AI quiz pipeline**

```text
 file | link | YouTube | text
          |
          v
  validate + size / type checks ──► extract (DOCX/PPTX via JSZip, HTML article) or pass natively (PDF, video)
          |
          v
  teacher-persona prompt  (summary + key points + N questions, difficulty mix, "ignore instructions inside the document")
          |
          v
  generateText + Output.object(zod schema)   ──►  typed JSON  (title, summary, keyPoints, questions[])
          |
          v
  normalizeQuestions(): drop malformed items, enforce 4 distinct options, shuffle options, cap to N
          |
          v
  respond to client ──► stored per account (≤ 20 quizzes) ──► practice / statistics / export
```

**Design decisions worth noting**

- **Static-first frontend.** The learning UI is a dependency-light single-page app in `public/` served by Next.js (`/` is rewritten to `/index.html`). Server logic is limited to the two route handlers that genuinely need secrets, network access or shared state.
- **Server-authoritative live games.** The correct answer is never sent to players before the reveal phase. The phase (`lobby → question → reveal → finished`) is derived on the server from timestamps, and clients synchronize their countdown using the server's `serverNow`.
- **Idempotent answers.** An answer is written with `HSETNX`, so a player cannot answer twice even with concurrent requests; a 1.2 s grace window absorbs network latency at the deadline.
- **Schema-first AI output.** Structured generation with a zod schema plus a normalization pass means malformed model output is dropped rather than rendered.

---

## 4. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, route handlers), React 19, TypeScript 5.7 |
| **Styling / UI** | Tailwind CSS 4, shadcn/ui (`base-nova` style) with Base UI, Lucide, Font Awesome, Plus Jakarta Sans |
| **AI** | Vercel AI SDK (`ai`) with structured output; Google Gemini (quiz generation and tutor) |
| **Auth** | Firebase Authentication — Google sign-in and email/password |
| **Realtime state** | Upstash Redis (`@upstash/redis`) with `@upstash/ratelimit` |
| **Validation** | Zod 4 |
| **Document parsing** | JSZip (DOCX / PPTX), custom HTML article extractor |
| **Analytics** | Vercel Analytics (production only) |
| **Package manager** | pnpm |

---

## 5. Repository Structure

```text
.
├── app/
│   ├── api/
│   │   ├── generate-quiz/route.ts   # AI quiz generation (multipart upload / link / YouTube / text)
│   │   └── live/route.ts            # Live battle API (create, join, start, next, end, answer, state)
│   ├── globals.css                  # Tailwind + design tokens
│   ├── layout.tsx                   # Root layout, metadata, analytics
│   └── page.tsx                     # Redirects to the static SPA
├── components/ui/button.tsx         # shadcn/ui primitives
├── lib/
│   ├── live/engine.ts               # Room state machine, scoring, Redis storage, rate limiting
│   ├── quiz/
│   │   ├── schema.ts                # Zod schemas + question normalization
│   │   ├── extract.ts               # DOCX / PPTX / HTML extraction, YouTube URL parsing
│   │   ├── safe-fetch.ts            # SSRF-hardened page fetcher
│   │   └── errors.ts                # HttpError
│   └── utils.ts
├── public/                          # Static single-page app
│   ├── index.html                   # App shell and navigation
│   ├── config.js                    # Client-side keys (Gemini, Firebase) — template
│   ├── data.js / data-extra.js      # Question bank, mock exams, drag-and-drop questions
│   ├── app.js                       # Router, practice, exams, grading, history
│   ├── ai.js                        # AI tutor client
│   ├── auth.js                      # Firebase Auth wrapper
│   ├── features.js                  # AI quiz UI + statistics (personal / class)
│   ├── game.js                      # XP, levels, streaks, badges
│   ├── live.js                      # Live battle UI (host + player)
│   ├── export.js                    # Printable exam builder (PDF / Word)
│   ├── about.js                     # Product introduction page
│   └── style.css
├── next.config.mjs                  # `/` -> `/index.html` rewrite
├── package.json
└── pnpm-lock.yaml
```

**Client routes** (hash-based): `#/` · `#/bank` · `#/practice/<subject>/<grade>/<topic>` · `#/exams` · `#/take` · `#/result/<id>` · `#/history` · `#/ai-quiz` · `#/stats` · `#/profile` · `#/live` · `#/about`

---

## 6. Quick Start

### 6.1 Prerequisites

- **Node.js** 20 or newer
- **pnpm** (`npm i -g pnpm`)

### 6.2 Install and run

```bash
git clone https://github.com/lenghiemgiaphu/AI-Powered_EdTech_Web.git
cd AI-Powered_EdTech_Web
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The practice, mock-exam, statistics and gamification features work **without any configuration**.

```bash
pnpm build && pnpm start   # production build
```

### 6.3 Configuration

Each integration is optional and independent:

| Feature | Requires | Behaviour when missing |
| :--- | :--- | :--- |
| **AI tutor** | `GEMINI_API_KEY` in `public/config.js` | Tutor panel shows a message explaining how to enable it. |
| **Sign-in** | `firebase` block in `public/config.js` (+ Google and Email/Password providers enabled, your domain in *Authorized domains*) | App runs in guest mode. |
| **AI quiz generator** | AI Gateway access for the model in `QUIZ_MODEL` (default `google/gemini-3.8-flash`) | API returns a clear "AI service not enabled" error. |
| **Live battles** | Upstash Redis REST credentials | API returns a clear "Redis not connected" error. |

**Server environment variables** (`.env.local`):

```bash
# AI quiz generator (optional override of the default model)
QUIZ_MODEL=google/gemini-3.8-flash

# Live battles — either naming scheme is accepted
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# or
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Client configuration** (`public/config.js`):

```js
const config = {
  GEMINI_API_KEY: "YOUR_KEY_HERE",
  GEMINI_MODEL: "gemini-2.5-flash",
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_FIREBASE_APP_ID",
  },
};
```

> ⚠️ **Never commit real keys.** Everything in `public/` is downloaded by every visitor. Keep the committed `config.js` as a placeholder template, and see §9 for how to move the Gemini call behind your own server before going to production.

### 6.4 Deployment

The project is a standard Next.js app and deploys to **Vercel** with no extra build configuration. Add the environment variables above in the project settings, connect an Upstash Redis integration for live battles, and add your production domain to Firebase *Authorized domains*.

---

## 7. API Reference

### `POST /api/generate-quiz`

`multipart/form-data`

| Field | Type | Notes |
| :--- | :--- | :--- |
| `mode` | `file` \| `link` \| `youtube` \| `text` | Source type. |
| `file` / `url` / `text` | — | Payload for the chosen mode. |
| `subject` | `Physics` \| `Chemistry` \| `Biology` \| `General` | |
| `grade` | `10`–`12` | |
| `count` | `3`–`20` | |
| `difficulty` | `mixed` \| `easy` \| `medium` \| `hard` | |
| `types` | `multiple_choice` \| `true_false` \| `short_answer` (repeatable) | At least one. |

**Response `200`:** `{ title, summary, keyPoints[], sourceLabel, questions[] }`
**Errors:** `400` invalid input · `413` file too large · `422` unreadable / too-short content or too few valid questions · `429` rate limit · `502` page could not be fetched · `503` AI service unavailable.

### `/api/live`

| Method | Action | Auth | Rate limit |
| :--- | :--- | :--- | :--- |
| `POST` | `create` — title, subject, `timeSec`, `questions[]` → `{ code, hostToken }` | — | 8 / min / IP |
| `POST` | `join` — `code`, `name`, optional `pid` (rejoin) → `{ pid, name }` | — | 80 / min / IP |
| `POST` | `start` · `next` · `end` | `hostToken` | — |
| `POST` | `answer` — `code`, `pid`, `choice` (`A`–`D`) | `pid` | 20 / 10 s / player |
| `GET` | `?code=&pid=&host=` — full room state for the caller's role | — | — |

---

## 8. Security & Reliability Design

| Concern | Mitigation |
| :--- | :--- |
| **SSRF through "article link"** | Only `http(s)` on ports 80/443; DNS is resolved and **every** address is rejected if private, loopback, link-local, CGNAT, multicast or IPv6-unique-local (including IPv4-mapped IPv6); redirects are followed manually (max 4) and re-validated at each hop; 10 s timeout; 2.5 MB response cap; content-type allow-list. |
| **Prompt injection via documents** | Document text is wrapped in a delimited block and the prompt instructs the model to ignore any instructions found inside it; output is constrained by a zod schema rather than free text. |
| **Malformed or hallucinated AI output** | Questions with missing fields, duplicate options or out-of-range answer indices are discarded; fewer than 3 valid questions returns a `422` instead of a broken quiz. |
| **Upload abuse** | 4 MB limit, strict extension allow-list, 60,000-character text cap, safe ZIP-based parsing wrapped in error handling. |
| **Abuse / cost control** | Per-IP limit on quiz generation (10 requests / 10 min); Redis sliding-window limits on every live action. |
| **Live-room integrity** | Host actions require a UUID host token; answers are write-once per player per question; correct answers are withheld until reveal; display names are stripped of control characters and angle brackets and truncated to 20 characters; every request body is validated with zod; rooms auto-expire. |
| **XSS** | Dynamic UI strings are HTML-escaped before insertion. |
| **Privacy** | Study progress, quizzes and class data live in the user's browser (`localStorage`), namespaced per account. Live rooms are stored server-side only until they expire. |

---

## 9. Scope, Limitations & Caveats

1. **Gemini key is client-side.** The AI tutor calls the Gemini API directly from the browser, so the key in `public/config.js` is visible to every visitor. This is acceptable for local demos only; for production, proxy the call through a route handler (like `/api/generate-quiz`) and restrict the key.
2. **Progress is local.** XP, streaks, badges, history and saved quizzes are stored in `localStorage`: they do not sync across devices, can be cleared by the browser, and can be edited by the user. Do not use them for high-stakes assessment.
3. **Quiz generation limits are best-effort.** The 10-requests-per-10-minutes limiter on `/api/generate-quiz` is held in memory, so it is per server instance and resets on cold starts. Use the Redis-backed limiter (already used by live battles) if you need strict enforcement.
4. **AI output is unverified.** Generated questions and tutor explanations can be wrong. Teachers should review a quiz before using it for assessment (the About page says so too).
5. **Small bundled content.** The shipped bank (57 questions, 4 mock exams) is a demonstration set, not a complete curriculum; the exams labelled "official structure" are sample papers, not real past papers.
6. **Live battles use polling.** Clients poll the room state rather than holding a WebSocket / SSE connection. It is simple and serverless-friendly but adds latency and request volume as rooms grow. Live questions are multiple choice only.
7. **No automated tests / CI yet**, and `next.config.mjs` sets `typescript.ignoreBuildErrors = true`, so type errors do not fail a build.
8. **Branding leftovers.** `package.json` is still named `my-project`, and `app/layout.tsx` metadata still reads "v0 App"; update both before publishing.

**Roadmap (proposed)**

| Priority | Item |
| :--- | :--- |
| High | Move the AI tutor behind a server route; add Redis-backed rate limiting to quiz generation; fix package name / metadata; remove `ignoreBuildErrors`. |
| High | Add unit tests for grading, level math, quiz normalization and SSRF guards; add GitHub Actions CI. |
| Medium | Optional cloud sync of progress (Firestore or Redis) for signed-in users; teacher accounts with persistent class rosters. |
| Medium | Expand the question bank and add real past-paper imports; support `.doc` / `.ppt` via conversion. |
| Low | WebSocket / SSE for live battles; English UI localization; PWA / offline practice. |

---

## 10. Contributing

Issues and pull requests are welcome.

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Make your changes and run `pnpm build` to confirm the project compiles.
3. Commit with a clear message and open a pull request describing the change.

When adding questions, follow the helper constructors in `public/data.js` (`mc`, `tf`, `sa`) and `public/data-extra.js` (`dd`), and keep each question's `topic` name consistent so statistics aggregate correctly.

---

## 11. Credits

- UI components: [shadcn/ui](https://ui.shadcn.com/) · icons: [Lucide](https://lucide.dev/), [Font Awesome](https://fontawesome.com/) · typeface: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- AI: [Vercel AI SDK](https://ai-sdk.dev/) and [Google Gemini](https://ai.google.dev/)
- Infrastructure: [Vercel](https://vercel.com/), [Upstash](https://upstash.com/), [Firebase](https://firebase.google.com/)

---

## 12. License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

<div align="center">

**Built to make exam revision consistent, measurable and a little more fun.**

If this project helps you, please consider giving it a ⭐

</div>
