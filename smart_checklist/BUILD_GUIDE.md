# Smart Checklist — Build Guide

A step-by-step guide to building this app from scratch. Follow these instructions like a Lego manual — each step builds on the last.

---

## What You're Building

A web-based checklist app with:
- Create, view, and delete checklists
- Add, check off, and remove items
- AI-powered checklist generation (using a local LLM via Ollama)
- SQLite database for persistence
- Docker containerization

**Tech stack:** SvelteKit, TypeScript, Tailwind CSS, Drizzle ORM, SQLite, Ollama, Docker

---

## Prerequisites

Install these before starting:
- **Node.js** (v20+): https://nodejs.org
- **Docker Desktop**: https://docker.com/products/docker-desktop
- **Ollama** (for local dev without Docker): https://ollama.com

---

## Step 1: Scaffold the SvelteKit Project

```bash
npx sv create smart_checklist --template minimal --types ts --no-add-ons
cd smart_checklist
npm install
```

**What this does:**
- `sv create` is the official Svelte scaffolding tool
- `--template minimal` gives you the bare minimum (no demo code)
- `--types ts` sets up TypeScript
- After this, you have a working but empty SvelteKit app

**Try it:** Run `npm run dev` and open http://localhost:5173. You'll see a blank page.

**Key files created:**
| File | Purpose |
|------|---------|
| `svelte.config.js` | SvelteKit configuration (adapter, compiler options) |
| `vite.config.ts` | Vite bundler config (plugins, dev server settings) |
| `src/app.html` | The HTML shell — SvelteKit injects your app into `%sveltekit.body%` |
| `src/routes/+page.svelte` | Your home page component |
| `src/routes/+layout.svelte` | Layout that wraps all pages (nav, footer, etc.) |

---

## Step 2: Install Dependencies

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3 @sveltejs/adapter-node tailwindcss @tailwindcss/vite
```

**What each package does:**

| Package | Purpose |
|---------|---------|
| `drizzle-orm` | TypeScript ORM — lets you query the database with type-safe code instead of raw SQL |
| `better-sqlite3` | SQLite driver for Node.js — the actual database engine |
| `drizzle-kit` | CLI tool for generating database migrations |
| `@types/better-sqlite3` | TypeScript type definitions for the SQLite driver |
| `@sveltejs/adapter-node` | Tells SvelteKit to build for Node.js (needed for Docker) |
| `tailwindcss` | Utility-first CSS framework (e.g. `class="text-lg font-bold"`) |
| `@tailwindcss/vite` | Vite plugin that processes Tailwind classes |

---

## Step 3: Configure the Adapter

Edit `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node';

const config = {
  compilerOptions: {
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
  },
  kit: {
    adapter: adapter()
  }
};

export default config;
```

**Why:** SvelteKit needs an "adapter" to know how to build your app for deployment. `adapter-auto` tries to auto-detect your platform, but we want a plain Node.js server (for Docker), so we use `adapter-node`.

**What is "runes"?** Svelte 5 introduced "runes" — a new way to declare reactive state using `$state()`, `$props()`, etc. This line forces runes mode for your code (but not for libraries in node_modules).

---

## Step 4: Set Up Tailwind CSS

Edit `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

Create `src/app.css`:

```css
@import 'tailwindcss';

@theme {
  --color-surface-50: #fafafa;
  --color-surface-100: #f5f5f5;
  --color-surface-200: #e5e5e5;
  --color-surface-300: #d4d4d4;
  --color-surface-400: #a3a3a3;
  --color-surface-500: #737373;
  --color-surface-600: #525252;
  --color-surface-700: #404040;
  --color-surface-800: #262626;
  --color-surface-900: #171717;
  --color-surface-950: #0a0a0a;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

**What this does:**
- `@import 'tailwindcss'` brings in all of Tailwind's utility classes
- `@theme` defines custom color variables you can use as `text-surface-400`, `bg-surface-900`, etc.
- These grays give us the black/white/neutral palette

**How Tailwind works:** Instead of writing CSS files, you apply classes directly in HTML:
```html
<!-- Traditional CSS: write a .title class in a .css file -->
<!-- Tailwind: compose styles inline -->
<h1 class="text-3xl font-bold text-surface-900 mb-8">Title</h1>
```
The number after a class often maps to a scale: `text-sm` (small), `text-lg` (large), `text-3xl` (3x extra-large). Spacing uses multiples of 0.25rem: `p-4` = 1rem padding, `mb-8` = 2rem margin-bottom.

---

## Step 5: Define the Database Schema

Create `src/lib/schema.ts`:

```ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const checklists = sqliteTable('checklists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistId: integer('checklist_id')
    .notNull()
    .references(() => checklists.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  checked: integer('checked', { mode: 'boolean' }).default(false)
});

export const checklistsRelations = relations(checklists, ({ many }) => ({
  items: many(items)
}));

export const itemsRelations = relations(items, ({ one }) => ({
  checklist: one(checklists, {
    fields: [items.checklistId],
    references: [checklists.id]
  })
}));
```

**What this does:**
- Defines two tables: `checklists` and `items`
- Each item belongs to a checklist via `checklistId`
- `onDelete: 'cascade'` means deleting a checklist automatically deletes its items
- `relations()` tells Drizzle how tables connect (for joins/queries)
- `mode: 'boolean'` makes the integer column act like true/false in TypeScript

**This is the equivalent SQL:**
```sql
CREATE TABLE checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  checked INTEGER DEFAULT 0
);
```

---

## Step 6: Set Up the Database Connection

Create `src/lib/server/db.ts`:

```ts
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '$lib/schema';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

let _db: BetterSQLite3Database<typeof schema>;

export function getDb() {
  if (!_db) {
    const dbPath = process.env.DATABASE_PATH || resolve('data/smart_checklist.db');
    mkdirSync(resolve(dbPath, '..'), { recursive: true });
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  }
});
```

**What this does:**
- Creates a **lazy** database connection (only opens when first used, not at import time)
- `process.env.DATABASE_PATH` lets Docker set a custom path; defaults to `data/smart_checklist.db`
- `journal_mode = WAL` makes SQLite faster for concurrent reads
- `foreign_keys = ON` enforces the cascade delete we defined in the schema

**Why lazy?** SvelteKit's build process imports server files to analyze them. If the DB opened immediately on import, the build would crash because the `data/` directory doesn't exist at build time. The Proxy makes `db` look like a real object but only connects when you actually call a method on it.

**What is `$lib`?** It's a SvelteKit alias for `src/lib/`. So `$lib/schema` = `src/lib/schema.ts`. Anything in `src/lib/server/` is only available on the server (never sent to the browser).

---

## Step 7: Auto-Run Migrations on Startup

Create `src/lib/server/migrate.ts`:

```ts
import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { mkdirSync, readFileSync, readdirSync } from 'fs';

export function runMigrations() {
  const dbPath = process.env.DATABASE_PATH || resolve('data/smart_checklist.db');
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const migrationsDir = resolve('drizzle');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  sqlite.exec(`CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY)`);

  for (const file of files) {
    const applied = sqlite.prepare('SELECT 1 FROM __migrations WHERE name = ?').get(file);
    if (!applied) {
      const sql = readFileSync(resolve(migrationsDir, file), 'utf-8');
      sqlite.exec(sql);
      sqlite.prepare('INSERT INTO __migrations (name) VALUES (?)').run(file);
    }
  }

  sqlite.close();
}
```

Create `src/hooks.server.ts`:

```ts
import { runMigrations } from '$lib/server/migrate';

runMigrations();
```

**What this does:**
- When the server starts, it reads all `.sql` files from the `drizzle/` folder
- Tracks which migrations have already run in a `__migrations` table
- Only runs new migrations — safe to call repeatedly

**What are hooks?** `hooks.server.ts` is SvelteKit's way of running code when the server starts. Think of it like Django's `AppConfig.ready()` or Express middleware that runs once.

---

## Step 8: Generate the Migration

Create the `drizzle.config.ts` in the project root:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || 'data/smart_checklist.db'
  }
});
```

Then generate the migration:

```bash
mkdir -p data
npx drizzle-kit generate
```

**What this does:** Drizzle reads your schema and generates a `.sql` file in `drizzle/` with the CREATE TABLE statements. This is like Django's `makemigrations`.

---

## Step 9: Build the Layout

Edit `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
  import '../app.css';
  import brain from '$lib/assets/brain.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={brain} />
</svelte:head>

<div class="min-h-screen bg-white text-surface-900">
  <header class="border-b border-surface-200 py-5">
    <div class="max-w-2xl mx-auto px-6 flex items-center gap-3">
      <img src={brain} alt="" class="w-6 h-6" />
      <a href="/" class="text-lg font-medium text-surface-900 no-underline tracking-tight">Smart Checklist</a>
    </div>
  </header>
  <main class="max-w-2xl mx-auto px-6 py-10">
    {@render children()}
  </main>
</div>
```

**Key concepts:**
- `+layout.svelte` wraps every page. The `{@render children()}` is where the current page gets inserted.
- `let { children } = $props()` — this is Svelte 5 runes syntax. `$props()` declares component inputs. The layout receives `children` (the page content) from SvelteKit automatically.
- `<svelte:head>` lets you add things to the HTML `<head>` from any component.

**How SvelteKit routing works:**
```
src/routes/+page.svelte          → http://localhost:5173/
src/routes/checklist/[id]/+page.svelte → http://localhost:5173/checklist/42
```
Files named `+page.svelte` are pages. Folders are URL segments. `[id]` is a dynamic parameter.

---

## Step 10: Build the Home Page (Server)

Create `src/routes/+page.server.ts`:

```ts
import { db } from '$lib/server/db';
import { checklists } from '$lib/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const allChecklists = await db.select().from(checklists);
  return { checklists: allChecklists };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    if (!name) return fail(400, { error: 'Name is required' });

    const result = await db.insert(checklists).values({ name }).returning();
    redirect(303, `/checklist/${result[0].id}`);
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    if (!id) return fail(400, { error: 'Invalid id' });

    const { eq } = await import('drizzle-orm');
    await db.delete(checklists).where(eq(checklists.id, id));
    return { success: true };
  }
};
```

**Key concepts:**

- **`+page.server.ts`** runs only on the server. It has two jobs:
  1. `load` — fetches data before the page renders (like Django views returning context)
  2. `actions` — handles form submissions (like Django form handling)

- **`load` function:** Runs before the page renders. Whatever you `return` is available in the page component as `data`.

- **`actions` object:** Each key is a named action. Forms target them with `action="?/create"` or `action="?/delete"`. This replaces traditional API endpoints for form handling.

- **`fail(400, {...})`** returns an error without redirecting.
- **`redirect(303, url)`** sends the user to a new page after the action completes.

- **Drizzle query syntax:**
  ```ts
  db.select().from(checklists)           // SELECT * FROM checklists
  db.insert(checklists).values({ name }) // INSERT INTO checklists (name) VALUES (?)
  db.delete(checklists).where(eq(checklists.id, id)) // DELETE WHERE id = ?
  ```

---

## Step 11: Build the Home Page (UI)

Edit `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  let { data } = $props();
  let newName = $state('');
  let generating = $state(false);
  let prompt = $state('');
  let aiError = $state('');
</script>

<div class="space-y-12">
  <section>
    <h1 class="text-3xl font-bold tracking-tight text-surface-900 mb-8">Your Checklists</h1>

    {#if data.checklists.length === 0}
      <p class="text-surface-400">No checklists yet. Create one below.</p>
    {:else}
      <ul class="space-y-1">
        {#each data.checklists as checklist}
          <li class="flex items-center justify-between py-3 border-b border-surface-200 group">
            <a href="/checklist/{checklist.id}" class="text-surface-900 hover:text-surface-500 no-underline">
              {checklist.name}
            </a>
            <form method="POST" action="?/delete">
              <input type="hidden" name="id" value={checklist.id} />
              <button type="submit" class="text-surface-400 hover:text-surface-900 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
            </form>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2 class="text-sm font-medium text-surface-400 uppercase tracking-wide mb-4">New Checklist</h2>
    <form method="POST" action="?/create" class="flex gap-3">
      <input
        type="text"
        name="name"
        bind:value={newName}
        placeholder="Checklist name..."
        class="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-surface-900 transition-colors"
      />
      <button
        type="submit"
        disabled={!newName.trim()}
        class="px-5 py-2.5 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
      >
        Create
      </button>
    </form>
  </section>

  <section>
    <h2 class="text-sm font-medium text-surface-400 uppercase tracking-wide mb-2">Generate with AI</h2>
    <p class="text-surface-500 text-sm mb-4">Describe what you need and AI will generate a checklist for you.</p>
    <form
      onsubmit={async (e) => {
        e.preventDefault();
        if (!prompt.trim() || generating) return;
        generating = true;
        aiError = '';
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt.trim() })
          });
          const result = await res.json();
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          } else if (result.error) {
            aiError = result.error;
          }
        } catch {
          aiError = 'Failed to connect to AI service.';
        } finally {
          generating = false;
        }
      }}
      class="flex gap-3"
    >
      <input
        type="text"
        bind:value={prompt}
        placeholder="e.g. Plan a camping trip..."
        class="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-surface-900 transition-colors"
      />
      <button
        type="submit"
        disabled={!prompt.trim() || generating}
        class="px-5 py-2.5 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
      >
        {generating ? 'Generating...' : 'Generate'}
      </button>
    </form>
    {#if aiError}
      <p class="text-red-500 text-sm mt-3">{aiError}</p>
    {/if}
  </section>
</div>
```

**Key Svelte concepts:**

- **`let { data } = $props()`** — receives the data returned by `load` in `+page.server.ts`
- **`$state('')`** — declares reactive state. When it changes, the UI updates automatically. This is like Vue's `ref()`.
- **`bind:value={newName}`** — two-way binding. The input's value stays in sync with the variable.
- **`{#if ...} {:else} {/if}`** — conditional rendering
- **`{#each array as item} {/each}`** — loop rendering
- **`{checklist.name}`** — output a variable's value in the template

**Two kinds of forms here:**

1. **Standard form** (`method="POST" action="?/create"`) — submits to the server action, page reloads with fresh data. No JavaScript needed. This is SvelteKit's "progressive enhancement."

2. **JavaScript form** (`onsubmit={async (e) => {...}}`) — prevents default submission, calls a fetch API instead. Used for the AI generation because we want to show loading state and handle the redirect client-side.

---

## Step 12: Build the Checklist Detail Page (Server)

Create `src/routes/checklist/[id]/+page.server.ts`:

```ts
import { db } from '$lib/server/db';
import { checklists, items } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);
  const checklist = await db.select().from(checklists).where(eq(checklists.id, id)).get();
  if (!checklist) error(404, 'Checklist not found');

  const checklistItems = await db.select().from(items).where(eq(items.checklistId, id));
  return { checklist, items: checklistItems };
};

export const actions: Actions = {
  addItem: async ({ request, params }) => {
    const data = await request.formData();
    const text = data.get('text')?.toString().trim();
    if (!text) return fail(400, { error: 'Text is required' });

    await db.insert(items).values({ checklistId: Number(params.id), text });
    return { success: true };
  },

  toggleItem: async ({ request }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    const checked = data.get('checked') === 'true';

    await db.update(items).set({ checked: !checked }).where(eq(items.id, id));
    return { success: true };
  },

  removeItem: async ({ request }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));

    await db.delete(items).where(eq(items.id, id));
    return { success: true };
  },

  rename: async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    if (!name) return fail(400, { error: 'Name is required' });

    await db.update(checklists).set({ name }).where(eq(checklists.id, Number(params.id)));
    return { success: true };
  }
};
```

**What's new here:**
- **`params.id`** — the `[id]` from the URL. If you visit `/checklist/5`, `params.id` is `"5"`.
- **`error(404, ...)`** — throws a 404 page if the checklist doesn't exist.
- **`.get()`** — returns a single row (vs an array). Like Django's `.get()` on a queryset.

---

## Step 13: Build the Checklist Detail Page (UI)

Create `src/routes/checklist/[id]/+page.svelte`:

```svelte
<script lang="ts">
  let { data } = $props();
  let newItemText = $state('');
</script>

<div class="space-y-8">
  <div class="flex items-center gap-4">
    <a href="/" class="text-surface-400 hover:text-surface-900 transition-colors">&larr;</a>
    <h1 class="text-2xl font-bold tracking-tight text-surface-900">{data.checklist.name}</h1>
  </div>

  <form method="POST" action="?/addItem" class="flex gap-3">
    <input
      type="text"
      name="text"
      bind:value={newItemText}
      placeholder="Add an item..."
      class="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-surface-900 transition-colors"
    />
    <button
      type="submit"
      disabled={!newItemText.trim()}
      class="px-5 py-2.5 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
    >
      Add
    </button>
  </form>

  {#if data.items.length === 0}
    <p class="text-surface-400">No items yet.</p>
  {:else}
    <ul class="space-y-0.5">
      {#each data.items as item}
        <li class="flex items-center gap-4 py-3 border-b border-surface-200 group">
          <form method="POST" action="?/toggleItem">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="checked" value={String(item.checked)} />
            <button type="submit" class="w-5 h-5 rounded border {item.checked ? 'bg-surface-900 border-surface-900' : 'border-surface-300 hover:border-surface-900'} flex items-center justify-center transition-colors">
              {#if item.checked}
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          </form>
          <span class="flex-1 {item.checked ? 'line-through text-surface-400' : 'text-surface-900'}">{item.text}</span>
          <form method="POST" action="?/removeItem">
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" class="text-surface-300 hover:text-surface-900 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
          </form>
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

**How the checkbox works:**
- Each checkbox is a form with hidden inputs (id and current state)
- Clicking it submits the form → server toggles `checked` → page reloads with fresh data
- No JavaScript needed! This is "progressive enhancement" — forms work without JS

**Tailwind patterns used:**
- `group` + `group-hover:opacity-100` — show the Remove button only when hovering the list item
- `transition-colors` / `transition-opacity` — smooth animation on hover
- `{item.checked ? 'class-a' : 'class-b'}` — conditional classes in Svelte

---

## Step 14: Build the AI Endpoint

Create `src/routes/api/generate/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { checklists, items } from '$lib/schema';
import type { RequestHandler } from './$types';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export const POST: RequestHandler = async ({ request }) => {
  const { prompt } = await request.json();
  if (!prompt?.trim()) {
    return json({ error: 'Prompt is required' }, { status: 400 });
  }

  let response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'user',
            content: `Generate a checklist for: "${prompt}". Return JSON with keys "name" (string title) and "items" (array of 5-15 practical, actionable strings).`
          }
        ]
      })
    });
  } catch {
    return json({ error: 'AI service unavailable. Is Ollama running?' }, { status: 503 });
  }

  if (!response.ok) {
    return json({ error: 'AI service unavailable. Is Ollama running?' }, { status: 503 });
  }

  const result = await response.json();
  const content = result.message?.content || '';

  let generated;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    generated = JSON.parse(jsonMatch[0]);
  } catch {
    return json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  const [checklist] = await db.insert(checklists).values({ name: generated.name }).returning();

  if (generated.items?.length) {
    await db.insert(items).values(
      generated.items.map((text: string) => ({
        checklistId: checklist.id,
        text
      }))
    );
  }

  return json({ redirectTo: `/checklist/${checklist.id}` });
};
```

**Key concepts:**

- **`+server.ts`** (vs `+page.server.ts`) — this is a pure API endpoint with no page. It handles raw HTTP requests and returns JSON.
- **`export const POST`** — handles POST requests to `/api/generate`. You could also export `GET`, `PUT`, `DELETE`.
- **Ollama API:** You send a chat message, it returns the AI's response. `format: 'json'` forces the model to output valid JSON.
- **The flow:**
  1. Receive prompt from the browser
  2. Send it to Ollama (local AI)
  3. Parse the JSON response
  4. Save the checklist + items to the database
  5. Return the URL to redirect to

---

## Step 15: Add Scripts to package.json

Add these to the `"scripts"` section:

```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

**What they do:**
- `npm run db:generate` — creates a new migration file when you change the schema
- `npm run db:push` — applies schema directly to the DB (skips migration files, good for dev)
- `npm run db:studio` — opens a web UI to browse your database

---

## Step 16: Docker Setup

Create `Dockerfile`:

```dockerfile
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN mkdir -p data && npm run build

FROM node:20-slim

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/smart_checklist.db

CMD ["node", "build"]
```

**What this does (multi-stage build):**

1. **Stage 1 (builder):** Installs dependencies and builds the app. Needs Python/make/g++ because `better-sqlite3` compiles native C code.
2. **Stage 2 (final):** Copies only the built output + node_modules into a clean slim image. The build tools are NOT in the final image (smaller size).

**Why multi-stage?** The builder stage is ~800MB (with compilers). The final image is ~640MB (just Node + your app).

Create `.dockerignore`:

```
node_modules
data
.svelte-kit
build
.env
```

**Why:** Without this, Docker sends your 200MB+ node_modules into the build context (slow and pointless since `npm ci` reinstalls everything inside the container).

---

## Step 17: Docker Compose

Create `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - ORIGIN=http://localhost:3000
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=llama3.2
      - DATABASE_PATH=/app/data/smart_checklist.db
    volumes:
      - db-data:/app/data
    depends_on:
      ollama-setup:
        condition: service_completed_successfully

  ollama:
    image: ollama/ollama
    volumes:
      - ollama-models:/root/.ollama

  ollama-setup:
    image: ollama/ollama
    depends_on:
      - ollama
    environment:
      - OLLAMA_HOST=http://ollama:11434
    volumes:
      - ollama-models:/root/.ollama
    entrypoint: ["sh", "-c", "sleep 5 && ollama pull llama3.2"]

volumes:
  db-data:
  ollama-models:
```

**How the three services work together:**

1. **`ollama`** — starts the Ollama AI server
2. **`ollama-setup`** — waits for Ollama to start, then downloads the llama3.2 model. Exits when done. Only downloads the first time (model is cached in the `ollama-models` volume).
3. **`app`** — your SvelteKit app. Waits for ollama-setup to complete before starting.

**Key Docker concepts:**
- **`ports: '3000:3000'`** — maps container port 3000 to your machine's port 3000
- **`volumes: db-data:/app/data`** — persists the SQLite file between container restarts
- **`depends_on: condition: service_completed_successfully`** — waits for the setup to finish
- **`ORIGIN`** — tells SvelteKit's CSRF protection what URL to accept forms from
- **`OLLAMA_URL=http://ollama:11434`** — Docker networking lets containers talk by service name

**For GPU users**, create `docker-compose.gpu.yml`:

```yaml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

Run with: `docker compose -f docker-compose.yml -f docker-compose.gpu.yml up`

---

## Step 18: Environment & Git Setup

Create `.env.example`:

```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
DATABASE_PATH=data/smart_checklist.db
```

Add to `.gitignore`:

```
# Database
/data/*.db
/data/*.db-*
```

Create `data/.gitkeep` (empty file — ensures the data directory exists in git but the database files are ignored).

---

## Running the App

**Local development (without Docker):**
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Pull the model (first time only)
ollama pull llama3.2

# Terminal 3: Start the app
npm run dev
```

**With Docker (CPU):**
```bash
docker compose up
```

**With Docker (NVIDIA GPU):**
```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up
```

Then open http://localhost:3000 (Docker) or http://localhost:5173 (dev).

---

## How Data Flows Through the App

```
Browser                    SvelteKit Server              Database
───────                    ────────────────              ────────

1. Visit /
   ──────────────────────→ +page.server.ts load()
                           ──────────────────────────→ SELECT * FROM checklists
                           ←──────────────────────────
   ←────────────────────── returns { checklists: [...] }
   Renders +page.svelte
   with data.checklists

2. Submit "Create" form
   POST /?/create ────────→ actions.create()
                            ──────────────────────────→ INSERT INTO checklists
                            ←──────────────────────────
   ←────────────────────── redirect to /checklist/1

3. Click "Generate"
   fetch /api/generate ───→ +server.ts POST()
                            ──→ fetch Ollama API ──→ LLM generates JSON
                            ←──────────────────────
                            ──────────────────────────→ INSERT checklist + items
                            ←──────────────────────────
   ←────────────────────── { redirectTo: '/checklist/2' }
   window.location.href
```

---

## Concepts Cheat Sheet

| SvelteKit | Django Equivalent |
|-----------|-------------------|
| `+page.svelte` | Template |
| `+page.server.ts` load() | View (GET) |
| `+page.server.ts` actions | View (POST) / Form handling |
| `+server.ts` | API view / DRF ViewSet |
| `+layout.svelte` | Base template |
| `$lib/server/` | App internals (never sent to browser) |
| `src/routes/` folder structure | urls.py |
| `hooks.server.ts` | AppConfig.ready() / middleware |

| Svelte 5 | Vue 3 Equivalent |
|-----------|-------------------|
| `$state()` | `ref()` |
| `$props()` | `defineProps()` |
| `{#if}` | `v-if` |
| `{#each}` | `v-for` |
| `bind:value` | `v-model` |
| `{@render children()}` | `<slot />` |

---

## File Tree Reference

```
smart_checklist/
├── src/
│   ├── app.css                    ← Tailwind + custom theme colors
│   ├── app.html                   ← HTML shell (rarely touch this)
│   ├── hooks.server.ts            ← Runs migrations on server start
│   ├── lib/
│   │   ├── assets/brain.svg       ← Logo icon
│   │   ├── schema.ts              ← Database table definitions
│   │   └── server/
│   │       ├── db.ts              ← Database connection (lazy)
│   │       └── migrate.ts         ← Migration runner
│   └── routes/
│       ├── +layout.svelte         ← Header + wrapper for all pages
│       ├── +page.svelte           ← Home page UI
│       ├── +page.server.ts        ← Home page data loading + form actions
│       ├── api/generate/
│       │   └── +server.ts         ← AI generation API endpoint
│       └── checklist/[id]/
│           ├── +page.svelte       ← Checklist detail UI
│           └── +page.server.ts    ← Checklist detail data + actions
├── drizzle/                       ← Generated SQL migration files
├── data/                          ← SQLite database (gitignored)
├── Dockerfile                     ← Multi-stage build for production
├── docker-compose.yml             ← Runs app + Ollama together
├── docker-compose.gpu.yml         ← GPU override (optional)
├── drizzle.config.ts              ← Drizzle CLI configuration
├── svelte.config.js               ← SvelteKit adapter + compiler config
├── vite.config.ts                 ← Vite plugins (Tailwind, SvelteKit)
├── package.json                   ← Dependencies + scripts
└── tsconfig.json                  ← TypeScript configuration
```
