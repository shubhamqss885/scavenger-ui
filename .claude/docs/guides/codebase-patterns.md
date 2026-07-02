---
title: Codebase Patterns & Conventions
created: 2026-04-06
updated: 2026-04-06
type: guide
description: Comprehensive guide to established patterns in the codebase including UI components, styling, hooks, services, and state management conventions.
---

# Codebase Patterns & Conventions

Quick reference for consistent development. Follow these patterns for all new code.

---

## 1. UI Components

### Icon System

**File:** `components/ui/icon.tsx`

```typescript
import { Icon } from "@/components/ui/icon";

<Icon name="ChevronDown" size="md" variant="primary" />
```

### Props

| Prop          | Type                                            | Default     | Description           |
| ------------- | ----------------------------------------------- | ----------- | --------------------- |
| `name`        | `IconName`                                      | Required    | Icon name from Lucide |
| `size`        | `"xxs" \| "xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"`      | Icon size             |
| `variant`     | `IconVariant`                                   | `"default"` | Color variant         |
| `className`   | `string`                                        | -           | Additional classes    |
| `strokeWidth` | `number`                                        | `2`         | Stroke thickness      |
| `fill`        | `string`                                        | `"none"`    | Fill color            |

### Size Reference

| Size  | Dimensions              |
| ----- | ----------------------- |
| `xxs` | `h-3 w-3 min-w-3`       |
| `xs`  | `h-3.5 w-3.5 min-w-3.5` |
| `sm`  | `h-4 w-4 min-w-4`       |
| `md`  | `h-5 w-5 min-w-5`       |
| `lg`  | `h-6 w-6 min-w-6`       |
| `xl`  | `h-8 w-8 min-w-8`       |

### Variant Colors

| Variant       | Color                   |
| ------------- | ----------------------- |
| `default`     | `text-muted-foreground` |
| `foreground`  | `text-foreground`       |
| `primary`     | `text-primary`          |
| `muted`       | `text-slate-400`        |
| `destructive` | `text-destructive`      |
| `success`     | `text-green-700`        |
| `warning`     | `text-yellow-700`       |
| `white`       | `text-white`            |

Adding new icons: Add to `iconMap` in `/components/ui/icon.tsx`.

### Typography System

**File:** `components/ui/typography.tsx`

```typescript
import { H2, P, Small, Muted } from "@/components/ui/typography";

<H2>Section Title</H2>
<P>Body text paragraph.</P>
<Small className="text-green-600">Custom styled</Small>
<Muted>Secondary text</Muted>
```

| Component    | Default Style                              | Use Case           |
| ------------ | ------------------------------------------ | ------------------ |
| `H1`         | `text-4xl font-extrabold` (lg: `text-5xl`) | Page titles        |
| `H2`         | `text-2xl font-semibold` + bottom border   | Section headers    |
| `H3`         | `text-xl font-semibold`                    | Subsection headers |
| `H4`         | `text-base font-semibold`                  | Minor headers      |
| `Lead`       | `text-xl text-muted-foreground`            | Introduction text  |
| `P`          | `text-xs leading-7`                        | Body paragraphs    |
| `Large`      | `text-base font-semibold`                  | Emphasized text    |
| `Small`      | `text-xs font-medium`                      | Small labels       |
| `Muted`      | `text-sm text-muted-foreground`            | Secondary text     |
| `Detail`     | `text-xs font-medium text-slate-400`       | Fine details       |
| `Subtle`     | `text-xs text-slate-500`                   | Very subtle text   |
| `Chat`       | `text-xs text-slate-700`                   | Chat messages      |
| `InlineCode` | Styled with background                     | Code snippets      |
| `List`       | Bulleted lists                             | Lists              |
| `Quote`      | Border-left blockquote                     | Quotes             |

### Skeleton Loading

**File:** `components/ui/skeleton.tsx`

```typescript
import { Skeleton } from "@/components/ui/skeleton";

// Match your content layout
<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

---

## 2. Styling Patterns

### CSS Variables

**File:** `app/globals.css`

All colors use HSL CSS variables. Access via Tailwind:

```css
/* In globals.css */
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
```

```tsx
// In components
<div className="bg-primary text-primary-foreground" />
```

### Custom Tailwind Utilities

**File:** `tailwind.config.ts`

| Utility                            | Purpose                 |
| ---------------------------------- | ----------------------- |
| `animate-shimmer-slow/medium/fast` | Loading shimmer effects |
| `rounded-[3px]`, `rounded-[8px]`   | Custom border radius    |
| `sidebar-breakpoint`               | 1100px breakpoint       |

### Class Merging

**File:** `lib/utils/index.ts`

Always use `cn()` for conditional classes:

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

---

## 3. Hook Patterns

### usePolling

**File:** `lib/hooks/usePolling.ts`

For polling APIs with exponential backoff:

```typescript
const { data, isPolling, start, stop } = usePolling({
  fn: () => fetchStatus(id),
  interval: 2000,
  intervalType: "exponential",
  maxAttempts: 10,
  stopCondition: (data) => data.status === "completed",
  onSuccess: (data) => handleComplete(data),
});
```

### useShortcut

**File:** `hooks/useShortcut.ts`

Global keyboard shortcuts:

```typescript
useShortcut("NEW_PROJECT", () => createProject());
```

### useNavGuard

**File:** `hooks/useNavGuard.ts`

Prevent navigation with unsaved changes:

```typescript
useNavGuard(isDirty, "You have unsaved changes.");
```

---

## 4. Service/API Patterns

### Service Structure

**Location:** `lib/services/*/`

```typescript
// urls.ts
export const ProjectUrls = {
  GET_ALL: "/projects",
  GET_ONE: (id: string) => `/projects/${id}`,
  CREATE: "/projects",
};

// index.ts
import { getAxiosInstance } from "../axiosInstances";

export const getProjects = async () => {
  const response = await getAxiosInstance().get(ProjectUrls.GET_ALL);
  return response.data;
};
```

### Data Fetching Flow

Services are **pure data fetchers** — no error handling, no state management. Types live alongside the service.

```typescript
// lib/services/projectService/types.ts
type Project = Readonly<{
  id: string;
  name: string;
  status: "active" | "archived";
}>;

// lib/services/projectService/index.ts
const getProjects = async (): Promise<Project[]> => {
  const response = await getAxiosInstance().get(ProjectUrls.GET_ALL);
  return response.data;
};
```

Errors are caught **where services are called** — typically in context providers, because that's where client and server state sync:

```typescript
// lib/context/ProjectsContext/index.tsx
const fetchProjects = async () => {
  try {
    setIsLoading(true);
    const data = await getProjects();
    setProjects(data);
  } catch (error) {
    toast.error(t("error.fetchFailed"));
  } finally {
    setIsLoading(false);
  }
};
```

**Never** catch errors inside service functions. **Always** catch at the call site (provider/component).

---

## 5. Context Patterns

### Primary: useContextSelector

See `guides/context-performance-patterns.md` for details.

```typescript
import { createContext, useContextSelector } from "use-context-selector";

// Consumer - only re-renders when selected value changes
const count = useContextSelector(MyContext, (state) => state.count);
```

### Provider Order

Providers wrap in this order (outer to inner):

1. UserProvider (Auth0)
2. AxiosProvider
3. UserDataProvider
4. OrgFeatureProvider
5. UIStateProvider
6. OrganizationDbProvider
7. DashboardStatsProvider
8. ProjectsProvider
9. ProjectFilesProvider
10. OrgDashboardsProvider

---

## 6. Form Patterns

### React Hook Form + Zod

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, t("validation.required")),
  email: z.string().email(t("validation.email")),
});

type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "" },
  mode: "onChange",
});

return (
  <Form {...form}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("form.name")}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </Form>
);
```

---

## 7. Toast Notifications

**Library:** Sonner

```typescript
import { toast } from "sonner";

toast.success(t("messages.saved"));
toast.error(t("messages.error"));
```

---

## 8. Modal/Dialog Patterns

### Standard Dialog

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{t("dialog.title")}</DialogTitle>
      <DialogDescription>{t("dialog.description")}</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        {t("common.cancel")}
      </Button>
      <Button onClick={handleSubmit}>
        {t("common.confirm")}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Controlled Form Dialog

Prevent hooks running when closed:

```typescript
// Wrapper checks open state
function AddProjectForm({ open, onClose }) {
  if (!open) return null;
  return <AddProjectFormContent onClose={onClose} />;
}

// Inner component only mounts when open
function AddProjectFormContent({ onClose }) {
  const form = useForm(...); // Only runs when dialog is open
  // ...
}
```

---

## 9. i18n Patterns

### Usage

```typescript
import { useTranslation } from "@/lib/i18n/client";

const { t } = useTranslation("namespace");

<button>{t("buttons.save")}</button>
```

### Namespaces

| Namespace      | Use Case                             |
| -------------- | ------------------------------------ |
| `common`       | Universal elements (buttons, status) |
| `home`         | Home route + AppSidebar              |
| `project`      | Project route + Chat                 |
| `project-chat` | Chat-specific strings                |
| `database`     | Database management                  |
| `dashboard`    | Organization dashboard               |
| `settings`     | Settings modal                       |
| `auth`         | Authentication flows                 |

### German Language Rule

**Always use informal German (Du/Dir/Dein)**, not formal (Sie/Ihnen).

---

## 10. Feature Flags

```typescript
const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();

if (isFeatureEnabled(FEATURE_FLAGS.FILE_UPLOAD)) {
  return <UploadButton />;
}
```

---

## 11. Component Organization

### Directory Structure

```
/components
├── ui/          # Base shadcn/ui components
├── blocks/      # Complex UI blocks (AppSidebar, Modals)
└── modules/     # Feature modules (Dashboard, Project)
```

### Types, Not Interfaces

Always use `type`, never `interface`. Wrap with `Readonly<>`:

```typescript
// Component props
type Props = Readonly<{
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}>;

// Data types
type UserData = Readonly<{
  id: string;
  name: string;
  role: "org-user" | "org-admin" | "super-admin";
}>;

// Mutable when needed (e.g. form state)
type FormValues = {
  name: string;
  email: string;
};
```

### Arrow Functions Only

Always use arrow functions — for components, handlers, helpers, everything. Never use `function` declarations:

```typescript
// Components
const ConversationMessage = ({ message, userName }: Props) => {
  return <div>...</div>;
};

// Handlers and helpers
const handleSubmit = () => { ... };
const formatDate = (date: string) => { ... };
```

### Client Components

All interactive components need the directive:

```typescript
"use client";

import { useState } from "react";
// ...
```

---

## 12. Loading States

### Full Page Loading

```typescript
if (isLoading) {
  return <LoadingView />;
}
```

### Inline Loading

```typescript
<Button disabled={isSubmitting}>
  {isSubmitting ? <Loader2 className="animate-spin" /> : t("buttons.save")}
</Button>
```

### Skeleton Layout

Match your content structure with skeletons:

```typescript
const TableSkeleton = () => {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
};
```

---

## 13. Code Health

- **File length**: Keep files under ~200 lines. Extract components, hooks, or utils when a file grows beyond this. Exceptions are fine for complex pages, but aim to split.
- **Cognitive complexity**: Keep functions below 15. If you have deeply nested conditionals or long switch chains, extract helpers or use early returns.
- **One component per file**: Don't pile multiple exported components into one file. Small internal helpers are fine.

```

```
