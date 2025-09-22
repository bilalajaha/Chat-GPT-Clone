# ChatGPT Clone (Next.js + Laravel)

A modern, responsive ChatGPT-like application with a Next.js 14 frontend and a Laravel backend. The frontend provides a polished chat experience with streaming responses; the backend offers REST endpoints and persistence (SQLite by default). The app currently integrates with Google Gemini models by default, with an OpenAI-compatible API surface.

## Features

- 🤖 AI conversations with streaming responses
- 🧭 Clean, modern UI with a single scrollable chat pane
- 🌙 Dark/Light theme
- 💾 Local persistence (frontend) and Laravel API for server-side data
- ⌨️ Keyboard shortcuts, typing indicator, retry actions
- 🔒 Token-based API proxying (extensible)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Laravel 11 (PHP), SQLite (dev), Sanctum-ready
- **AI Models**: Gemini 1.5 (default). OpenAI-compatible request types are supported.

## Monorepo Layout

```text
.
├─ chat-gpt-backend/        # Laravel backend
│  ├─ app/                  # Controllers, Models, Middleware
│  ├─ database/             # Migrations, seeders, sqlite
│  └─ routes/               # api.php, web.php
└─ src/                     # Next.js app
   ├─ app/                  # Next.js App Router API routes and pages
   ├─ components/           # UI components
   ├─ context/              # React Context (chat state)
   ├─ hooks/                # Custom hooks
   ├─ lib/                  # API clients, proxy helpers
   └─ types/ | utils/       # Types and utilities
```

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- PHP 8.2+
- Composer
- (Optional) A Gemini API key: set `GEMINI_API_KEY`

## Setup

### 1) Backend (Laravel)

```bash
cd chat-gpt-backend
composer install
cp .env.example .env
php artisan key:generate

# Using the included SQLite database
touch database/database.sqlite

# Run migrations
php artisan migrate

# Start the Laravel server (defaults to http://127.0.0.1:8000)
php artisan serve
```

Key files:
- `routes/api.php` — REST endpoints
- `database/migrations` — schema for users, chats, messages, preferences

### 2) Frontend (Next.js)

```bash
cd ..
npm install

# Optional: copy config
cp config.example.js config.js

# Development server (defaults to http://localhost:3000)
npm run dev
```

Environment variables (set in your shell or `.env.local`):

```bash
# AI model key (Gemini by default)
GEMINI_API_KEY=your_gemini_key

# If you proxy to Laravel from Next.js API routes
LARAVEL_BASE_URL=http://127.0.0.1:8000
```

## Running the App

1. Start Laravel: `php artisan serve` (in `chat-gpt-backend`)
2. Start Next.js: `npm run dev` (in project root)
3. Open the UI: `http://localhost:3000`

The frontend uses Next.js App Router API endpoints under `src/app/api/*`. Some routes proxy to Laravel using helpers in `src/lib/proxy.ts`.

## Notable Frontend Endpoints

- `src/app/api/chat/route.ts` — Streams AI responses using `createStreamingChatCompletion` (Gemini by default). The client consumes Server-Sent-like chunks and updates the assistant message progressively.
- `src/app/api/chats/*` — Examples of proxying CRUD to Laravel (headers forwarded via `src/lib/proxy.ts`).

## Frontend Development

Scripts:
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint
- `npm run test` — Frontend tests (if configured)

Key components:
- `src/components/ModernChatInterface.tsx` — Header, scrollable messages pane, input
- `src/components/MessageBubble.tsx` — Message rendering (supports bold via `**text**`)
- `src/hooks/useChatState.ts` — Chat state management (Context reducer)
- `src/lib/gemini.ts`, `src/lib/openai.ts` — Model client helpers

## Backend Development

Common commands:
- `php artisan migrate` — Apply migrations
- `php artisan tinker` — REPL
- `php artisan serve` — Dev server

API entrypoints:
- `app/Http/Controllers/*`
- `routes/api.php`

## Configuration Notes

- Streaming is enabled by default on the frontend. The messages area is the only scrollable region.
- Bold markdown (`**text**`) is rendered in assistant responses.
- To switch models or providers, adjust `src/lib/*` and the API route logic; set corresponding keys.

## License

MIT — see `LICENSE`.

## Acknowledgments

- Next.js team for a great framework
- Laravel team for a robust backend platform
- Tailwind CSS and Lucide Icons
