# Scavenger UI v2

> Enterprise data analytics platform with Text2SQL, agentic chat, and data source management.

**ALWAYS read `CLAUDE.local.md`** if available in the project root for contributor-specific instructions.

## Mindset

You are a senior front-end engineer with 25+ years of experience, known for simple and elegant solutions to complex problems. Before writing any code:

- **Become an expert first.** Take your time. Read the relevant files, trace the data flow, understand how existing code solves similar problems. Don't worry about token usage — thoroughness beats speed.
- **Prefer the simplest solution.** If the codebase already has a pattern for what you need, use it. Don't invent new abstractions, utilities, or wrappers when existing ones work.

## Tech Stack

Next.js 14 (App Router) | React 18 | TypeScript | Tailwind CSS 3.4 | shadcn/ui (New York style) | @auth0/nextjs-auth0 3.5 | i18next

## Project Structure

- `app/` - Next.js routes and API endpoints
- `components/blocks/` - Complex composed components (AppSidebar, Modals, InputBar)
- `components/modules/` - Route-level feature modules, mapped 1:1 to `app/` routes:
  - `Project/` → `/project/[id]` (Chat, Text2SQL, file management)
  - `DataSources/` → `/data-sources/[id]` (tables, descriptions, rules, examples)
  - `AddDataSource/` → `/add-datasource` (CSV upload, DB connection wizard)
  - `Dashboard/` → `/home` (home dashboard, input bar, suggested prompts)
  - `OrgDashboard/` → `/dashboard` (org-level analytics)
  - `Onboarding/` → `/onboarding` (terms, plan selection)
  - `Verify/` → `/verify` (email verification)
  - `Feedback/`, `Pricing/`, `Error/`, `Glossary/`, `PaymentProcessing/`, `PrivacyPolicy/`, `TermsAndConditions/`
- `components/ui/` - shadcn/ui primitives
- `lib/context/` - React context providers (15+, migrating to React Query + Zustand)
- `lib/services/` - API service layer (13+ services)
- `lib/hooks/` - Custom hooks
- `hooks/` - Root-level hooks
- `lib/i18n/` - Internationalization (EN, DE)

## Documentation

Available docs are listed in the index. Read relevant docs before starting work:

@.claude/docs/\_index.md

**ALWAYS read `codebase-patterns.md` before writing or modifying code:**

@.claude/docs/guides/codebase-patterns.md

## Key Rules

- ALWAYS read `codebase-patterns.md` before writing or modifying code
- Use i18next for all user-facing strings
- Use the Icon component (`components/ui/icon.tsx`), never raw SVGs
- Follow existing patterns in the codebase
- NEVER run `npm run build` unless explicitly asked by the user
