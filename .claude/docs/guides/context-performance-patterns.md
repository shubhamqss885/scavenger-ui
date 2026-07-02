---
title: Context Performance Patterns Guide
created: 2026-04-06
updated: 2026-04-06
type: guide
description: Performance patterns for React contexts to prevent unnecessary re-renders. Primary pattern is useContextSelector; legacy split context pattern documented for reference.
---

# Context Performance Patterns Guide

## Primary Pattern: useContextSelector

**Use this pattern for all new contexts.** The `use-context-selector` library lets consumers subscribe to specific slices of context state.

### Setup

```bash
npm install use-context-selector
```

### Provider Implementation

```typescript
// Use createContext from use-context-selector, NOT React
import { createContext, useContextSelector } from "use-context-selector";

const ChatStateContext = createContext<IChatState | undefined>(undefined);

// Export context for consumers needing fine-grained selectors
export { ChatStateContext };

// Standard hook for full state (backward compat)
export const useChatState = (): IChatState => {
  const context = useContextSelector(ChatStateContext, (state) => state);
  if (context === undefined) {
    throw new Error("useChatState must be used within a ChatProvider");
  }
  return context;
};
```

### Consumer Usage

```typescript
import { useContextSelector } from "use-context-selector";
import { ChatStateContext } from "../providers/ChatProvider";

// Only re-renders when hasMessages changes, not on every message
const hasMessages = useContextSelector(
  ChatStateContext,
  (state) => (state?.messages?.length ?? 0) > 0,
);
```

### Why This Is Better

| Aspect      | useContextSelector   | Split Context            |
| ----------- | -------------------- | ------------------------ |
| Boilerplate | Low - single context | High - multiple contexts |
| Flexibility | Select any slice     | Fixed splits only        |
| Refactoring | Easy                 | Requires restructuring   |
| Bundle size | +2kb                 | None                     |

### Current Usage

- `components/modules/Project/Chat/providers/ChatProvider.tsx`
- `components/modules/Project/Chat/components/ChatInputBar.tsx`

---

## Legacy Pattern: Split Context

**For reference only.** Already applied to some contexts before useContextSelector was introduced.

### When You'll See It

- `lib/context/OrgFeatureContext/index.tsx`
- `lib/context/ProjectsContext/index.tsx`

### How It Works

Separates context into **Data** (changes) and **Actions** (stable):

```typescript
const DataContext = createContext<DataContextType | null>(null);
const ActionsContext = createContext<ActionsContextType | null>(null);

// Actions value is stable (empty deps)
const actionsValue = useMemo(
  () => ({
    isFeatureEnabled: isFeatureEnabledRef.current,
    FEATURE_FLAGS,
  }),
  [],
);

// Data value changes with state
const dataValue = useMemo(
  () => ({
    features,
    isLoading,
  }),
  [features, isLoading],
);
```

### Results from OrgFeatureContext

- Renders: 579 → 193
- Time: 869ms → 256ms

---

## Decision Guide

| Scenario                          | Pattern                          |
| --------------------------------- | -------------------------------- |
| New context                       | useContextSelector               |
| Existing context with perf issues | useContextSelector               |
| Already split context             | Keep as-is (not worth migrating) |
| Very simple context (1-2 values)  | Plain React context is fine      |
