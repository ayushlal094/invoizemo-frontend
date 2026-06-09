# Invoizemo — Frontend

A modern invoicing SaaS frontend built with React, TypeScript, and Vite. Create professional invoices, manage clients, and track payments — all in one place.

🔗 **Live Demo:** https://invoizemo-frontend.vercel.app

---

## Tech Stack

- **React 18** + **TypeScript** — UI and type safety
- **Vite** — fast dev server and build tool
- **React Router v6** — client-side routing with protected routes
- **TanStack Query** — server state management, caching, and background refetch
- **Axios** — HTTP client with automatic JWT refresh interceptor
- **React Hook Form** + **Zod** — form handling and validation
- **Tailwind CSS** — utility-first styling
- **DOMPurify** — XSS prevention

---

## Features

- 🔐 Email/password login and Google OAuth sign-in
- 🔄 Silent session refresh via HttpOnly cookie
- 📄 Create, edit, and manage invoices with live total calculations
- 👥 Full client management with search and pagination
- 📊 Dashboard with revenue stats and recent invoice overview
- 🔑 Forgot password / reset password flow
- ⚙️ Profile settings, active session management, and GDPR data export
- 🗑️ Account deletion with confirmation text guard

---

## Project Structure

```
frontend/
├── src/
│   ├── auth/
│   │   ├── AuthProvider.tsx      # Session bootstrap + context
│   │   └── tokenStore.ts         # In-memory JWT (never localStorage)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios + single-flight refresh interceptor
│   │   │   └── refreshClient.ts  # Separate instance for /auth/refresh
│   │   ├── env.ts                # Zod-validated environment variables
│   │   └── utils.ts              # formatCents, formatDate, helpers
│   ├── components/
│   │   ├── AppShell.tsx          # Sidebar + layout
│   │   ├── RequireAuth.tsx       # Route guard
│   │   ├── ErrorBoundary.tsx     # Render error catcher
│   │   ├── StatusBadge.tsx       # Invoice status badge
│   │   └── ToastProvider.tsx     # Global toast notifications
│   ├── features/
│   │   ├── invoices/
│   │   │   ├── api.ts            # TanStack Query hooks
│   │   │   └── types.ts          # Invoice types + status transitions
│   │   └── clients/
│   │       ├── api.ts            # TanStack Query hooks
│   │       ├── types.ts          # Client types
│   │       └── components/
│   │           └── ClientFormModal.tsx
│   └── pages/
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       ├── ForgotPasswordPage.tsx
│       ├── ResetPasswordPage.tsx
│       ├── OAuthCallbackPage.tsx
│       ├── DashboardPage.tsx
│       ├── InvoicesPage.tsx
│       ├── InvoiceDetailPage.tsx
│       ├── InvoiceFormPage.tsx
│       ├── ClientsPage.tsx
│       ├── ClientDetailPage.tsx
│       ├── SettingsPage.tsx
│       └── NotFoundPage.tsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Backend running (see backend README)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/invoizemo.git
cd invoizemo/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Open `.env` and fill in:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Run in Development

```bash
npm run dev
```

App runs at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

---

## Security Practices

| Practice | Implementation |
|---|---|
| Access token storage | In-memory only — never localStorage |
| Refresh token | HttpOnly cookie — JS cannot read it |
| Token refresh | Single-flight queue — no duplicate calls |
| XSS prevention | DOMPurify + React text nodes |
| CSRF protection | SameSite=Strict cookie + JWT in header |
| Form validation | Zod schemas on every form |

---

## Deployment

Deployed on **Vercel**.

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Set Root Directory to `frontend`
4. Add environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`
5. Deploy

> **Important:** Add a `vercel.json` file for client-side routing:
> ```json
> { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
> ```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | Run TypeScript type check only |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
