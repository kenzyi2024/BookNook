# BookNook

**A cozy, full-stack reading companion — track your books, log your sessions, reflect in a journal, and lean on an AI reading buddy, all inside a warm, hand-crafted bookshelf.**

BookNook turns your reading life into a living, illustrated shelf. Add books, watch your progress fill in, decorate your shelves, and switch the whole app into a candlelit night mode with fairy lights that glow. Under the hood it pairs a React front end with a Node/Express + MongoDB back end and an OpenAI-compatible AI layer.

## Features

### Your bookshelf

- **Illustrated bookcase** — books render as characterful spines on wrapping wooden shelves. Every spine is tinted in a shade of your chosen theme color, so the shelf always looks cohesive. Hover a spine for its real cover, author, and progress.
- **Shelf decorations** — add hand-drawn plants and framed photos (custom brand artwork, no stock emojis) and drag them, or nudge them with the arrow keys, to arrange your shelves.
- **Fairy lights** — a string of lights is draped across every shelf. They sit soft and unlit by day and light up warm, in your theme color, the moment you switch on dark mode.
- **Filter, search, sort** — segmented status filters (All / Want to Read / Reading / Finished / DNF), live title/author search, sort by recently added, title, author, rating, or progress, and a "separate shelves" view that groups by status.
- **Up Next** — one tap generates spoiler-free, taste-matched suggestions from your own reading history.

### Each book

- **Progress & status** at a glance, with automatic completion percentages and a finished date.
- **Star ratings** and **click-to-edit genre**.
- **Notes & journal** — a leather-journal writing space with page-anchored quotes and reflections.
- **Reading timer** and **session logger** — log pages, percentage, or audiobook time, with minutes spent.
- **Share card** — generate a shareable image of a book and your progress.

### AI reading companion

Powered by an OpenAI-compatible endpoint (Groq by default), scoped to one book at a time:

- **Smart Recap** — a spoiler-safe, page-aware "where you left off" summary. It only regenerates when you've actually made progress, and it's cached so you're not billed twice for the same page.
- **Analysis Kit** — major themes, motifs and symbols to watch for, and a thought-provoking question to hold in mind while you read.
- **Socratic Seminar** — once you finish a book, a persistent chat thread that asks probing questions and digs into the ending, themes, and meaning.

### Discover

Search by **mood**, hit **Surprise me** for something unexpected, and add anything straight to your shelf.

### Metrics

An at-a-glance dashboard: current day streak, books and pages read per month, genre and rating breakdowns, most-read authors, and a reading-streak calendar.

### Personalization & access

- **Six color themes** (Terracotta, Forest, Plum, Ocean, Sage, Rose) that re-skin the entire app instantly.
- **Dark mode** as a toggle that renders a *dark version of your chosen theme color* — deep, hue-tinted surfaces rather than flat black.
- **Guest mode** — try everything with a local-only library saved to your device, then convert to a real account later without losing your data.
- **Sample library** — a one-toggle demo library (months of sessions, notes, quotes, ratings, and decorations) to explore every feature before adding your own books.
- **Accessibility** — honors reduced-motion, visible focus rings, and comfortable tap targets throughout.

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, lucide-react |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (Atlas) |
| AI | OpenAI-compatible API — **Groq** (`llama-3.3-70b-versatile`) by default; also works with OpenAI, OpenRouter, or a local Ollama |
| Auth | JWT + Google Sign-In (Google Identity Services) |
| Book data | Open Library (metadata + CORS-friendly covers) and Google Books (display covers) |
| Hosting | Vercel (frontend) · Google Cloud Run, `us-east4` (backend) |

## How it works

1. **Add** a book — metadata and a cover are pulled from Open Library / Google Books.
2. **Read & log** — update your page or log a session; percentages, streaks, and metrics update in sync.
3. **Reflect** — jot notes and quotes in the journal, rate the book, and mark it finished.
4. **Ask** — call on Smart Recap, the Analysis Kit, or the Socratic Seminar without ever leaving the page.

AI output (recaps, analysis, and seminar history) is cached on each book's document in MongoDB, so re-opening a tool is instant and API calls only fire when there's genuinely new work to do. Guest libraries live entirely in the browser and migrate into the account on sign-up.

## Local development

```bash
# Frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173

# Backend (in booktracker-backend/)
npm install
npm run dev        # Express API
```

Frontend env: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.
Backend env: `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `AI_API_KEY` (plus optional `AI_BASE_URL` / `AI_MODEL` to swap AI providers).

---

*Built by Kenzy Ibrahim, for the love of stories.*
