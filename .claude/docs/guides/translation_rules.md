---
title: Translation Rules and Guidelines
created: 2026-04-06
updated: 2026-04-06
type: guide
description: Detailed i18n implementation guidelines using i18next ecosystem including namespace mapping, German language rules (informal Du/Dir), and translation workflow.
---

# Translation Rules and Guidelines

This document provides detailed guidelines for implementing internationalization (i18n) in the Scavenger UI application.

## Technology Stack

- **Library**: `i18next` ecosystem (not next-intl)
- **Dependencies**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-resources-to-backend`, `react-cookie`
- **Approach**: Client-side translation without URL locale prefixes (same URLs for all languages)
- **Supported Languages**: English (primary), German (secondary)

## Architecture Decision: Why i18next over next-intl

**Reasoning**: Scavenger UI is a B2B SaaS platform where:

- URL stability is critical (enterprise users bookmark dashboards)
- SEO benefits from localized URLs are irrelevant (authenticated app)
- User language preference should be stored in profile, not URL
- Incremental rollout is preferred over breaking changes

## Language Detection Priority

1. **User Profile** (`userProfile.locale`) - Stored in Auth0 user data
2. **Cookie fallback** (`i18next` cookie) - For non-authenticated users
3. **Browser default** - System language detection

## File Structure

```
lib/i18n/
├── client.ts          # Custom useTranslation hook with Auth0 integration
├── settings.ts        # Language configuration and namespace list
└── locales/
    ├── en/            # English translations
    │   ├── common.json
    │   ├── home.json
    │   ├── project.json
    │   ├── database.json
    │   ├── dashboard.json
    │   ├── settings.json
    │   └── auth.json
    └── de/            # German translations
        ├── common.json
        ├── home.json
        ├── project.json
        ├── database.json
        ├── dashboard.json
        ├── settings.json
        └── auth.json
```

## Namespace Organization Strategy

**Decision**: Route-based organization with shared components assigned to primary routes

### Namespace Mapping:

- **`common.json`** - Universal elements used across ALL routes
  - Buttons: save, cancel, close, delete, edit, back, next, submit
  - Status: loading, error, success, failed, pending, completed
  - Actions: copy, paste, cut, share, export, import

- **`home.json`** - Home route + AppSidebar + Navigation
  - Page content: greeting, question, placeholder, newProject
  - Sidebar navigation: home, projects, databases, dashboard
  - Profile dropdown: settings, feedback, logout, language
  - Language names: en → "English", de → "German"

- **`project.json`** - Project route + Chat + File management
  - Project management: create, edit, delete, name, description
  - Chat interface: placeholder, send, typing, online, offline
  - File operations: upload, processing, success, failed
  - Project status: active, inactive, archived

- **`database.json`** - Database management route
  - Database operations: connect, tables, columns, schema, records
  - Connection status: connected, disconnected, testing, failed, timeout
  - Actions: test, refresh, sync, configure

- **`dashboard.json`** - Organization dashboard route
  - Page content: title, welcome, overview, analytics, insights
  - Statistics: total, active, pending, completed, thisWeek, thisMonth
  - Actions: create, viewAll, refresh, filter, sort
  - Charts: usage, performance, trends

- **`settings.json`** - Settings modal (cross-route component)
  - Modal sections: account, preferences, security, billing, notifications
  - Account fields: profile, email, password, name, company
  - Language settings: title, description, current, apply
  - Security: changePassword, twoFactor, sessions

- **`auth.json`** - Authentication flows
  - Email verification: title, message, resend, sent, success
  - Onboarding: welcome, getStarted, complete, step, continue
  - Login/signup: title, email, password, signIn, signUp

## Implementation Patterns

### Basic Usage in Components:

```typescript
import { useTranslation } from "@/lib/i18n/client";

const MyComponent = () => {
  const { t } = useTranslation("namespace");

  return (
    <div>
      <h1>{t("page.title")}</h1>
      <button>{t("buttons.save")}</button>
    </div>
  );
};
```

### Language Switching (in ProfileButton):

```typescript
const handleLanguageChange = async (languageCode: string): Promise<void> => {
  try {
    // Change language in i18n
    await i18n.changeLanguage(languageCode);

    // Update user profile with new language preference
    if (userProfile) {
      await updateUserProfile({ locale: languageCode });
    }
  } catch (error) {
    console.error("Failed to change language:", error);
  }
};
```

### Nested Object Access:

```typescript
// For nested translations like sidebar.profile.settings
{
  t("sidebar.profile.settings");
}
{
  t("sidebar.languages.en");
}
{
  t("page.greeting");
}
```

## Adding New Translations

### Step-by-Step Process:

1. **Identify the component's primary route** to determine namespace
2. **Add translation keys** to appropriate JSON files (EN + DE)
3. **Import useTranslation** in component:
   ```typescript
   import { useTranslation } from "@/lib/i18n/client";
   const { t } = useTranslation("namespace");
   ```
4. **Replace hardcoded strings** with `t("key")` calls
5. **Test language switching** in ProfileButton dropdown

### Namespace Decision Rules:

- **Route-specific content** → Use route namespace (`project.json` for `/project/*`)
- **Shared components** → Assign to primary usage route
- **Universal elements** → Use `common.json`
- **Cross-route modals** → Dedicated namespace (`settings.json`)
- **Use nested objects** for clarity: `sidebar.profile.settings`

## German Language Guidelines

**IMPORTANT: Always use informal German (Du/Dir/Dein/Deine) instead of formal German (Sie/Ihr/Ihren/Ihnen)**

Scavenger AI is a modern B2B SaaS platform targeting a younger, tech-savvy audience. Informal German creates a more approachable, friendly user experience consistent with modern software applications.

### ✅ Correct (Informal):

```json
{
  "message": "Bitte überprüfe deine E-Mail und klick auf den Verifizierungslink",
  "placeholder": "Frag mich etwas...",
  "question": "Womit kann ich dir heute helfen?",
  "description": "Verwalte deine Kontoeinstellungen und Präferenzen.",
  "instruction": "Wähle eine Datenbank aus, um sie abzufragen."
}
```

### ❌ Incorrect (Formal):

```json
{
  "message": "Bitte überprüfen Sie Ihre E-Mail und klicken Sie auf den Verifizierungslink",
  "placeholder": "Fragen Sie mich etwas...",
  "question": "Womit kann ich Ihnen heute helfen?",
  "description": "Verwalten Sie Ihre Kontoeinstellungen und Präferenzen.",
  "instruction": "Wählen Sie eine Datenbank aus, um sie abzufragen."
}
```

### Key Conversion Patterns:

- **Sie** → **du** / **Du** (you)
- **Ihr/Ihre/Ihren/Ihrem** → **dein/deine/deinen/deinem** (your)
- **Ihnen** → **dir** (to you)
- **Imperative verbs**: "Klicken Sie" → "Klick" / "Geben Sie" → "Gib" / "Wählen Sie" → "Wähle"
- **Modal verbs**: "Möchten Sie" → "Möchtest du" / "Können Sie" → "Kannst du"

## Technical Integration Points

- **App.tsx**: Wrapped with `<CookiesProvider>` for cookie management
- **UserData type**: Extended with `locale?: string` property
- **Language persistence**: Automatic sync between cookies and user profile
- **Dynamic loading**: Translation files loaded on-demand
- **Error handling**: Graceful fallbacks to English for missing translations

## Development Workflow

1. **Check current translations**: Review existing JSON files
2. **Identify target component**: Determine appropriate namespace
3. **Add translation keys**: Update both EN and DE files
4. **Update component**: Import useTranslation and replace strings
5. **Test functionality**: Verify language switching works
6. **Commit changes**: Document what was translated

## Translation Priorities (Recommended Order)

1. **Chat Interface** (`project.json`) - Core user interaction
2. **Database Management** (`database.json`) - Key feature area
3. **Settings Modal** (`settings.json`) - User preferences
4. **Organization Dashboard** (`dashboard.json`) - Analytics interface
5. **Authentication flows** (`auth.json`) - Login/verification pages

## Components Already Translated

1. **Dashboard Module** (`/components/modules/Dashboard/`)
   - Main dashboard page: greeting, question
   - HomeInputBar: placeholder, newProject generation
   - Namespace: `home.json`

2. **ProfileButton** (`/components/blocks/AppSidebar/components/ProfileButton.tsx`)
   - Settings, feedback, logout labels
   - Language selector with EN/DE options
   - Namespace: `home.json`
