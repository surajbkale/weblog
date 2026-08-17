# Weblogs — Frontend

The user-facing web application for the Weblogs blogging platform, built with **Next.js 16** (App Router), **React 19**, and **Tailwind CSS v4**.

> **Related repo**: [Weblogs Backend API](../blog) — the Spring Boot API this app consumes.

---

## Features

| Area | Details |
|---|---|
| **Explore / Search** | Full-text search with URL-synced filters, category pills, tag navigation, sort by newest / oldest / most liked |
| **Post detail** | Markdown rendering, reading time, like button, threaded comment section |
| **Authentication** | Sign in / sign up, Google & GitHub OAuth2, email verification, forgot/reset password |
| **Profile dashboard** | Stories tab (publish, unpublish, delete), settings tab (avatar upload, bio, password change) |
| **Post editor** | Markdown editor with real-time preview, auto-resizing title, excerpt character count, `Ctrl+S` draft save |
| **Dark mode** | System-aware theme toggle via `next-themes` |
| **Performance** | ISR for author pages, Redis-backed API responses, Next.js standalone Docker image |

---

## Tech Stack

- **Framework**: Next.js 16.3 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4
- **Rich text**: TipTap editor + `marked` for Markdown rendering
- **HTTP client**: Axios with automatic JWT refresh interceptor
- **Icons**: Lucide React
- **Date formatting**: date-fns
- **Theme**: next-themes

---

## Project Structure

```
src/
├── app/
│   ├── (main)/            # Public pages (blog, post detail, author, profile)
│   ├── (auth)/            # Auth pages (login, register, verify-email, reset-password)
│   ├── dashboard/         # Legacy dashboard (redirects to /profile)
│   └── profile/           # User profile & post editor
├── components/
│   ├── blog/              # PostCard, LikeButton, CommentSection
│   ├── layout/            # Navbar, Footer
│   └── ui/                # Shared UI primitives
├── context/
│   └── AuthContext.tsx    # Global auth state + token refresh
├── lib/
│   ├── api/               # Axios API clients (posts, auth, users, …)
│   └── utils/             # cn(), markdown helpers
└── types/                 # Shared TypeScript types
```

---

## Running Locally

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Backend API | Running at `http://localhost:8080` (see [backend repo](../blog)) |

---

### Option A — Docker (recommended)

The easiest way is to run the **entire stack** (PostgreSQL, Redis, API, and this frontend) from the backend repo:

```bash
cd ../blog
cp .env.example .env   # fill in secrets
docker compose up --build
```

The frontend will be available at **http://localhost:3000**.

If you only want to run the frontend in Docker (with the API running separately):

**1. Build the image**

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -t weblogs-frontend .
```

**2. Run the container**

```bash
docker run -p 3000:3000 weblogs-frontend
```

---

### Option B — Manual (npm dev server)

**1. Install dependencies**

```bash
npm install
```

**2. Create the environment file**

```bash
cp .env.local.example .env.local   # if example exists, otherwise create manually
```

Or create `.env.local` by hand:

```env
# Backend API base URL — no trailing slash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**3. Start the development server**

```bash
npm run dev
```

The app is available at **http://localhost:3000**.

Turbopack is enabled by default for fast refresh. The dev server proxies all `/api/*` requests to the backend via the `NEXT_PUBLIC_API_URL` variable.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Turbopack development server |
| `npm run build` | Create optimised production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Base URL of the Spring Boot API (no trailing slash) |

> `NEXT_PUBLIC_*` variables are embedded at **build time**. If you change the API URL, you must rebuild.

---

## Development Notes

- **Auth**: The app uses a dual-cookie strategy — an `HttpOnly` `refresh_token` cookie for security and an optional `session_hint` cookie so the frontend can skip redundant API calls for guest users.
- **Markdown**: Post content is rendered server-side by `marked`. The editor live-previews the same output.
- **Images**: Remote images from Cloudinary, Unsplash, GitHub avatars, and Google avatars are allowed via `next.config.ts`. Add new domains there if needed.
- **OAuth callback**: The backend handles the OAuth2 redirect; the frontend receives the token via the `/oauth/callback` page.
