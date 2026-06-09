# VillaDev Portafolio — Plan de implementación Fase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar el sitio público estático-dinámico (Next.js + i18n + form de contacto real) en producción sobre VPS Hostinger contenerizado y endurecido, con CI/CD desde GitHub y SSDLC operativo desde el primer commit.

**Architecture:** Monolito Next.js 15 App Router (SSR + RSC), contenido en archivos TypeScript, contact form vía Server Action + Resend. Imagen Docker Alpine no-root con FS read-only, en VPS detrás de Nginx con TLS wildcard. CI/CD: GitHub Actions → GHCR → SSH deploy. Sin base de datos en uso productivo (preparada para Fase 2).

**Tech Stack:** Next.js 15, React 19, TypeScript 5 (strict), next-intl 3, Zod 3, Resend SDK 3, pino 9, Vitest 2, Playwright 1.4x, ESLint 9 + `eslint-plugin-security`, Husky + gitleaks, Docker (multi-stage), Nginx, Certbot DNS-01, fail2ban, UFW, GitHub Actions, GHCR.

**Spec base:** [`docs/superpowers/specs/2026-06-09-villadev-portfolio-fase1-design.md`](../specs/2026-06-09-villadev-portfolio-fase1-design.md).

**Prototipo fuente de verdad visual:** `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/` (HTML/CSS/JS de referencia + screenshots).

---

## Convenciones del plan

- **Working directory:** todas las rutas son relativas a `~/Documents/Claude/Projects/villadev-portfolio/` salvo que se indique otra cosa.
- **Commits:** uno por tarea completada, mensaje en formato `area: descripción` (`feat:`, `chore:`, `docs:`, `test:`, `ci:`, `infra:`).
- **TDD:** se aplica a librerías puras (validadores, rate limit, logger, CSP helper, i18n config, server actions). Para componentes UI, se escribe el componente + un test de render mínimo y un test E2E donde aplique.
- **Secretos:** cada vez que se necesite un valor sensible (API key, password, SSH key, DNS API token), la tarea contiene una **subsección "Guía manual para el usuario"** con pasos para que tú lo generes y lo pegues en el archivo correspondiente — nunca se pide pegar en chat.
- **Verificación:** cada tarea termina con un paso de verificación (comando + salida esperada) antes del commit.
- **Fuente de verdad visual:** cuando una tarea crea un componente, leer primero el bloque correspondiente en `design/Portafolio.html` (o `design/Proyectos.html`) y `design/assets/styles.css`. Las clases CSS se portan tal cual.

## Mapa de fases

| Fase | Alcance | Tareas |
|---|---|---|
| A | Bootstrap del proyecto, tooling, SSDLC pre-commit | A1–A8 |
| B | Tokens, fuentes, i18n, librerías core (logger, CSP, rate limit) | B1–B9 |
| C | Contenido tipado + middleware + UI primitives | C1–C5 |
| D | Componentes de las secciones (Navbar..Footer) + Home | D1–D11 |
| E | Catálogo de proyectos + filtro | E1–E2 |
| F | Form de contacto: schema, Resend, server action, UI, tests E2E | F1–F6 |
| G | Health endpoint + verificación local end-to-end | G1–G2 |
| H | Containerización (Dockerfile + compose) | H1–H3 |
| I | CI/CD (GitHub Actions: CI + CD) | I1–I3 |
| J | Endurecimiento del VPS + Nginx + TLS + deploy.sh + backups | J1–J8 |
| K | Documentación (threat model, runbook, secrets-setup) | K1–K3 |
| L | Lanzamiento + verificación post-deploy + snapshot | L1–L4 |

Total estimado: 57 tareas. Cada tarea: 2–5 min por paso, 4–8 pasos típicamente.

---

## Fase A — Bootstrap del proyecto

### Tarea A1: Crear scaffold Next.js + TypeScript estricto

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `public/`, `.nvmrc`

- [ ] **Step 1: Inicializar Next.js sin telemetría ni asistente interactivo**

```bash
cd ~/Documents/Claude/Projects/villadev-portfolio
npx --yes create-next-app@latest . --typescript --eslint --app --src-dir --tailwind=false --turbopack=false --import-alias "@/*" --use-npm --no-git
```

Si pide confirmación para sobreescribir el directorio actual, responder `y` (sólo hay `docs/` y `.gitignore` previos).

- [ ] **Step 2: Bloquear versión de Node**

```bash
echo "22" > .nvmrc
```

- [ ] **Step 3: Endurecer `tsconfig.json` con flags estrictos**

Editar `tsconfig.json` y reemplazar el `compilerOptions` para que quede:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Habilitar `output: standalone` y desactivar `X-Powered-By`**

Reemplazar `next.config.ts` por:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

- [ ] **Step 5: Verificar typecheck y build inicial**

```bash
npm run lint && npx tsc --noEmit && npm run build
```

Esperado: build exitoso, sin errores de TS ni lint.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "chore: scaffold Next.js 15 + TS strict + standalone output"
```

---

### Tarea A2: Configurar ESLint con plugin de seguridad + Prettier

**Files:**
- Modify: `eslint.config.mjs`, `package.json`
- Create: `.prettierrc`, `.prettierignore`

- [ ] **Step 1: Instalar dependencias**

```bash
npm i -D eslint-plugin-security eslint-plugin-no-secrets prettier eslint-config-prettier
```

- [ ] **Step 2: Reemplazar `eslint.config.mjs`**

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";
import noSecrets from "eslint-plugin-no-secrets";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { security, "no-secrets": noSecrets },
    rules: {
      ...security.configs.recommended.rules,
      "no-secrets/no-secrets": ["error", { tolerance: 4.5 }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  { ignores: [".next/", "node_modules/", "coverage/", "playwright-report/", "test-results/"] },
];

export default eslintConfig;
```

- [ ] **Step 3: Crear `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 4: Crear `.prettierignore`**

```
.next/
node_modules/
coverage/
playwright-report/
test-results/
public/
*.lock
```

- [ ] **Step 5: Agregar scripts a `package.json`**

Dentro de `"scripts"`:

```json
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 6: Verificar**

```bash
npm run lint && npm run format && npm run typecheck
```

Esperado: sin errores.

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "chore: add eslint-plugin-security, no-secrets, prettier config"
```

---

### Tarea A3: Husky + lint-staged + gitleaks pre-commit

**Files:**
- Create: `.husky/pre-commit`, `.lintstagedrc.json`, `.gitleaks.toml`
- Modify: `package.json`

- [ ] **Step 1: Verificar que `gitleaks` está instalado en el sistema**

```bash
which gitleaks || brew install gitleaks
```

- [ ] **Step 2: Instalar Husky y lint-staged**

```bash
npm i -D husky lint-staged
npx husky init
```

- [ ] **Step 3: Crear `.lintstagedrc.json`**

```json
{
  "*.{ts,tsx,js,mjs}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"]
}
```

- [ ] **Step 4: Reemplazar `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
set -e
npx --no -- gitleaks protect --staged --redact --no-banner
npx --no -- lint-staged
npx --no -- tsc --noEmit
```

Luego: `chmod +x .husky/pre-commit`

- [ ] **Step 5: Crear `.gitleaks.toml` (configuración por defecto + alias)**

```toml
title = "VillaDev gitleaks config"

[extend]
useDefault = true

[[allowlist]]
description = "allow .env.example placeholders"
paths = ['''(^|/)\.env\.example$''']
```

- [ ] **Step 6: Verificar — provocar un commit limpio**

```bash
echo "" >> .gitignore
git add .gitignore && git commit -m "test: husky hook smoke"
```

Esperado: hook corre gitleaks → lint-staged → tsc, todos pasan, commit creado.

- [ ] **Step 7: Commit del scaffold de hooks (si quedó pendiente)**

```bash
git add .husky/ .lintstagedrc.json .gitleaks.toml package.json package-lock.json && git commit -m "chore: add husky, lint-staged, gitleaks pre-commit"
```

---

### Tarea A4: Vitest configurado para Node + jsdom

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `tests/unit/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: Instalar Vitest y React Testing Library**

```bash
npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/server-actions/**"],
      thresholds: { lines: 70, statements: 70, branches: 60, functions: 70 },
    },
  },
});
```

- [ ] **Step 3: Crear `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Agregar script a `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Crear test smoke**

`tests/unit/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Correr**

```bash
npm test
```

Esperado: 1 passed, 0 failed.

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "test: configure vitest with jsdom + RTL"
```

---

### Tarea A5: Playwright para E2E

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Instalar Playwright**

```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Crear `playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
```

- [ ] **Step 3: Crear smoke E2E**

`tests/e2e/smoke.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("home returns 200 and contains brand", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});
```

- [ ] **Step 4: Agregar scripts y excluir artefactos**

`package.json`:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

`.gitignore` (append):

```
/playwright-report/
/test-results/
/coverage/
```

- [ ] **Step 5: Construir y correr E2E**

```bash
npm run build && npm run test:e2e
```

Esperado: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "test: configure playwright e2e with webServer"
```

---

### Tarea A6: `.env.example` con todas las variables documentadas

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Crear `.env.example`**

```dotenv
# === Runtime ===
NODE_ENV=production
# Puerto que escucha Next dentro del contenedor (no exponer al host)
PORT=3000

# === Site ===
# Dominio público canónico (sin protocolo). Ej: villadev.com
SITE_HOST=villadev.tld
# Origen completo (con https://) usado por canonical URLs y CSP
SITE_ORIGIN=https://villadev.tld

# === Disponibilidad (badge "Disponible para proyectos") ===
# true | false  — controla el badge del hero. Cambio requiere reinicio del contenedor.
AVAILABLE=true

# === Contacto ===
# API key de Resend. Generar en https://resend.com → API Keys → Create (scope: Sending access).
RESEND_API_KEY=re_REPLACE_ME
# Dirección que recibe los mensajes del formulario
CONTACT_TO_EMAIL=villacis.j@icloud.com
# Dirección que envía (debe estar verificada en Resend, dominio propio)
CONTACT_FROM_EMAIL=contacto@villadev.tld
# Nombre que aparece como remitente
CONTACT_FROM_NAME=Contacto VillaDev

# === Rate limit ===
# Máximo de envíos del formulario por IP en CONTACT_RATE_WINDOW segundos
CONTACT_RATE_MAX=5
CONTACT_RATE_WINDOW=600

# === Proxy / IP real ===
# "cloudflare" | "nginx" — define qué header leer para obtener la IP real
TRUSTED_PROXY=nginx
```

- [ ] **Step 2: Verificar que `.env` está en `.gitignore`**

```bash
grep -E '^\.env$|^\.env\.local$' .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 3: Commit**

```bash
git add .env.example .gitignore && git commit -m "chore: document env vars in .env.example"
```

---

### Tarea A7: Estructura de carpetas src/

**Files:**
- Create directorios: `src/lib/`, `src/lib/i18n/`, `src/lib/schemas/`, `src/lib/email/`, `src/components/ui/`, `src/content/`, `src/server-actions/`, `src/styles/`, `tests/unit/`, `tests/e2e/`, `docs/`

- [ ] **Step 1: Crear carpetas con `.gitkeep`**

```bash
for d in src/lib src/lib/i18n src/lib/schemas src/lib/email src/components/ui src/content src/server-actions src/styles tests/unit; do
  mkdir -p "$d" && touch "$d/.gitkeep"
done
```

- [ ] **Step 2: Eliminar boilerplate inicial de Next.js**

```bash
rm -f src/app/page.tsx src/app/page.module.css src/app/globals.css public/*.svg
```

(`layout.tsx` se reescribe en tarea B9; el archivo inicial puede quedarse hasta entonces.)

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "chore: lay out src/ folder structure"
```

---

### Tarea A8: Verificación de scaffold (smoke completo)

- [ ] **Step 1: Correr toda la cadena de calidad**

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
```

Esperado: todos verde.

- [ ] **Step 2: Verificar hook pre-commit con un cambio trivial**

```bash
echo "# placeholder" > tests/unit/.gitkeep
git add tests/unit/.gitkeep && git commit -m "chore: verify pre-commit hook end-to-end"
```

Esperado: gitleaks pasa, lint-staged ejecuta prettier, tsc pasa, commit creado.

- [ ] **Step 3: Sin nuevo commit si no hubo cambios — verificar `git status`**

```bash
git status
```

Esperado: working tree clean.

---

## Fase B — Tokens, fuentes, i18n, librerías core

### Tarea B1: Portar tokens CSS del prototipo

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Crear `src/styles/tokens.css`** copiando tal cual el bloque `:root { ... }` de `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/assets/styles.css` (líneas 6-44). Contenido:

```css
:root {
  /* Surfaces */
  --bg:        #070b14;
  --bg-2:      #0a1020;
  --panel:     #0d1424;
  --card:      #101a2e;
  --card-2:    #13203a;
  --border:    rgba(120, 160, 220, 0.12);
  --border-2:  rgba(120, 160, 220, 0.22);

  /* Text */
  --text:      #e8eef9;
  --muted:     #8b9bb4;
  --dim:       #5e6e88;

  /* Accents */
  --blue:      #3b82f6;
  --blue-2:    #60a5fa;
  --cyan:      #22d3ee;
  --term:      #43e6a0;
  --term-dim:  #1f7a55;
  --warn:      #fbbf24;

  --grad:      linear-gradient(110deg, var(--blue) 0%, var(--cyan) 100%);
  --grad-soft: linear-gradient(110deg, rgba(59,130,246,0.16), rgba(34,211,238,0.10));

  /* Layout */
  --maxw:      1200px;
  --gutter:    clamp(20px, 5vw, 64px);
  --radius:    16px;
  --radius-sm: 10px;

  --shadow:    0 24px 60px -20px rgba(0,0,0,0.7);
  --glow:      0 0 0 1px rgba(59,130,246,0.25), 0 18px 50px -16px rgba(34,211,238,0.28);
}
```

> Nota: `--sans` y `--mono` se inyectan vía `next/font` (tarea B2). NO incluirlas aquí.

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css && git commit -m "feat(styles): port design tokens from prototype"
```

---

### Tarea B2: Cargar Space Grotesk + JetBrains Mono con `next/font` (self-hosted)

**Files:**
- Create: `src/styles/fonts.ts`

- [ ] **Step 1: Crear `src/styles/fonts.ts`**

```typescript
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

export const fontSans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/fonts.ts && git commit -m "feat(styles): self-host Space Grotesk + JetBrains Mono via next/font"
```

---

### Tarea B3: Estilos globales

**Files:**
- Create: `src/styles/globals.css`

- [ ] **Step 1: Crear `src/styles/globals.css`** con: import de `tokens.css`, mapeo de variables de fuente desde next/font, y la base reset/typography portada de las líneas 46-92 + 94-121 + 770-792 del prototipo. Contenido:

```css
@import "./tokens.css";

:root {
  --sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --mono: var(--font-mono), ui-monospace, "SFMono-Regular", monospace;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.5;
  overflow-x: hidden;
}
::selection { background: rgba(34,211,238,0.28); color: #fff; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

.shell { position: relative; z-index: 1; }
.wrap {
  width: 100%; max-width: var(--maxw);
  margin: 0 auto; padding-inline: var(--gutter);
}
.bg-grad {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(900px 600px at 78% -8%, rgba(34,211,238,0.10), transparent 60%),
    radial-gradient(800px 600px at 12% 8%, rgba(59,130,246,0.12), transparent 55%),
    radial-gradient(1000px 700px at 50% 120%, rgba(59,130,246,0.08), transparent 60%);
}
.bg-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

.eyebrow {
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cyan);
  display: inline-flex; align-items: center; gap: 0.6em;
}
.eyebrow::before {
  content: ""; width: 26px; height: 1px;
  background: var(--cyan); opacity: 0.6;
}

h1, h2, h3 { font-weight: 600; line-height: 1.08; letter-spacing: -0.02em; margin: 0; }

.gradient-text {
  background: linear-gradient(100deg, #fff 0%, var(--blue-2) 55%, var(--cyan) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

section { position: relative; }
.section { padding-block: clamp(70px, 11vw, 140px); }
.section-head { max-width: 720px; margin-bottom: clamp(36px, 5vw, 64px); }
.section-head h2 { font-size: clamp(2rem, 4.4vw, 3.1rem); margin-top: 0.5em; }
.section-head p {
  color: var(--muted); font-size: clamp(1rem, 1.5vw, 1.15rem);
  margin: 1em 0 0; max-width: 60ch;
}

.reveal { opacity: 0; transform: translateY(26px);
  transition: opacity .8s cubic-bezier(.2,.8,.2,1), transform .8s cubic-bezier(.2,.8,.2,1); }
.reveal.in { opacity: 1; transform: none; }
.reveal.d1 { transition-delay: .08s; }
.reveal.d2 { transition-delay: .16s; }
.reveal.d3 { transition-delay: .24s; }
.reveal.d4 { transition-delay: .32s; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  html { scroll-behavior: auto; }
}
```

> Las clases específicas de cada componente (`.nav`, `.hero`, `.service`, etc.) viven en CSS Modules de cada componente (tareas D*). Aquí sólo va lo verdaderamente global.

- [ ] **Step 2: Commit**

```bash
git add src/styles/globals.css && git commit -m "feat(styles): add globals.css with reset and shared utilities"
```

---

### Tarea B4: Instalar y configurar `next-intl`

**Files:**
- Create: `src/lib/i18n/config.ts`, `src/lib/i18n/routing.ts`, `src/lib/i18n/request.ts`, `messages/es.json`, `messages/en.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Instalar**

```bash
npm i next-intl
```

- [ ] **Step 2: Crear `src/lib/i18n/config.ts`**

```typescript
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
```

- [ ] **Step 3: Crear `src/lib/i18n/routing.ts`**

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { defaultLocale, locales } from "./config";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Step 4: Crear `src/lib/i18n/request.ts`**

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale | undefined;
  if (!locale || !routing.locales.includes(locale)) locale = routing.defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, messages };
});
```

- [ ] **Step 5: Actualizar `next.config.ts` para usar el plugin de next-intl**

```typescript
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  experimental: { typedRoutes: true },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Crear `messages/es.json` y `messages/en.json`** convirtiendo `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/assets/i18n.js` a JSON anidado.

> Estructura por namespaces (no claves planas). Ejemplo del shape final (los strings completos se copian del archivo fuente):

```json
{
  "nav": { "services": "Servicios", "about": "Sobre mí", "projects": "Proyectos", "experience": "Experiencia", "skills": "Skills", "contact": "Contacto", "cta": "Hablemos" },
  "hero": {
    "badge": "Disponible para proyectos",
    "h1a": "Aplicaciones web y automatizaciones,",
    "h1b": "con seguridad por diseño.",
    "lead": "Diseño, desarrollo e implemento ...",
    "cta1": "Ver servicios", "cta2": "Conversemos",
    "stat1": { "n": "8+", "l": "años en tecnología y soporte" },
    "stat2": { "n": "12+", "l": "certificaciones técnicas" },
    "stat3": { "n": "CCNA", "l": "+ formación en seguridad ofensiva" }
  },
  "services": { "eyebrow": "Lo que hago", "h2": "...", "p": "...",
    "items": {
      "svc1": { "t": "Desarrollo de aplicaciones web", "p": "..." },
      "svc2": { "t": "Automatización con n8n", "p": "..." },
      "svc3": { "t": "Seguridad por diseño", "p": "..." },
      "svc4": { "t": "Entrega acelerada con IA", "p": "..." }
    }
  },
  "about": { "eyebrow": "Sobre mí", "h2": "...", "p1": "...", "p2": "...",
    "facts": { "f1k": "Ubicación", "f1v": "Santiago, Chile", "f2k": "...", "f2v": "...", "f3k": "...", "f3v": "...", "f4k": "...", "f4v": "..." }
  },
  "projects": { "eyebrow": "Trabajo", "h2": "Proyectos seleccionados.", "p": "...", "viewall": "Ver todos los proyectos" },
  "experience": { "eyebrow": "Trayectoria", "h2": "Experiencia profesional.", "p": "..." },
  "certs": { "eyebrow": "Credenciales", "h2": "Certificaciones y formación.", "p": "..." },
  "skills": { "eyebrow": "Stack", "h2": "Habilidades técnicas.", "p": "..." },
  "contact": { "eyebrow": "Contacto", "h2": "¿Tienes un proyecto en mente?", "p": "..." },
  "form": {
    "name": "Nombre", "namePh": "Tu nombre",
    "email": "Correo", "emailPh": "tucorreo@ejemplo.com",
    "subject": "Asunto",
    "opts": { "proyecto": "Desarrollo de aplicación web", "consultoria": "Automatización con n8n", "colaboracion": "Seguridad / auditoría", "otro": "Otro" },
    "message": "Mensaje", "messagePh": "Describe brevemente tu proyecto…",
    "send": "Enviar mensaje",
    "states": { "submitting": "Enviando…", "success": "Mensaje enviado. Te respondo pronto.", "error": "No se pudo enviar. Intenta de nuevo en un minuto.", "rateLimit": "Demasiados intentos. Intenta más tarde.", "validation": "Revisa los campos." }
  },
  "footer": { "tagline": "...", "nav": "Navegación", "connect": "Conecta", "rights": "Todos los derechos reservados.", "built": "..." },
  "projpage": { "title": "Proyectos — VillaDev", "eyebrow": "Portafolio de trabajo", "h2": "Todos los proyectos.", "p": "...", "back": "Volver al inicio" },
  "filter": { "all": "Todos", "web": "Desarrollo web", "auto": "Automatización", "sec": "Seguridad" }
}
```

Para `en.json`, traducir manteniendo las mismas claves. Las cadenas con énfasis (`<strong>`) del prototipo NO van como HTML embebido — se rendean con `t.rich("p1", { strong: (c) => <strong>{c}</strong> })`. En el JSON usar el marcador `<strong>texto</strong>`; next-intl lo procesa.

**Claves anidadas requeridas — NO omitir** (los componentes en Phase D las consumen vía `t(item.roleKey)` y similar):

- `services.items.svc1.t/p`, `services.items.svc2.t/p`, `services.items.svc3.t/p`, `services.items.svc4.t/p`.
- `experience.items.exp1.{role, co, when, p}` hasta `exp5`.
- `projects.prj1.{t, p, status, link}` hasta `prj3`.
- `about.facts.{f1k,f1v,f2k,f2v,f3k,f3v,f4k,f4v}`.
- `skills.{sk1, sk1d, sk2, sk2d, sk3, sk3d, sk4, sk4d, sk5, sk5d, sk6, sk6d}`.
- `form.opts.{proyecto, consultoria, colaboracion, otro}`.
- `form.states.{submitting, success, error, rateLimit, validation}`.
- `form.{name, namePh, email, emailPh, subject, message, messagePh, send}`.
- `filter.{all, web, auto, sec}`.
- `projpage.{title, eyebrow, h2, p, back}`.
- `footer.{tagline, nav, connect, rights, built}`.

- [ ] **Step 7: Verificar JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/es.json'))" && node -e "JSON.parse(require('fs').readFileSync('messages/en.json'))" && echo OK
```

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "feat(i18n): configure next-intl with locales es/en and message catalogs"
```

---

### Tarea B5: Logger pino con redacción (TDD)

**Files:**
- Create: `src/lib/logger.ts`, `src/lib/logger.test.ts`

- [ ] **Step 1: Instalar pino**

```bash
npm i pino
npm i -D pino-pretty
```

- [ ] **Step 2: Escribir test failing**

`src/lib/logger.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { logger, redactValue } from "./logger";

describe("logger redaction", () => {
  it("redacts known sensitive keys", () => {
    expect(redactValue("RESEND_API_KEY", "re_secret123")).toBe("[REDACTED]");
    expect(redactValue("password", "p")).toBe("[REDACTED]");
    expect(redactValue("authorization", "Bearer x")).toBe("[REDACTED]");
  });

  it("leaves harmless keys untouched", () => {
    expect(redactValue("name", "Jimmy")).toBe("Jimmy");
  });

  it("exposes a logger instance", () => {
    expect(typeof logger.info).toBe("function");
  });

  it("does not throw when logging an object with secrets", () => {
    expect(() => logger.info({ password: "x", name: "y" }, "test")).not.toThrow();
  });
});
```

- [ ] **Step 3: Correr — debe fallar**

```bash
npm test -- logger
```

Esperado: FAIL (módulo no existe).

- [ ] **Step 4: Implementar**

`src/lib/logger.ts`:

```typescript
import pino from "pino";

const SENSITIVE = new Set([
  "password", "passwd", "secret", "token", "authorization",
  "cookie", "set-cookie", "api_key", "apikey",
  "resend_api_key", "ghcr_token", "vps_ssh_key",
]);

export function redactValue(key: string, value: unknown): unknown {
  return SENSITIVE.has(key.toLowerCase()) ? "[REDACTED]" : value;
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: Array.from(SENSITIVE),
    censor: "[REDACTED]",
  },
  base: { service: "villadev-portfolio" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

- [ ] **Step 5: Correr — debe pasar**

```bash
npm test -- logger
```

Esperado: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/logger.ts src/lib/logger.test.ts package.json package-lock.json && git commit -m "feat(lib): add pino logger with redaction (tested)"
```

---

### Tarea B6: Helper de IP real desde headers (TDD)

**Files:**
- Create: `src/lib/client-ip.ts`, `src/lib/client-ip.test.ts`

- [ ] **Step 1: Test failing**

```typescript
import { describe, it, expect } from "vitest";
import { getClientIp } from "./client-ip";

function h(map: Record<string, string>) {
  return { get: (k: string) => map[k.toLowerCase()] ?? null };
}

describe("getClientIp", () => {
  it("prefers CF-Connecting-IP when TRUSTED_PROXY=cloudflare", () => {
    expect(getClientIp(h({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }), "cloudflare")).toBe("1.2.3.4");
  });
  it("uses last hop of X-Forwarded-For when TRUSTED_PROXY=nginx", () => {
    expect(getClientIp(h({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }), "nginx")).toBe("10.0.0.1");
  });
  it("falls back to 'unknown' if header missing", () => {
    expect(getClientIp(h({}), "nginx")).toBe("unknown");
  });
  it("rejects non-IP-like strings", () => {
    expect(getClientIp(h({ "x-forwarded-for": "not-an-ip" }), "nginx")).toBe("unknown");
  });
});
```

- [ ] **Step 2: Implementar**

`src/lib/client-ip.ts`:

```typescript
type HeaderLike = { get(name: string): string | null };
export type ProxyMode = "cloudflare" | "nginx";

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;

function valid(ip: string): boolean {
  return IPV4.test(ip) || (IPV6.test(ip) && ip.includes(":"));
}

export function getClientIp(headers: HeaderLike, mode: ProxyMode = "nginx"): string {
  if (mode === "cloudflare") {
    const cf = headers.get("cf-connecting-ip");
    if (cf && valid(cf.trim())) return cf.trim();
  }
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && valid(last)) return last;
  }
  return "unknown";
}
```

- [ ] **Step 3: Verificar y commit**

```bash
npm test -- client-ip
git add src/lib/client-ip.ts src/lib/client-ip.test.ts && git commit -m "feat(lib): add client-ip helper for trusted proxy (tested)"
```

---

### Tarea B7: Rate limit token bucket en memoria (TDD)

**Files:**
- Create: `src/lib/rate-limit.ts`, `src/lib/rate-limit.test.ts`

- [ ] **Step 1: Test failing**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to max requests in window", () => {
    const rl = createRateLimiter({ max: 3, windowMs: 60_000 });
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").allowed).toBe(false);
  });

  it("isolates per key", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 60_000 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("refills after window passes", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1_000 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rl.check("a").allowed).toBe(true);
  });

  it("returns retryAfterSeconds when blocked", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 60_000 });
    rl.check("a");
    const r = rl.check("a");
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
type Bucket = { count: number; resetAt: number };
type Opts = { max: number; windowMs: number };
type Result = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export function createRateLimiter(opts: Opts) {
  const buckets = new Map<string, Bucket>();
  return {
    check(key: string): Result {
      const now = Date.now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { allowed: true, remaining: opts.max - 1, retryAfterSeconds: 0 };
      }
      if (b.count >= opts.max) {
        return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000) };
      }
      b.count += 1;
      return { allowed: true, remaining: opts.max - b.count, retryAfterSeconds: 0 };
    },
  };
}
```

- [ ] **Step 3: Verificar y commit**

```bash
npm test -- rate-limit
git add src/lib/rate-limit.ts src/lib/rate-limit.test.ts && git commit -m "feat(lib): in-memory token bucket rate limiter (tested)"
```

---

### Tarea B8: Helper CSP nonce + cabeceras de seguridad (TDD)

**Files:**
- Create: `src/lib/csp.ts`, `src/lib/csp.test.ts`

- [ ] **Step 1: Test failing**

```typescript
import { describe, it, expect } from "vitest";
import { buildCsp, securityHeaders, generateNonce } from "./csp";

describe("CSP helpers", () => {
  it("nonce is 22+ base64 chars", () => {
    const n = generateNonce();
    expect(n.length).toBeGreaterThanOrEqual(22);
  });

  it("CSP includes nonce in script-src and style-src", () => {
    const csp = buildCsp("abc123");
    expect(csp).toMatch(/script-src[^;]*'nonce-abc123'/);
    expect(csp).toMatch(/style-src[^;]*'nonce-abc123'/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/api\.resend\.com/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-inline");
  });

  it("securityHeaders contains all required entries", () => {
    const h = securityHeaders("abc");
    expect(h["Content-Security-Policy"]).toBeDefined();
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import { randomBytes } from "node:crypto";

export function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

export function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-hashes'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.resend.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(nonce: string): Record<string, string> {
  return {
    "Content-Security-Policy": buildCsp(nonce),
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
  };
}
```

- [ ] **Step 3: Verificar y commit**

```bash
npm test -- csp
git add src/lib/csp.ts src/lib/csp.test.ts && git commit -m "feat(lib): CSP nonce + security headers helpers (tested)"
```

---

### Tarea B9: Middleware Next.js (i18n + headers + nonce)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Implementar**

```typescript
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { generateNonce, securityHeaders } from "@/lib/csp";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-csp-nonce", nonce);

  const res = intlMiddleware(
    new NextRequest(req, { headers: reqHeaders }),
  ) as NextResponse;

  for (const [k, v] of Object.entries(securityHeaders(nonce))) {
    res.headers.set(k, v);
  }
  res.headers.set("x-csp-nonce", nonce);
  return res;
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 2: Verificar build**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts && git commit -m "feat(middleware): i18n routing + per-request CSP nonce + security headers"
```

---

## Fase C — Contenido tipado + layout + UI primitives

### Tarea C1: Tipos de contenido

**Files:**
- Create: `src/content/types.ts`

- [ ] **Step 1: Crear `src/content/types.ts`**

```typescript
export type ProjectStatus = "live" | "soon";
export type ProjectCategory = "web" | "auto" | "sec";

export interface Project {
  id: string;
  slug: string;
  titleKey: string;
  descKey: string;
  linkKey: string;
  statusKey: string;
  status: ProjectStatus;
  category: ProjectCategory;
  url?: string;
  glyph: string;
  tags: readonly string[];
  featured: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  ongoing: boolean;
}

export interface ExperienceItem {
  id: string;
  roleKey: string;
  coKey: string;
  whenKey: string;
  descKey: string;
  current: boolean;
  chips: readonly string[];
}

export interface Service {
  id: string;
  index: string;
  titleKey: string;
  descKey: string;
  tags: readonly string[];
  icon: "code" | "automation" | "shield" | "spark";
}

export interface SkillCategory {
  id: string;
  labelKey: string;
  descKey: string;
}
```

> Las claves `*Key` son las paths del JSON de next-intl (ej. `"items.svc1.t"`); los componentes resuelven el texto con `useTranslations`.

- [ ] **Step 2: Commit**

```bash
git add src/content/types.ts && git commit -m "feat(content): define typed content interfaces"
```

---

### Tarea C2: Datos de contenido (seed desde el prototipo)

**Files:**
- Create: `src/content/projects.ts`, `src/content/services.ts`, `src/content/experience.ts`, `src/content/certifications.ts`, `src/content/skills.ts`

- [ ] **Step 1: `src/content/projects.ts`**

```typescript
import type { Project } from "./types";

export const projects: readonly Project[] = [
  {
    id: "blog", slug: "blog-tecnico", featured: true,
    titleKey: "prj1.t", descKey: "prj1.p", linkKey: "prj1.link", statusKey: "prj1.status",
    status: "live", category: "sec", url: "https://villacisjimmy.github.io/blog/",
    glyph: "</>", tags: ["Security", "Networking", "Writeups"],
  },
  {
    id: "n8n", slug: "automatizacion-n8n", featured: true,
    titleKey: "prj2.t", descKey: "prj2.p", linkKey: "prj2.link", statusKey: "prj2.status",
    status: "soon", category: "auto",
    glyph: "⚙", tags: ["n8n", "APIs", "Automation"],
  },
  {
    id: "fullstack", slug: "app-fullstack", featured: true,
    titleKey: "prj3.t", descKey: "prj3.p", linkKey: "prj3.link", statusKey: "prj3.status",
    status: "soon", category: "web",
    glyph: "{ }", tags: ["Full-stack", "Django", "SQL"],
  },
] as const;
```

- [ ] **Step 2: `src/content/services.ts`**

```typescript
import type { Service } from "./types";

export const services: readonly Service[] = [
  { id: "web", index: "01", titleKey: "items.svc1.t", descKey: "items.svc1.p", tags: ["JavaScript", "Python", "Django", "SQL"], icon: "code" },
  { id: "auto", index: "02", titleKey: "items.svc2.t", descKey: "items.svc2.p", tags: ["n8n", "APIs", "Webhooks", "Docker"], icon: "automation" },
  { id: "sec", index: "03", titleKey: "items.svc3.t", descKey: "items.svc3.p", tags: ["Pentesting", "Hardening", "OWASP"], icon: "shield" },
  { id: "ai", index: "04", titleKey: "items.svc4.t", descKey: "items.svc4.p", tags: ["Claude", "ChatGPT", "Gemini"], icon: "spark" },
] as const;
```

- [ ] **Step 3: `src/content/experience.ts`**

```typescript
import type { ExperienceItem } from "./types";

export const experience: readonly ExperienceItem[] = [
  { id: "inev", current: true, roleKey: "items.exp1.role", coKey: "items.exp1.co", whenKey: "items.exp1.when", descKey: "items.exp1.p", chips: ["VLAN", "UniFi UDM", "HP iLO", "Trello", "Gantt"] },
  { id: "aus", current: false, roleKey: "items.exp2.role", coKey: "items.exp2.co", whenKey: "items.exp2.when", descKey: "items.exp2.p", chips: ["English B2", "Adaptabilidad"] },
  { id: "cgs", current: false, roleKey: "items.exp3.role", coKey: "items.exp3.co", whenKey: "items.exp3.when", descKey: "items.exp3.p", chips: ["Clientes B2B", "Integraciones"] },
  { id: "entel", current: false, roleKey: "items.exp4.role", coKey: "items.exp4.co", whenKey: "items.exp4.when", descKey: "items.exp4.p", chips: ["Windows", "Linux", "Active Directory"] },
  { id: "cam", current: false, roleKey: "items.exp5.role", coKey: "items.exp5.co", whenKey: "items.exp5.when", descKey: "items.exp5.p", chips: ["FTTH", "Fibra óptica", "CTO/NAP"] },
] as const;
```

> Agregar las llaves `items.exp1.role`, etc. dentro del namespace `experience` en `messages/{es,en}.json` si no están ya.

- [ ] **Step 4: `src/content/certifications.ts`**

```typescript
import type { Certification } from "./types";

export const certifications: readonly Certification[] = [
  { id: "fsjs",    name: "Bootcamp Full Stack JavaScript",       issuer: "en curso",                year: 2025, ongoing: true },
  { id: "linux",   name: "Linux para DevOps",                    issuer: "DevOps",                  year: 2025, ongoing: false },
  { id: "secp",    name: "CompTIA Security+",                    issuer: "preparando cert.",        year: 2025, ongoing: true },
  { id: "iax",     name: "Transformación Digital con IA",        issuer: "IA & Automatización",     year: 2025, ongoing: false },
  { id: "cnios",   name: "Cisco CNIOS",                          issuer: "Network Operating Systems", year: 2025, ongoing: false },
  { id: "ccna",    name: "Cisco CCNA R&S",                       issuer: "Routing & Switching",     year: 2024, ongoing: false },
  { id: "nse3",    name: "Fortinet NSE 3",                       issuer: "Network Security",        year: 2023, ongoing: false },
  { id: "qualys",  name: "Qualys VMDR",                          issuer: "Vulnerability Mgmt",      year: 2022, ongoing: false },
  { id: "aws",     name: "AWS Cloud Technical Essentials",       issuer: "Cloud",                   year: 2021, ongoing: false },
  { id: "dragon",  name: "Diplomado Seguridad Ofensiva",         issuer: "DragonJAR · Pentesting",  year: 2021, ongoing: false },
  { id: "duoc",    name: "Diplomado Seguridad de la Información", issuer: "Duoc UC · GPA 6.7",      year: 2020, ongoing: false },
  { id: "td",      name: "Bootcamps Full Stack (Python/Java)",   issuer: "Talento Digital",         year: 2021, ongoing: false },
] as const;
```

- [ ] **Step 5: `src/content/skills.ts`**

```typescript
import type { SkillCategory } from "./types";

export const skillCategories: readonly SkillCategory[] = [
  { id: "sk1", labelKey: "sk1", descKey: "sk1d" },
  { id: "sk3", labelKey: "sk3", descKey: "sk3d" },
  { id: "sk6", labelKey: "sk6", descKey: "sk6d" },
  { id: "sk4", labelKey: "sk4", descKey: "sk4d" },
  { id: "sk2", labelKey: "sk2", descKey: "sk2d" },
  { id: "sk5", labelKey: "sk5", descKey: "sk5d" },
] as const;
```

- [ ] **Step 6: Verificar typecheck y commit**

```bash
npm run typecheck && git add src/content/ && git commit -m "feat(content): seed projects/services/experience/certs/skills"
```

---

### Tarea C3: Layout raíz `[locale]/layout.tsx`

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Modify/delete: `src/app/layout.tsx` (eliminar el del scaffold) → reescribir como passthrough mínimo si Next lo requiere.

- [ ] **Step 1: Reemplazar el layout root genérico** por uno mínimo:

`src/app/layout.tsx`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Crear `src/app/[locale]/layout.tsx`**

```tsx
import "@/styles/globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { fontSans, fontMono } from "@/styles/fonts";
import type { Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic"; // depende de headers() para el nonce

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "VillaDev — Web apps, automation & security" : "VillaDev — Desarrollo web, automatización y seguridad",
    description: locale === "en"
      ? "Network engineer (CCNA). Web application development, n8n automation and security by design."
      : "Ingeniero en Conectividad y Redes (CCNA). Desarrollo de aplicaciones web, automatización con n8n y seguridad por diseño.",
    metadataBase: new URL(process.env.SITE_ORIGIN ?? "http://localhost:3000"),
    alternates: { canonical: "/", languages: { es: "/es", en: "/en" } },
  };
}

export default async function LocaleLayout({
  children, params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <html lang={locale} className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <div className="bg-grad" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verificar typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/app/ && git commit -m "feat(app): root + [locale] layouts with i18n provider and fonts"
```

---

### Tarea C4: UI primitives (Button, Chip, Eyebrow, RevealOnScroll)

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Chip.tsx`, `src/components/ui/Eyebrow.tsx`, `src/components/ui/RevealOnScroll.tsx`

- [ ] **Step 1: `Button.tsx`** (port de `.btn`/`.btn-primary`/`.btn-ghost`)

```tsx
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "default";
type Common = { variant?: Variant; children: ReactNode };

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  const { variant = "default", className = "", children, ...rest } = props;
  return (
    <button className={`${styles.btn} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & Common) {
  const { variant = "default", className = "", children, ...rest } = props;
  return (
    <a className={`${styles.btn} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
```

`src/components/ui/Button.module.css` — portar `.btn`/`.btn-primary`/`.btn-ghost`/`.btn .arrow` de `styles.css` líneas 126-157 reemplazando `.btn` → `.btn`, etc.

- [ ] **Step 2: `Chip.tsx`** (port de `.tags span` y `.chips span`)

```tsx
import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export function Chip({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "neutral" }) {
  return <span className={`${styles.chip} ${styles[tone]}`}>{children}</span>;
}
```

`Chip.module.css`: dos variantes (`blue` reproduce `.tags span` con fondo azul translúcido; `neutral` reproduce `.chips span` con borde gris).

- [ ] **Step 3: `Eyebrow.tsx`**

```tsx
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}
```

(usa `.eyebrow` ya definida en `globals.css`)

- [ ] **Step 4: `RevealOnScroll.tsx`** — wrapper client-only que aplica `.in` cuando el elemento entra en viewport

```tsx
"use client";
import { useEffect, useRef, type ReactNode } from "react";

type Props = { delay?: 0 | 1 | 2 | 3 | 4; as?: keyof JSX.IntrinsicElements; className?: string; children: ReactNode };

export function RevealOnScroll({ delay = 0, as = "div", className = "", children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.classList.add("in"); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as any;
  const dClass = delay ? ` d${delay}` : "";
  return <Tag ref={ref as any} className={`reveal${dClass} ${className}`.trim()}>{children}</Tag>;
}
```

- [ ] **Step 5: Test mínimo de Chip y Button**

`src/components/ui/Chip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip>hello</Chip>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Verificar y commit**

```bash
npm test -- Chip && git add src/components/ui/ && git commit -m "feat(ui): Button, Chip, Eyebrow, RevealOnScroll primitives"
```

---

### Tarea C5: Background canvas decorativo (client-only, respeta reduce-motion)

**Files:**
- Create: `src/components/NetworkCanvas/NetworkCanvas.tsx`

- [ ] **Step 1: Crear componente**

Portar la lógica de canvas de `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/assets/app.js` líneas 191-270 a un componente React client-only:

```tsx
"use client";
import { useEffect, useRef } from "react";

export function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, raf = 0;
    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    let nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 26_000);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const maxD = 132;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        const mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.hypot(mdx, mdy);
        if (md < 120) { a.x += (mdx / md) * 0.6; a.y += (mdy / md) * 0.6; }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < maxD) {
            const o = (1 - d / maxD) * 0.5;
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(59,130,246,${o})`);
            grad.addColorStop(1, `rgba(34,211,238,${o})`);
            ctx.strokeStyle = grad; ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(96,165,250,0.7)"; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerleave", onLeave);
    resize(); draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return <canvas ref={ref} id="net" className="bg-canvas" aria-hidden="true" />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NetworkCanvas/ && git commit -m "feat(ui): NetworkCanvas background (client-only, reduce-motion aware)"
```

---

## Fase D — Componentes de secciones + Home

> **Patrón común a todas las tareas D*:** cada componente se construye en su carpeta con `Component.tsx` + `Component.module.css`. El CSS se porta literal del bloque correspondiente de `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/assets/styles.css` (sólo las clases del componente; sin re-declarar tokens). Los textos se obtienen con `useTranslations` del namespace correspondiente (`getTranslations` en server components). Donde el prototipo usa `<strong>` dentro de cadenas, el componente usa `t.rich("key", { strong: (c) => <strong>{c}</strong> })`.

### Tarea D1: Navbar (server + client subcomponent)

**Files:**
- Create: `src/components/Navbar/Navbar.tsx`, `src/components/Navbar/Navbar.module.css`, `src/components/Navbar/LangSwitch.tsx`, `src/components/Navbar/MobileMenu.tsx`

- [ ] **Step 1: `Navbar.module.css`** — portar `.nav`/`.nav-inner`/`.brand`/`.nav-links`/`.nav-right`/`.nav-toggle` y `.mobile-menu` de `styles.css` líneas 162-258 + 810-832.

- [ ] **Step 2: `LangSwitch.tsx` (client)** — cambia entre `/es/...` y `/en/...` usando `usePathname` + `useRouter` de `@/lib/i18n/routing`.

```tsx
"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/routing";
import { locales, type Locale } from "@/lib/i18n/config";
import styles from "./Navbar.module.css";

export function LangSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className={styles.lang} role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          className={l === locale ? styles.langActive : ""}
          onClick={() => router.replace(pathname, { locale: l })}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `MobileMenu.tsx` (client)** — overlay con clase `.open` toggled, links cierran al click.

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import styles from "./Navbar.module.css";

export function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const items = [
    ["services", "01"], ["about", "02"], ["projects", "03"],
    ["experience", "04"], ["skills", "05"], ["contact", "06"],
  ] as const;
  return (
    <>
      <button className={styles.navToggle} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      </button>
      <div className={`${styles.mobileMenu} ${open ? styles.open : ""}`}>
        {items.map(([k, n]) => (
          <Link key={k} href={`/#${k === "services" ? "services" : k}`} onClick={close}>
            <span className={styles.n}>{n}</span><span>{t(k)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
```

> El comportamiento `scrollY > 24 → .scrolled` se hace en `Navbar.tsx` con un effect.

- [ ] **Step 4: `Navbar.tsx` (client por el scroll listener)**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { LangSwitch } from "./LangSwitch";
import { MobileMenu } from "./MobileMenu";
import styles from "./Navbar.module.css";

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`wrap ${styles.navInner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}><span>VD</span></span>
          <span>VillaDev</span>
        </Link>
        <nav>
          <ul className={styles.navLinks}>
            <li><Link href="/#services">{t("services")}</Link></li>
            <li><Link href="/#about">{t("about")}</Link></li>
            <li><Link href="/#projects">{t("projects")}</Link></li>
            <li><Link href="/#experience">{t("experience")}</Link></li>
            <li><Link href="/#skills">{t("skills")}</Link></li>
          </ul>
        </nav>
        <div className={styles.navRight}>
          <LangSwitch />
          <Link href="/#contact" className="btn btn-primary">{t("cta")}</Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar/ && git commit -m "feat(navbar): Navbar + LangSwitch + MobileMenu with scroll state"
```

---

### Tarea D2: Footer

**Files:**
- Create: `src/components/Footer/Footer.tsx`, `src/components/Footer/Footer.module.css`

- [ ] **Step 1: CSS** — portar `.footer` y siguientes de `styles.css` líneas 773-792.

- [ ] **Step 2: Component (server)**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import styles from "./Footer.module.css";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.footerTop}>
          <div>
            <Link href="/" className={styles.brand}>
              <span className={styles.mark}><span>VD</span></span>
              <span>VillaDev<small>SEC · DEV · AUTOMATION</small></span>
            </Link>
            <p className={styles.tagline}>{t("footer.tagline")}</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>{t("footer.nav")}</h4>
              <Link href="/#services">{t("nav.services")}</Link>
              <Link href="/#about">{t("nav.about")}</Link>
              <Link href="/#projects">{t("nav.projects")}</Link>
              <Link href="/#experience">{t("nav.experience")}</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>{t("footer.connect")}</h4>
              <a href="mailto:villacis.j@icloud.com">Email</a>
              <a href="https://www.linkedin.com/in/jimmy-villacis/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://villacisjimmy.github.io/blog/" target="_blank" rel="noopener noreferrer">Blog</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {year} VillaDev · {t("footer.rights")}</span>
          <span>{t("footer.built")}</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer/ && git commit -m "feat(footer): Footer with i18n strings"
```

---

### Tarea D3: Hero (server shell + client interactivos)

**Files:**
- Create: `src/components/Hero/Hero.tsx`, `src/components/Hero/Hero.module.css`, `src/components/Hero/Terminal.tsx`, `src/components/Hero/StatCounter.tsx`, `src/components/Hero/AvailabilityBadge.tsx`

- [ ] **Step 1: CSS** — portar `.hero`/`.hero-grid`/`.badge-live`/`.hero-stats`/`.stat .num`/`.terminal`/`.term-bar`/`.term-body`/`.cursor` de `styles.css` líneas 283-399.

- [ ] **Step 2: `AvailabilityBadge.tsx` (server)** — lee `process.env.AVAILABLE`.

```tsx
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import styles from "./Hero.module.css";

const Env = z.object({ AVAILABLE: z.enum(["true", "false"]).default("true") });

export async function AvailabilityBadge() {
  const t = await getTranslations("hero");
  const { AVAILABLE } = Env.parse({ AVAILABLE: process.env.AVAILABLE });
  if (AVAILABLE !== "true") return null;
  return (
    <span className={styles.badgeLive}>
      <span className={styles.dot} />
      <span>{t("badge")}</span>
    </span>
  );
}
```

- [ ] **Step 3: `StatCounter.tsx` (client)** — anima de 0 al valor cuando entra en viewport (port de `app.js` líneas 130-149).

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function StatCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setValue(target); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(el);
        const step = Math.max(1, Math.round(target / 28));
        let cur = 0;
        const tick = () => { cur = Math.min(target, cur + step); setValue(cur); if (cur < target) requestAnimationFrame(tick); };
        tick();
      }),
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <div ref={ref} className="num">{value}{suffix}</div>;
}
```

- [ ] **Step 4: `Terminal.tsx` (client)** — efecto typing (port de `app.js` líneas 73-127). Cuando `prefers-reduced-motion`, render estático.

```tsx
"use client";
import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

const LINES = [
  { html: '<span class="prompt">villadev@sec</span>:<span class="path">~/proyecto</span>$ ', cmd: "init --secure-by-design", delay: 38 },
  { html: '<span class="out">✓ entorno listo · dependencias auditadas</span>', cmd: "", delay: 12, instant: true },
  { html: '<span class="prompt">villadev@sec</span>:<span class="path">~/proyecto</span>$ ', cmd: "deploy --fast", delay: 38 },
  { html: '<span class="out">→ build <span class="key">1.8s</span> · tests <span class="ok">passing</span></span>', cmd: "", delay: 12, instant: true },
  { html: '<span class="out">→ <span class="key">n8n</span> workflows conectados</span>', cmd: "", delay: 12, instant: true },
  { html: '<span class="ok">✓ en producción · seguro &amp; veloz</span>', cmd: "", delay: 12, instant: true },
] as const;

export function Terminal() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const term = ref.current;
    if (!term) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      term.innerHTML =
        `<div class="${styles.termLine}"><span class="prompt">villadev@sec</span>:<span class="path">~/proyecto</span>$ <span class="cmd">deploy --fast --secure</span></div>` +
        `<div class="${styles.termLine}"><span class="ok">✓ en producción · seguro &amp; veloz</span></div>`;
      return;
    }
    let li = 0; let cancelled = false;
    const make = () => { const el = document.createElement("div"); el.className = styles.termLine; term.appendChild(el); return el; };
    const typeLine = () => {
      if (cancelled) return;
      if (li >= LINES.length) {
        const cur = document.createElement("span"); cur.className = styles.cursor;
        make().appendChild(cur); return;
      }
      const spec = LINES[li]!;
      const el = make();
      el.innerHTML = spec.html;
      if (spec.instant || !spec.cmd) { li++; setTimeout(typeLine, 360); return; }
      const cmdSpan = document.createElement("span"); cmdSpan.className = "cmd"; el.appendChild(cmdSpan);
      let ci = 0;
      const typeChar = () => {
        if (cancelled) return;
        if (ci <= spec.cmd.length) { cmdSpan.textContent = spec.cmd.slice(0, ci); ci++; setTimeout(typeChar, spec.delay); }
        else { li++; setTimeout(typeLine, 420); }
      };
      typeChar();
    };
    const t = setTimeout(typeLine, 700);
    return () => { cancelled = true; clearTimeout(t); term.innerHTML = ""; };
  }, []);
  return <div ref={ref} className={styles.termBody} id="term-body" />;
}
```

> Nota: las clases `prompt/path/cmd/out/ok/key` se definen en `Hero.module.css` con la sintaxis `:global(.prompt)` ya que se inyectan vía innerHTML.

- [ ] **Step 5: `Hero.tsx` (server)**

```tsx
import { getTranslations } from "next-intl/server";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { StatCounter } from "./StatCounter";
import { Terminal } from "./Terminal";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Link } from "@/lib/i18n/routing";
import styles from "./Hero.module.css";

export async function Hero() {
  const t = await getTranslations("hero");
  return (
    <section className={styles.hero} data-screen-label="Hero">
      <div className={`wrap ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <RevealOnScroll><AvailabilityBadge /></RevealOnScroll>
          <RevealOnScroll as="h1" delay={1} className={styles.heroH1}>
            <span>{t("h1a")}</span>{" "}
            <span className="gradient-text">{t("h1b")}</span>
          </RevealOnScroll>
          <RevealOnScroll delay={2}>
            <p className={styles.lead}>{t.rich("lead", { strong: (c) => <strong>{c}</strong> })}</p>
          </RevealOnScroll>
          <RevealOnScroll delay={3}>
            <div className={styles.heroCta}>
              <Link href="/#services" className="btn btn-primary">{t("cta1")}</Link>
              <Link href="/#contact" className="btn btn-ghost">{t("cta2")} ↗</Link>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={4}>
            <div className={styles.heroStats}>
              <div className={styles.stat}><StatCounter target={8} suffix="+" /><div className={styles.label}>{t("stat1.l")}</div></div>
              <div className={styles.stat}><StatCounter target={12} suffix="+" /><div className={styles.label}>{t("stat2.l")}</div></div>
              <div className={styles.stat}><div className="num">CCNA</div><div className={styles.label}>{t("stat3.l")}</div></div>
            </div>
          </RevealOnScroll>
        </div>
        <RevealOnScroll delay={2} className={styles.heroVisual}>
          <div className={styles.terminal}>
            <div className={styles.termBar}>
              <span className={`${styles.tdot} ${styles.r}`} />
              <span className={`${styles.tdot} ${styles.y}`} />
              <span className={`${styles.tdot} ${styles.g}`} />
              <span className={styles.title}>villadev@sec — zsh</span>
            </div>
            <Terminal />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero/ && git commit -m "feat(hero): Hero with availability badge, animated counters, terminal typing"
```

---

### Tarea D4: Services (con glow pointermove)

**Files:**
- Create: `src/components/Services/Services.tsx`, `src/components/Services/Services.module.css`, `src/components/Services/ServiceCard.tsx`, `src/components/Services/icons.tsx`

- [ ] **Step 1: CSS** — portar `.services-grid`/`.service`/`.service::before`/`.service .ico`/`.service .tags` de `styles.css` líneas 401-452.

- [ ] **Step 2: `icons.tsx`** — exportar 4 SVGs (code, automation, shield, spark) iguales a los del prototipo (líneas 115-142 de `Portafolio.html`).

- [ ] **Step 3: `ServiceCard.tsx` (client, pointermove)**

```tsx
"use client";
import { useRef, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { Service } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { icons } from "./icons";
import styles from "./Services.module.css";

export function ServiceCard({ service }: { service: Service }) {
  const t = useTranslations("services");
  const ref = useRef<HTMLElement | null>(null);
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  };
  const Icon = icons[service.icon];
  return (
    <article ref={ref} className={styles.service} onPointerMove={onMove}>
      <span className={styles.idx}>{service.index}</span>
      <div className={styles.ico}><Icon /></div>
      <h3>{t(service.titleKey)}</h3>
      <p>{t(service.descKey)}</p>
      <div className={styles.tags}>
        {service.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: `Services.tsx` (server)**

```tsx
import { getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { ServiceCard } from "./ServiceCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Eyebrow } from "@/components/ui/Eyebrow";
import styles from "./Services.module.css";

export async function Services() {
  const t = await getTranslations("services");
  return (
    <section className="section" id="services">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles.servicesGrid}>
          {services.map((s, i) => (
            <RevealOnScroll key={s.id} delay={(i % 2) as 0 | 1}>
              <ServiceCard service={s} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Services/ && git commit -m "feat(services): Services section with pointer-glow service cards"
```

---

### Tarea D5: About (foto neon, scan line, esquinas, facts)

**Files:**
- Create: `src/components/About/About.tsx`, `src/components/About/About.module.css`
- Move: `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/assets/profile.jpeg` → `public/profile.jpeg`

- [ ] **Step 1: Copiar foto**

```bash
cp ~/Documents/Claude/Projects/design_handoff_villadev_portfolio/design/assets/profile.jpeg public/profile.jpeg
```

- [ ] **Step 2: CSS** — portar `.about-grid`/`.about-photo .frame`/`.about-photo .profile-img`/`.scan`/`.corner.*`/`.about-body`/`.about-facts` de `styles.css` líneas 457-516.

- [ ] **Step 3: Component (server)**

```tsx
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./About.module.css";

export async function About() {
  const t = await getTranslations("about");
  const facts = ["f1", "f2", "f3", "f4"] as const;
  return (
    <section className="section" id="about">
      <div className={`wrap ${styles.aboutGrid}`}>
        <RevealOnScroll className={styles.aboutPhoto}>
          <div className={styles.frame}>
            <Image src="/profile.jpeg" alt="Jimmy Villacis" width={460} height={575} className={styles.profileImg} priority />
            <div className={styles.scan} />
            <span className={`${styles.corner} ${styles.c1}`} />
            <span className={`${styles.corner} ${styles.c2}`} />
            <span className={`${styles.corner} ${styles.c3}`} />
            <span className={`${styles.corner} ${styles.c4}`} />
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={1} className={styles.aboutBody}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t.rich("p1", { strong: (c) => <strong>{c}</strong> })}</p>
          <p>{t.rich("p2", { strong: (c) => <strong>{c}</strong> })}</p>
          <div className={styles.aboutFacts}>
            {facts.map((f) => (
              <div key={f} className={styles.fact}>
                <div className={styles.k}>{t(`facts.${f}k`)}</div>
                <div className={styles.v}>{t(`facts.${f}v`)}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add public/profile.jpeg src/components/About/ && git commit -m "feat(about): About section with profile photo, scan line, facts"
```

---

### Tarea D6: ProjectCard reutilizable

**Files:**
- Create: `src/components/Projects/ProjectCard.tsx`, `src/components/Projects/Projects.module.css`

- [ ] **Step 1: CSS** — portar `.proj-grid`/`.proj`/`.proj .thumb`/`.proj .dots`/`.proj .glyph`/`.proj .body`/`.proj .status`/`.proj .link`/`.proj-viewall`/`.proj.hide`/`.proj-filter` de `styles.css` líneas 521-607.

- [ ] **Step 2: `ProjectCard.tsx`**

```tsx
import { useTranslations } from "next-intl";
import type { Project } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import styles from "./Projects.module.css";

export function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations("projects");
  const live = project.status === "live";
  const Wrapper: any = project.url ? "a" : "div";
  const linkProps = project.url
    ? { href: project.url, target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <Wrapper
      className={`${styles.proj} ${live ? styles.live : ""}`}
      data-cat={project.category}
      {...linkProps}
    >
      <div className={styles.thumb}>
        <div className={styles.dots} />
        <div className={styles.glyph}>{project.glyph}</div>
      </div>
      <div className={styles.body}>
        <span className={styles.status}><span className={styles.dotMark}>●</span> {t(project.statusKey)}</span>
        <h3>{t(project.titleKey)}</h3>
        <p>{t(project.descKey)}</p>
        <div className={styles.tags}>{project.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>
        <span className={styles.link}>{t(project.linkKey)} {project.url ? "↗" : ""}</span>
      </div>
    </Wrapper>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Projects/ && git commit -m "feat(projects): ProjectCard + projects CSS module"
```

---

### Tarea D7: ProjectsSection (home, sólo featured)

**Files:**
- Create: `src/components/Projects/ProjectsSection.tsx`

- [ ] **Step 1: Component (server)**

```tsx
import { getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { Link } from "@/lib/i18n/routing";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Projects.module.css";

export async function ProjectsSection() {
  const t = await getTranslations("projects");
  const featured = projects.filter((p) => p.featured);
  return (
    <section className="section" id="projects">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles.projGrid}>
          {featured.map((p, i) => (
            <RevealOnScroll key={p.id} delay={(i % 3) as 0 | 1 | 2}>
              <ProjectCard project={p} />
            </RevealOnScroll>
          ))}
        </div>
        <RevealOnScroll className={styles.projViewall}>
          <Link href="/proyectos" className="btn btn-ghost">{t("viewall")} ↗</Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Projects/ProjectsSection.tsx && git commit -m "feat(projects): ProjectsSection on home (featured only)"
```

---

### Tarea D8: Experience (timeline)

**Files:**
- Create: `src/components/Experience/Experience.tsx`, `src/components/Experience/Experience.module.css`

- [ ] **Step 1: CSS** — portar `.timeline`/`.tl-item`/`.tl-item .node`/`.tl-item.now .node`/`.tl-head`/`.tl-when` de `styles.css` líneas 612-635.

- [ ] **Step 2: Component**

```tsx
import { getTranslations } from "next-intl/server";
import { experience } from "@/content/experience";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Experience.module.css";

export async function Experience() {
  const t = await getTranslations("experience");
  return (
    <section className="section" id="experience">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles.timeline}>
          {experience.map((item) => (
            <RevealOnScroll key={item.id} className={`${styles.tlItem} ${item.current ? styles.now : ""}`}>
              <span className={styles.node} />
              <div className={styles.tlHead}>
                <h3>{t(item.roleKey)}</h3>
                <span className={styles.co}>— {t(item.coKey)}</span>
                <span className={styles.tlWhen}>{t(item.whenKey)}</span>
              </div>
              <p>{t(item.descKey)}</p>
              <div className={styles.chips}>
                {item.chips.map((c) => <span key={c}>{c}</span>)}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Experience/ && git commit -m "feat(experience): vertical timeline with current-job highlight"
```

---

### Tarea D9: Certifications

**Files:**
- Create: `src/components/Certifications/Certifications.tsx`, `src/components/Certifications/Certifications.module.css`

- [ ] **Step 1: CSS** — portar `.cert-grid`/`.cert`/`.cert .yr`/`.cert .yr.live`/`.cert .info .name`/`.cert .info .iss` de `styles.css` líneas 640-667.

- [ ] **Step 2: Component**

```tsx
import { getTranslations } from "next-intl/server";
import { certifications } from "@/content/certifications";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Certifications.module.css";

export async function Certifications() {
  const t = await getTranslations("certs");
  return (
    <section className="section" id="certs">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <RevealOnScroll className={styles.certGrid}>
          {certifications.map((c) => (
            <div key={c.id} className={styles.cert}>
              <span className={`${styles.yr} ${c.ongoing ? styles.live : ""}`}>{c.year}</span>
              <div className={styles.info}>
                <div className={styles.name}>{c.name}</div>
                <div className={styles.iss}>{c.issuer}</div>
              </div>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Certifications/ && git commit -m "feat(certs): Certifications grid"
```

---

### Tarea D10: Skills

**Files:**
- Create: `src/components/Skills/Skills.tsx`, `src/components/Skills/Skills.module.css`

- [ ] **Step 1: CSS** — portar `.skills-grid`/`.skill-cat`/`.skill-cat .ch`/`.skill-desc` de `styles.css` líneas 672-701.

- [ ] **Step 2: Component**

```tsx
import { getTranslations } from "next-intl/server";
import { skillCategories } from "@/content/skills";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Skills.module.css";

export async function Skills() {
  const t = await getTranslations("skills");
  return (
    <section className="section" id="skills">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles.skillsGrid}>
          {skillCategories.map((s, i) => (
            <RevealOnScroll key={s.id} delay={(i % 3) as 0 | 1 | 2} className={styles.skillCat}>
              <div className={styles.ch}><span>{t(s.labelKey)}</span><span className={styles.ln} /></div>
              <p className={styles.skillDesc}>{t(s.descKey)}</p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Skills/ && git commit -m "feat(skills): Skills section"
```

---

### Tarea D11: Página Home (ensamblar todas las secciones)

**Files:**
- Create: `src/app/[locale]/(public)/page.tsx`, `src/app/[locale]/(public)/layout.tsx`

- [ ] **Step 1: `(public)/layout.tsx`** — incluye Navbar, NetworkCanvas y Footer alrededor de los children.

```tsx
import { Navbar } from "@/components/Navbar/Navbar";
import { Footer } from "@/components/Footer/Footer";
import { NetworkCanvas } from "@/components/NetworkCanvas/NetworkCanvas";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NetworkCanvas />
      <Navbar />
      <main className="shell" id="top">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: `(public)/page.tsx`**

```tsx
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/Hero/Hero";
import { Services } from "@/components/Services/Services";
import { About } from "@/components/About/About";
import { ProjectsSection } from "@/components/Projects/ProjectsSection";
import { Experience } from "@/components/Experience/Experience";
import { Certifications } from "@/components/Certifications/Certifications";
import { Skills } from "@/components/Skills/Skills";
import { Contact } from "@/components/Contact/Contact"; // creado en Fase F
import type { Locale } from "@/lib/i18n/config";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <Services />
      <About />
      <ProjectsSection />
      <Experience />
      <Certifications />
      <Skills />
      <Contact />
    </>
  );
}
```

> El import de `Contact` provocará error de compilación hasta completar Fase F — está bien, lo crearemos en F4. Para no romper el build ahora, comentar la línea de `import` y la línea `<Contact />` y descomentar al final de F4.

- [ ] **Step 3: Verificar dev**

```bash
npm run dev
```

Abrir `http://127.0.0.1:3000/es` y `http://127.0.0.1:3000/en`. Verificar que cada sección renderiza sin errores en la consola del navegador (excepto los aún por completar).

- [ ] **Step 4: Commit**

```bash
git add src/app/ && git commit -m "feat(home): assemble Home page with all section components"
```

---

## Fase E — Catálogo de proyectos + filtro

### Tarea E1: ProjectsFilter (client) + página catálogo

**Files:**
- Create: `src/components/Projects/ProjectsFilter.tsx`, `src/app/[locale]/(public)/proyectos/page.tsx`

- [ ] **Step 1: `ProjectsFilter.tsx`** — botones que reescriben `?cat=`

```tsx
"use client";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/lib/i18n/routing";
import { useSearchParams } from "next/navigation";
import styles from "./Projects.module.css";

const CATS = ["all", "web", "auto", "sec"] as const;
type Cat = (typeof CATS)[number];

export function ProjectsFilter() {
  const t = useTranslations("filter");
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active = (sp.get("cat") ?? "all") as Cat;
  const setCat = (c: Cat) => {
    const next = c === "all" ? "" : `?cat=${c}`;
    router.replace(`${pathname}${next}`);
  };
  return (
    <div className={styles.projFilter}>
      {CATS.map((c) => (
        <button key={c} className={c === active ? styles.active : ""} onClick={() => setCat(c)}>
          {t(c)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `proyectos/page.tsx`**

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import type { ProjectCategory } from "@/content/types";
import { ProjectCard } from "@/components/Projects/ProjectCard";
import { ProjectsFilter } from "@/components/Projects/ProjectsFilter";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Link } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";
import styles from "@/components/Projects/Projects.module.css";

type SP = { cat?: string };
const VALID: readonly ProjectCategory[] = ["web", "auto", "sec"];

export default async function ProyectosPage({
  params, searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const { cat } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("projpage");
  const active = (cat && (VALID as readonly string[]).includes(cat) ? cat : "all") as ProjectCategory | "all";
  const filtered = active === "all" ? projects : projects.filter((p) => p.category === active);
  return (
    <section className="section page-head">
      <div className="wrap">
        <Link href="/" className={`${styles.back}`}>← {t("back")}</Link>
        <div className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </div>
        <ProjectsFilter />
        <div className={`${styles.projGrid} ${styles.all}`}>
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

```bash
npm run dev
```

- Visitar `http://127.0.0.1:3000/es/proyectos` → ver los 3 proyectos.
- Click en "Automatización" → URL pasa a `?cat=auto`, sólo el card n8n queda visible.
- Click en "Todos" → todos vuelven.

- [ ] **Step 4: Commit**

```bash
git add src/app/ src/components/Projects/ProjectsFilter.tsx && git commit -m "feat(catalog): proyectos page with category filter via query param"
```

---

### Tarea E2: E2E test del filtro

**Files:**
- Create: `tests/e2e/catalog.spec.ts`

- [ ] **Step 1: Test**

```typescript
import { test, expect } from "@playwright/test";

test("catalog filters by category via query param", async ({ page }) => {
  await page.goto("/es/proyectos");
  await expect(page.locator('[data-cat]')).toHaveCount(3);

  await page.getByRole("button", { name: "Automatización" }).click();
  await expect(page).toHaveURL(/cat=auto/);
  await expect(page.locator('[data-cat]')).toHaveCount(1);

  await page.getByRole("button", { name: "Todos" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
  await expect(page.locator('[data-cat]')).toHaveCount(3);
});
```

- [ ] **Step 2: Correr**

```bash
npm run build && npm run test:e2e -- catalog
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/catalog.spec.ts && git commit -m "test(e2e): catalog filter by query param"
```

---

## Fase F — Formulario de contacto

### Tarea F1: Schema Zod del contacto (TDD)

**Files:**
- Create: `src/lib/schemas/contact.ts`, `src/lib/schemas/contact.test.ts`

- [ ] **Step 1: Test failing**

```typescript
import { describe, it, expect } from "vitest";
import { ContactSchema } from "./contact";

describe("ContactSchema", () => {
  const ok = { name: "Jimmy", email: "a@b.cl", subject: "proyecto", message: "Hola, me interesa ya mismo, gracias!" };

  it("accepts valid input", () => {
    const r = ContactSchema.safeParse(ok);
    expect(r.success).toBe(true);
  });
  it("rejects short name", () => { expect(ContactSchema.safeParse({ ...ok, name: "a" }).success).toBe(false); });
  it("rejects bad email", () => { expect(ContactSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false); });
  it("rejects unknown subject", () => { expect(ContactSchema.safeParse({ ...ok, subject: "spam" }).success).toBe(false); });
  it("rejects short message", () => { expect(ContactSchema.safeParse({ ...ok, message: "short" }).success).toBe(false); });
  it("rejects honeypot with value", () => { expect(ContactSchema.safeParse({ ...ok, hp: "im a bot" }).success).toBe(false); });
  it("accepts empty honeypot", () => { expect(ContactSchema.safeParse({ ...ok, hp: "" }).success).toBe(true); });
});
```

- [ ] **Step 2: Implementar**

```typescript
import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  subject: z.enum(["proyecto", "consultoria", "colaboracion", "otro"]),
  message: z.string().trim().min(20).max(2000),
  hp: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;
```

- [ ] **Step 3: Verificar y commit**

```bash
npm test -- contact
git add src/lib/schemas/contact.ts src/lib/schemas/contact.test.ts && git commit -m "feat(schemas): ContactSchema with honeypot (tested)"
```

---

### Tarea F2: Cliente Resend (TDD con mock)

**Files:**
- Create: `src/lib/email/resend.ts`, `src/lib/email/resend.test.ts`

- [ ] **Step 1: Instalar Resend SDK**

```bash
npm i resend
```

- [ ] **Step 2: Test (mock del SDK)**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

import { sendContactEmail } from "./resend";

describe("sendContactEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "to@example.com";
    process.env.CONTACT_FROM_EMAIL = "contacto@example.com";
    process.env.CONTACT_FROM_NAME = "VillaDev";
  });

  it("calls Resend with sanitized fields", async () => {
    sendMock.mockResolvedValue({ data: { id: "x" }, error: null });
    const r = await sendContactEmail({
      name: "  Jimmy  ", email: "a@b.cl", subject: "proyecto",
      message: "Hola, necesito una app web con login.",
    });
    expect(r.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0]![0];
    expect(call.to).toEqual(["to@example.com"]);
    expect(call.replyTo).toBe("a@b.cl");
    expect(call.subject).toMatch(/\[Portafolio\]/);
  });

  it("returns ok=false on provider error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: "x", message: "boom" } });
    const r = await sendContactEmail({
      name: "Jimmy", email: "a@b.cl", subject: "otro", message: "x".repeat(30),
    });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 3: Implementar**

```typescript
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import type { ContactInput } from "@/lib/schemas/contact";

let client: Resend | null = null;
function get(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  client = new Resend(key);
  return client;
}

const SUBJECT_LABEL: Record<ContactInput["subject"], string> = {
  proyecto: "Desarrollo de aplicación web",
  consultoria: "Automatización con n8n",
  colaboracion: "Seguridad / auditoría",
  otro: "Otro",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function sendContactEmail(input: ContactInput): Promise<{ ok: boolean }> {
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  const fromName = process.env.CONTACT_FROM_NAME ?? "VillaDev";
  if (!to || !from) {
    logger.error("contact email env missing");
    return { ok: false };
  }
  const subj = `[Portafolio] ${SUBJECT_LABEL[input.subject]} — ${input.name.trim()}`;
  const html = `<p><strong>De:</strong> ${escapeHtml(input.name.trim())} &lt;${escapeHtml(input.email)}&gt;</p>
<p><strong>Asunto:</strong> ${escapeHtml(SUBJECT_LABEL[input.subject])}</p>
<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(input.message.trim())}</pre>`;
  const { error } = await get().emails.send({
    from: `${fromName} <${from}>`,
    to: [to],
    replyTo: input.email,
    subject: subj,
    html,
  });
  if (error) { logger.error({ err: error.message }, "resend send failed"); return { ok: false }; }
  return { ok: true };
}
```

- [ ] **Step 4: Verificar y commit**

```bash
npm test -- resend
git add src/lib/email/ package.json package-lock.json && git commit -m "feat(email): Resend client wrapper for contact form (tested)"
```

---

### Tarea F3: Server Action de contacto (TDD)

**Files:**
- Create: `src/server-actions/contact.ts`, `src/server-actions/contact.test.ts`

- [ ] **Step 1: Test (mocks de rate-limit + sendContactEmail)**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/email/resend", () => ({ sendContactEmail: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({ get: (k: string) => k.toLowerCase() === "x-forwarded-for" ? "1.2.3.4" : null })),
}));

import { sendContactEmail } from "@/lib/email/resend";
import { __resetRateLimitForTests, submitContact } from "./contact";

const fd = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
};

const valid = { name: "Jimmy", email: "a@b.cl", subject: "proyecto", message: "Hola, esto es un mensaje suficientemente largo." };

describe("submitContact", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
    process.env.TRUSTED_PROXY = "nginx";
    process.env.CONTACT_RATE_MAX = "3";
    process.env.CONTACT_RATE_WINDOW = "600";
    (sendContactEmail as any).mockReset();
    (sendContactEmail as any).mockResolvedValue({ ok: true });
  });

  it("rejects invalid input", async () => {
    const r = await submitContact(undefined, fd({ ...valid, email: "bad" }));
    expect(r.ok).toBe(false);
    expect(r.error).toBe("validation");
  });
  it("rejects honeypot", async () => {
    const r = await submitContact(undefined, fd({ ...valid, hp: "bot" }));
    expect(r.ok).toBe(false);
  });
  it("sends email on success", async () => {
    const r = await submitContact(undefined, fd(valid));
    expect(r.ok).toBe(true);
    expect(sendContactEmail).toHaveBeenCalledOnce();
  });
  it("rate-limits the 4th attempt", async () => {
    for (let i = 0; i < 3; i++) await submitContact(undefined, fd(valid));
    const r = await submitContact(undefined, fd(valid));
    expect(r.ok).toBe(false);
    expect(r.error).toBe("rate_limit");
  });
  it("returns internal error if provider fails", async () => {
    (sendContactEmail as any).mockResolvedValue({ ok: false });
    const r = await submitContact(undefined, fd(valid));
    expect(r.ok).toBe(false);
    expect(r.error).toBe("internal");
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
"use server";
import { headers } from "next/headers";
import { ContactSchema } from "@/lib/schemas/contact";
import { sendContactEmail } from "@/lib/email/resend";
import { createRateLimiter } from "@/lib/rate-limit";
import { getClientIp, type ProxyMode } from "@/lib/client-ip";
import { logger } from "@/lib/logger";

let limiter = createRateLimiter({
  max: Number(process.env.CONTACT_RATE_MAX ?? 5),
  windowMs: Number(process.env.CONTACT_RATE_WINDOW ?? 600) * 1000,
});

export function __resetRateLimitForTests() {
  limiter = createRateLimiter({
    max: Number(process.env.CONTACT_RATE_MAX ?? 5),
    windowMs: Number(process.env.CONTACT_RATE_WINDOW ?? 600) * 1000,
  });
}

export type ContactState =
  | { ok: true }
  | { ok: false; error: "validation" | "rate_limit" | "internal"; fields?: Record<string, string[]> };

export async function submitContact(_prev: ContactState | undefined, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    logger.info({ kind: "contact.validation_error" }, "contact validation");
    return { ok: false, error: "validation", fields: parsed.error.flatten().fieldErrors as any };
  }
  const ip = getClientIp(await headers(), (process.env.TRUSTED_PROXY as ProxyMode) ?? "nginx");
  const r = limiter.check(`contact:${ip}`);
  if (!r.allowed) {
    logger.warn({ ip: "*masked*", retry: r.retryAfterSeconds }, "contact rate-limited");
    return { ok: false, error: "rate_limit" };
  }
  const sent = await sendContactEmail(parsed.data);
  if (!sent.ok) return { ok: false, error: "internal" };
  logger.info({ kind: "contact.sent", len: parsed.data.message.length }, "contact ok");
  return { ok: true };
}
```

- [ ] **Step 3: Verificar y commit**

```bash
npm test -- contact
git add src/server-actions/ && git commit -m "feat(actions): submitContact server action with validation, rate limit, honeypot"
```

---

### Tarea F4: UI del formulario de contacto

**Files:**
- Create: `src/components/Contact/Contact.tsx`, `src/components/Contact/ContactForm.tsx`, `src/components/Contact/Contact.module.css`

- [ ] **Step 1: CSS** — portar `.contact-grid`/`.contact-body`/`.contact-list`/`.form-card`/`.field`/`.form-note` de `styles.css` líneas 706-768.

- [ ] **Step 2: `ContactForm.tsx` (client, `useActionState`)**

> Next 15 + React 19: usar `useActionState` desde `react` (no `useFormState` de `react-dom`, que está deprecado). `useFormStatus` sí se mantiene en `react-dom`.

```tsx
"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { submitContact, type ContactState } from "@/server-actions/contact";
import styles from "./Contact.module.css";

function Submit() {
  const t = useTranslations("form");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      <span>{pending ? t("states.submitting") : t("send")}</span> <span>↗</span>
    </button>
  );
}

export function ContactForm() {
  const t = useTranslations("form");
  const [state, action] = useActionState<ContactState | undefined, FormData>(submitContact, undefined);
  return (
    <form className={styles.formCard} action={action} noValidate>
      <input type="text" name="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      <div className={styles.field}>
        <label htmlFor="c-name">{t("name")}</label>
        <input id="c-name" name="name" required minLength={2} maxLength={80} placeholder={t("namePh")} />
      </div>
      <div className={styles.field}>
        <label htmlFor="c-email">{t("email")}</label>
        <input id="c-email" name="email" type="email" required maxLength={120} placeholder={t("emailPh")} />
      </div>
      <div className={styles.field}>
        <label htmlFor="c-subject">{t("subject")}</label>
        <select id="c-subject" name="subject" defaultValue="proyecto">
          <option value="proyecto">{t("opts.proyecto")}</option>
          <option value="consultoria">{t("opts.consultoria")}</option>
          <option value="colaboracion">{t("opts.colaboracion")}</option>
          <option value="otro">{t("opts.otro")}</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="c-message">{t("message")}</label>
        <textarea id="c-message" name="message" rows={4} required minLength={20} maxLength={2000} placeholder={t("messagePh")} />
      </div>
      <Submit />
      {state?.ok === true && <div className={styles.formNote} role="status">{t("states.success")}</div>}
      {state?.ok === false && state.error === "rate_limit" && <div className={styles.formNote} role="alert">{t("states.rateLimit")}</div>}
      {state?.ok === false && state.error === "validation" && <div className={styles.formNote} role="alert">{t("states.validation")}</div>}
      {state?.ok === false && state.error === "internal" && <div className={styles.formNote} role="alert">{t("states.error")}</div>}
    </form>
  );
}
```

- [ ] **Step 3: `Contact.tsx` (server)** — combina la lista de contactos + el formulario.

```tsx
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ContactForm } from "./ContactForm";
import styles from "./Contact.module.css";

export async function Contact() {
  const t = await getTranslations("contact");
  return (
    <section className="section" id="contact">
      <div className={`wrap ${styles.contactGrid}`}>
        <RevealOnScroll className={styles.contactBody}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
          <div className={styles.contactList}>
            <a href="mailto:villacis.j@icloud.com"><span className={styles.cl}>Correo</span><span className={styles.cv}>villacis.j@icloud.com</span></a>
            <a href="https://www.linkedin.com/in/jimmy-villacis/" target="_blank" rel="noopener noreferrer"><span className={styles.cl}>LinkedIn</span><span className={styles.cv}>in/jimmy-villacis</span></a>
            <a href="https://villacisjimmy.github.io/blog/" target="_blank" rel="noopener noreferrer"><span className={styles.cl}>Blog</span><span className={styles.cv}>villacisjimmy.github.io</span></a>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={1}><ContactForm /></RevealOnScroll>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Descomentar `Contact` en `(public)/page.tsx`** (D11 lo dejó comentado). Verificar:

```bash
npm run typecheck && npm run dev
```

Visitar `/es`, scrollear al form, intentar enviar con datos válidos (sin `RESEND_API_KEY` real → `error: internal`). Confirmar que ese estado aparece.

- [ ] **Step 5: Commit**

```bash
git add src/components/Contact/ src/app/ && git commit -m "feat(contact): Contact form UI with useFormState + honeypot"
```

---

### Tarea F5: Guía manual — Crear cuenta Resend y obtener API key

> **Esta tarea NO requiere editar código. Es para que tú (usuario) ejecutes los pasos físicos y dejes el valor en `.env` local.**

- [ ] **Step 1: Crear cuenta Resend**
  - Ir a `https://resend.com/signup`.
  - Registrarse con `g.villacis.jimmy@gmail.com` (o el correo que prefieras).
  - Verificar el correo.

- [ ] **Step 2: Verificar tu dominio (`villadev.<tld>`) en Resend**
  - En el panel: **Domains → Add Domain → `villadev.<tld>`**.
  - Resend mostrará registros DNS (SPF, DKIM, DMARC). Anótalos.
  - En tu proveedor DNS (Cloudflare o donde tengas las zonas), agregar esos registros TXT/CNAME tal cual.
  - Volver a Resend y pulsar **Verify** hasta que los 3 queden en verde (puede tomar minutos).
  - **Si aún no decides el TLD del dominio** (placeholder `<TLD>` del spec), pausar esta tarea hasta tener el dominio registrado y apuntado.

- [ ] **Step 3: Crear API Key**
  - **API Keys → Create API Key**.
  - Nombre: `villadev-portfolio-prod`.
  - Permission: **Sending access** (no Full access).
  - Domain: el dominio recién verificado.
  - Copiar la key mostrada (empieza con `re_...`). **Sólo se muestra una vez.**

- [ ] **Step 4: Pegar la key en `.env` LOCAL (no en el repo, no en chat)**

  En tu equipo (no enviar a Claude):
  ```bash
  cp .env.example .env
  $EDITOR .env
  ```
  Reemplazar `RESEND_API_KEY=re_REPLACE_ME` por el valor real. También fijar `CONTACT_FROM_EMAIL=contacto@<tu-dominio>` (debe ser del dominio verificado).

  Permisos:
  ```bash
  chmod 600 .env
  ```

- [ ] **Step 5: Smoke local del envío real**
  ```bash
  npm run dev
  ```
  Llenar el form y enviar. Verificar que llega a `CONTACT_TO_EMAIL`. Si no llega:
  - Revisar el dashboard de Resend → Logs.
  - Confirmar que el dominio está verificado.

- [ ] **Step 6: NO commitear `.env`**

  ```bash
  git status   # debe NO listar .env
  ```

> La misma key se duplicará en el `.env` del VPS (tarea J6). En GitHub Actions no se necesita — el deploy sólo copia el binario.

---

### Tarea F6: E2E del formulario de contacto

**Files:**
- Create: `tests/e2e/contact.spec.ts`

- [ ] **Step 1: Test**

```typescript
import { test, expect } from "@playwright/test";

test.describe("contact form", () => {
  test("blocks bot via honeypot", async ({ page }) => {
    await page.goto("/es#contact");
    await page.locator("[name=hp]").fill("bot");
    await page.fill("[name=name]", "Jimmy");
    await page.fill("[name=email]", "test@example.com");
    await page.fill("[name=message]", "Hola, este es un mensaje suficientemente largo para pasar Zod.");
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("rejects invalid email", async ({ page }) => {
    await page.goto("/es#contact");
    await page.fill("[name=name]", "Jimmy");
    await page.fill("[name=email]", "no-es-correo");
    await page.fill("[name=message]", "Hola, este es un mensaje suficientemente largo.");
    await page.getByRole("button", { name: /enviar/i }).click();
    // El form HTML5 puede bloquear antes — aceptamos cualquiera de los dos:
    // - HTML5 validity message, o
    // - alert del server action
    const html5 = await page.locator("[name=email]:invalid").count();
    if (html5 === 0) await expect(page.getByRole("alert")).toBeVisible();
  });
});
```

- [ ] **Step 2: Correr**

```bash
npm run build && npm run test:e2e -- contact
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/contact.spec.ts && git commit -m "test(e2e): contact form honeypot + validation"
```

---

## Fase G — Health endpoint + verificación local

### Tarea G1: `/api/health`

**Files:**
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Implementar**

```typescript
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", uptime: process.uptime(), ts: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
```

- [ ] **Step 2: Verificar**

```bash
npm run dev
curl -s http://127.0.0.1:3000/api/health
```

Esperado: JSON con `"status":"ok"`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ && git commit -m "feat(api): /api/health endpoint"
```

---

### Tarea G2: Smoke E2E end-to-end + screenshot comparison manual

**Files:**
- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Test**

```typescript
import { test, expect } from "@playwright/test";

test("home ES renders all sections", async ({ page }) => {
  await page.goto("/es");
  for (const id of ["services", "about", "projects", "experience", "certs", "skills", "contact"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("lang switch goes EN→ES via URL", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "ES" }).click();
  await expect(page).toHaveURL(/\/es(\/|$)/);
});

test("health endpoint returns 200", async ({ request }) => {
  const r = await request.get("/api/health");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body.status).toBe("ok");
});
```

- [ ] **Step 2: Correr full suite**

```bash
npm run build && npm run test:e2e
```

Esperado: todos los specs pasan.

- [ ] **Step 3: Comparación visual manual contra prototipo**

```bash
npm run dev
```

Abrir las 9 screenshots de `~/Documents/Claude/Projects/design_handoff_villadev_portfolio/screenshots/` y comparar contra el sitio en `http://127.0.0.1:3000/es`. Anotar diferencias menores en `docs/visual-parity.md`; ajustar las que sean obvias antes de continuar.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/home.spec.ts && git commit -m "test(e2e): home sections + lang switch + health"
```

---

## Fase H — Containerización

### Tarea H1: Dockerfile multi-stage no-root

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: `.dockerignore`**

```
node_modules
.next
.git
.github
coverage
playwright-report
test-results
*.log
.env
.env.local
Dockerfile
.dockerignore
docs
tests
deploy
README.md
```

- [ ] **Step 2: `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apk add --no-cache dumb-init wget && \
    addgroup -g 1001 -S nextjs && \
    adduser -u 1001 -S -G nextjs nextjs

COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

USER nextjs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

- [ ] **Step 3: Verificar build**

```bash
docker build -t villadev-portfolio:dev .
```

Esperado: build exitoso. Imagen final < 250MB:

```bash
docker images villadev-portfolio:dev
```

- [ ] **Step 4: Smoke run**

```bash
docker run --rm -p 3001:3000 \
  -e SITE_HOST=localhost -e SITE_ORIGIN=http://localhost:3001 \
  -e AVAILABLE=true -e TRUSTED_PROXY=nginx \
  -e RESEND_API_KEY=re_dummy -e CONTACT_TO_EMAIL=to@example.com \
  -e CONTACT_FROM_EMAIL=contacto@example.com \
  villadev-portfolio:dev
```

En otra terminal:
```bash
curl -s http://127.0.0.1:3001/api/health
```

Detener con `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore && git commit -m "feat(docker): multi-stage non-root Alpine image with standalone output"
```

---

### Tarea H2: `compose.yaml` local + healthcheck

**Files:**
- Create: `compose.yaml`

- [ ] **Step 1: `compose.yaml`** (sólo para desarrollo/staging local — la versión productiva vive en `deploy/compose.prod.yaml` en J5)

```yaml
services:
  app:
    build: .
    image: villadev-portfolio:local
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    user: "1001:1001"
    ports:
      - "127.0.0.1:3001:3000"
    env_file: .env
    mem_limit: 512m
    cpus: "0.5"
    pids_limit: 200
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

- [ ] **Step 2: Verificar**

```bash
docker compose up -d --build
sleep 30
docker compose ps
curl -s http://127.0.0.1:3001/api/health
docker compose down
```

Esperado: status `healthy`, JSON ok.

- [ ] **Step 3: Commit**

```bash
git add compose.yaml && git commit -m "feat(docker): compose.yaml for local hardened run"
```

---

### Tarea H3: Smoke E2E contra el contenedor

- [ ] **Step 1: Arrancar el contenedor**

```bash
docker compose up -d --build
sleep 15
```

- [ ] **Step 2: Correr E2E contra él**

```bash
E2E_BASE_URL=http://127.0.0.1:3001 npm run test:e2e
docker compose down
```

Esperado: todos los E2E pasan contra el binario containerizado (paridad con `next start`).

- [ ] **Step 3: (Sin commit — sólo verificación)**

---

## Fase I — CI/CD en GitHub Actions

### Tarea I1: Workflow de CI (lint, typecheck, tests, security)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: `ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - name: Install deps
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Format check
        run: npm run format:check
      - name: Typecheck
        run: npm run typecheck
      - name: Unit tests
        run: npm run test:coverage
      - name: Build
        run: npm run build

  e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - name: Playwright
        env:
          AVAILABLE: "true"
          TRUSTED_PROXY: nginx
          RESEND_API_KEY: re_dummy_ci
          CONTACT_TO_EMAIL: to@example.com
          CONTACT_FROM_EMAIL: contacto@example.com
          CONTACT_FROM_NAME: VillaDev CI
        run: npm run test:e2e
      - name: Upload playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: npm audit (high+)
        run: npm audit --omit=dev --audit-level=high
      - name: Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: "p/owasp-top-ten p/javascript p/typescript p/react"
```

- [ ] **Step 2: Commit y push (si tienes el remoto configurado — si no, se configura en J7)**

```bash
git add .github/ && git commit -m "ci: add CI workflow (lint, typecheck, tests, e2e, gitleaks, npm audit, semgrep)"
```

---

### Tarea I2: Workflow de CD (build, push GHCR, deploy SSH)

**Files:**
- Create: `.github/workflows/cd.yml`

- [ ] **Step 1: `cd.yml`**

```yaml
name: CD
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

concurrency:
  group: cd-${{ github.ref }}
  cancel-in-progress: false

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    outputs:
      tag: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-,format=short
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/setup-buildx-action@v3
      - name: Build & push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          port: ${{ secrets.VPS_PORT }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -euo pipefail
            cd /srv/villadev
            export TAG="${{ needs.build-and-push.outputs.tag }}"
            ./deploy.sh
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/cd.yml && git commit -m "ci: add CD workflow (GHCR build/push + SSH deploy)"
```

---

### Tarea I3: Guía manual — Configurar secretos de GitHub

> Tarea para que tú la ejecutes desde tu navegador y tu terminal. Ninguno de estos valores pasa por chat.

- [ ] **Step 1: Generar par de claves SSH dedicado al deploy (en tu equipo)**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/villadev_deploy -C "villadev-deploy@github-actions" -N ""
chmod 600 ~/.ssh/villadev_deploy
```

Esto crea `villadev_deploy` (privada, secreta) y `villadev_deploy.pub` (pública).

- [ ] **Step 2: En el VPS — autorizar la pública**

Tras completar Tarea J2 (que crea el usuario `villadev`), desde el VPS:

```bash
sudo -u villadev mkdir -p /home/villadev/.ssh
sudo -u villadev tee -a /home/villadev/.ssh/authorized_keys < ~/villadev_deploy.pub
sudo chmod 700 /home/villadev/.ssh
sudo chmod 600 /home/villadev/.ssh/authorized_keys
```

(Subir la `.pub` al VPS previamente con `scp ~/.ssh/villadev_deploy.pub root@<VPS_IP>:~/`.)

- [ ] **Step 3: Crear el repositorio en GitHub si aún no existe**

```bash
gh repo create villadev-portfolio --private --source . --remote origin --push
```

(Si no tienes `gh` CLI, crear desde la web y agregar el remoto: `git remote add origin git@github.com:<USER>/villadev-portfolio.git && git push -u origin main`.)

- [ ] **Step 4: Cargar los secrets del repositorio en GitHub**

En tu navegador: `https://github.com/<USER>/villadev-portfolio/settings/secrets/actions → New repository secret`. Crear estos 4:

| Nombre | Valor |
|---|---|
| `VPS_HOST` | IP pública del VPS Hostinger |
| `VPS_USER` | `villadev` |
| `VPS_PORT` | el puerto SSH no-estándar elegido en J2 |
| `VPS_SSH_KEY` | contenido COMPLETO de `~/.ssh/villadev_deploy` (incluye `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`) |

> **No pegar estos valores en chat.** Sólo en la pestaña de Secrets de GitHub.

- [ ] **Step 5: Crear environment `production` (opcional pero recomendado)**

`Settings → Environments → New environment → "production"`. Activar "Required reviewers" si quieres que cada deploy te pida confirmación.

- [ ] **Step 6: Verificar el workflow CI tras el primer push**

`https://github.com/<USER>/villadev-portfolio/actions` — debe correr CI y completar verde.

> **CD aún no debe correr exitosamente** hasta tener Fase J completa (VPS preparado). Si CD falla, ignorar por ahora.

---

## Fase J — VPS: bootstrap, Nginx, TLS, deploy

> **Pre-requisito:** un VPS Hostinger Ubuntu 24.04 LTS recién aprovisionado, IP pública, acceso SSH como `root` con password temporal o key inicial. **Antes de empezar: tomar snapshot del VPS en el panel Hostinger.**

### Tarea J1: Guía manual — Acceso inicial al VPS

- [ ] **Step 1: Conectar como root con la credencial inicial de Hostinger**

```bash
ssh root@<VPS_IP>
```

- [ ] **Step 2: Actualizar el sistema**

```bash
apt update && apt -y full-upgrade && apt -y install ufw fail2ban curl ca-certificates gnupg lsb-release apt-transport-https unattended-upgrades wget jq
```

- [ ] **Step 3: Cambiar zona horaria a UTC y configurar locale en-US**

```bash
timedatectl set-timezone UTC
```

- [ ] **Step 4: Reboot si actualizó kernel**

```bash
[ -f /var/run/reboot-required ] && reboot
```

---

### Tarea J2: Bootstrap script idempotente (crear usuario, SSH, UFW, fail2ban, Docker, Nginx, Postgres)

**Files:**
- Create: `deploy/host/bootstrap.sh`

- [ ] **Step 1: Crear el script**

```bash
#!/usr/bin/env bash
# bootstrap.sh — idempotent VPS hardening for villadev portfolio app
# Run as root, once. Re-runs are safe.
set -euo pipefail

APP_USER="${APP_USER:-villadev}"
SSH_PORT="${SSH_PORT:-2222}"
TIMEZONE="${TIMEZONE:-UTC}"

echo "==> apt update + upgrade"
DEBIAN_FRONTEND=noninteractive apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get full-upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ufw fail2ban curl ca-certificates gnupg lsb-release apt-transport-https \
  unattended-upgrades wget jq nginx postgresql logrotate

echo "==> timezone"
timedatectl set-timezone "$TIMEZONE"

echo "==> create app user"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$APP_USER"
  usermod -aG sudo "$APP_USER"
fi
mkdir -p "/home/${APP_USER}/.ssh"
touch "/home/${APP_USER}/.ssh/authorized_keys"
chown -R "${APP_USER}:${APP_USER}" "/home/${APP_USER}/.ssh"
chmod 700 "/home/${APP_USER}/.ssh"
chmod 600 "/home/${APP_USER}/.ssh/authorized_keys"
echo "${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload nginx, /usr/bin/certbot" > /etc/sudoers.d/${APP_USER}-ops
chmod 440 /etc/sudoers.d/${APP_USER}-ops

echo "==> SSH hardening"
SSHCFG=/etc/ssh/sshd_config.d/99-villadev.conf
cat > "$SSHCFG" <<EOF
Port ${SSH_PORT}
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
AllowUsers ${APP_USER}
MaxAuthTries 3
LoginGraceTime 20
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
sshd -t
systemctl reload ssh || systemctl reload sshd

echo "==> UFW"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment "ssh"
ufw allow 80/tcp comment "http"
ufw allow 443/tcp comment "https"
ufw --force enable

echo "==> fail2ban"
cat > /etc/fail2ban/jail.d/villadev.conf <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
maxretry = 4
findtime = 600
bantime = 3600
[nginx-http-auth]
enabled = true
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> unattended-upgrades (security only)"
cat > /etc/apt/apt.conf.d/51unattended-upgrades-security <<'EOF'
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}-security";
  "${distro_id}ESMApps:${distro_codename}-apps-security";
  "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
EOF
systemctl enable --now unattended-upgrades

echo "==> Docker engine"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "userns-remap": "default",
  "live-restore": true,
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" },
  "default-ulimits": { "nofile": { "Name": "nofile", "Soft": 65535, "Hard": 65535 } }
}
EOF
systemctl enable --now docker
systemctl restart docker
usermod -aG docker "$APP_USER"

echo "==> PostgreSQL bound to localhost only (no app DB created — Fase 2)"
sed -i "s/^#*listen_addresses.*/listen_addresses = '127.0.0.1'/" /etc/postgresql/*/main/postgresql.conf
systemctl enable --now postgresql
systemctl restart postgresql

echo "==> /srv/villadev tree"
install -d -o "$APP_USER" -g "$APP_USER" -m 750 /srv/villadev
install -d -o "$APP_USER" -g "$APP_USER" -m 750 /var/backups/villadev

echo "==> done. Reboot recommended if kernel updated."
```

- [ ] **Step 2: Subir el script al VPS y ejecutarlo**

Desde tu equipo:
```bash
scp -P 22 deploy/host/bootstrap.sh root@<VPS_IP>:/root/
ssh root@<VPS_IP>
chmod +x /root/bootstrap.sh
SSH_PORT=<PUERTO_ELEGIDO> APP_USER=villadev /root/bootstrap.sh
```

- [ ] **Step 3: Tras el script — agregar tu SSH key pública del deploy (de Tarea I3) al usuario `villadev` y verificar el nuevo puerto**

```bash
# en el VPS (aún root):
cat ~/villadev_deploy.pub >> /home/villadev/.ssh/authorized_keys
```

Desde tu equipo:
```bash
ssh -p <PUERTO_ELEGIDO> -i ~/.ssh/villadev_deploy villadev@<VPS_IP>
```

Esperado: login exitoso como `villadev`. Si OK, **cerrar la sesión root y NO volver a usar root**.

- [ ] **Step 4: Commit del script al repo**

```bash
git add deploy/host/bootstrap.sh && git commit -m "infra: idempotent VPS bootstrap script (SSH, UFW, fail2ban, Docker, Postgres, Nginx)"
```

---

### Tarea J3: Configuración Nginx para `villadev.<tld>`

**Files:**
- Create: `deploy/nginx/villadev.conf.example`

- [ ] **Step 1: Crear template**

```nginx
# /etc/nginx/sites-available/villadev.conf
# Reverse proxy + TLS termination para el portafolio.

# Real IP detrás de Cloudflare (si lo usas). Si no usas CF, comentar este bloque
# y descomentar el set_real_ip_from del proxy local.
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;

# Rate limit zone para POST a contact (server actions van a /<locale>/...)
limit_req_zone $binary_remote_addr zone=contact:10m rate=10r/m;

# HTTP → HTTPS redirect
server {
  listen 80;
  listen [::]:80;
  server_name villadev.tld www.villadev.tld;
  location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
  location / { return 301 https://villadev.tld$request_uri; }
}

# www → apex
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name www.villadev.tld;
  ssl_certificate     /etc/letsencrypt/live/villadev.tld/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/villadev.tld/privkey.pem;
  return 301 https://villadev.tld$request_uri;
}

# Sitio principal
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name villadev.tld;

  ssl_certificate     /etc/letsencrypt/live/villadev.tld/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/villadev.tld/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/villadev.tld/chain.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;
  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 1.1.1.1 9.9.9.9 valid=300s;

  # Tamaños sensatos
  client_max_body_size 64k;        # form de contacto no necesita más
  client_body_timeout 10s;
  send_timeout 10s;

  # Logs
  access_log /var/log/nginx/villadev_access.log;
  error_log  /var/log/nginx/villadev_error.log warn;

  # Aplicar rate limit al endpoint del form (server action de Next vive en /<locale>)
  location = /api/health {
    proxy_pass http://127.0.0.1:3001;
    access_log off;
  }

  location / {
    # Rate limit suave en POST (Server Actions usan POST a la misma ruta)
    limit_req zone=contact burst=10 nodelay;

    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 30s;
  }
}
```

- [ ] **Step 2: Subirlo al VPS, ajustar dominio, activar**

```bash
scp -P <PUERTO> -i ~/.ssh/villadev_deploy deploy/nginx/villadev.conf.example villadev@<VPS_IP>:/tmp/villadev.conf
ssh -p <PUERTO> -i ~/.ssh/villadev_deploy villadev@<VPS_IP>
sudo sed -i "s/villadev.tld/<TU_DOMINIO>/g" /tmp/villadev.conf
sudo mv /tmp/villadev.conf /etc/nginx/sites-available/villadev.conf
sudo ln -sf /etc/nginx/sites-available/villadev.conf /etc/nginx/sites-enabled/villadev.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/letsencrypt
sudo nginx -t      # debe imprimir "syntax is ok"
```

(El reload se hace después de obtener el cert en J4.)

- [ ] **Step 3: Commit**

```bash
git add deploy/nginx/ && git commit -m "infra(nginx): vhost template for villadev with TLS, rate limit, CF real-ip"
```

---

### Tarea J4: Guía manual — Obtener certificado wildcard con DNS-01

> Esta tarea ocurre 100% en el VPS y en tu DNS provider. Los tokens NO pasan por chat.

- [ ] **Step 1: Confirmar registros DNS** (en Cloudflare o donde administres la zona):
  - `A villadev.<tld> → <VPS_IP>`
  - `A *.villadev.<tld> → <VPS_IP>`
  - `CNAME www → villadev.<tld>`

- [ ] **Step 2: Instalar Certbot + plugin DNS según provider**

Si usas **Cloudflare**:
```bash
ssh -p <PUERTO> -i ~/.ssh/villadev_deploy villadev@<VPS_IP>
sudo apt-get install -y certbot python3-certbot-dns-cloudflare
```

- [ ] **Step 3: Crear API token de Cloudflare con permisos mínimos**

En `https://dash.cloudflare.com/profile/api-tokens → Create Token → Custom token`:
- Permissions: `Zone — DNS — Edit` para tu zona.
- Zone Resources: `Include — Specific zone — villadev.<tld>`.
- TTL: 1 año (renovable).
Copiar el token.

- [ ] **Step 4: Crear el archivo de credenciales en el VPS (no enviar a Claude)**

```bash
sudo install -d -m 700 -o root -g root /etc/letsencrypt/secrets
sudo nano /etc/letsencrypt/secrets/cloudflare.ini
# Contenido (pegar TÚ — no en chat):
#   dns_cloudflare_api_token = <TU_TOKEN>
sudo chmod 600 /etc/letsencrypt/secrets/cloudflare.ini
```

- [ ] **Step 5: Pedir el cert wildcard**

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/secrets/cloudflare.ini \
  -d 'villadev.<tld>' -d '*.villadev.<tld>' \
  -m g.villacis.jimmy@gmail.com --agree-tos --non-interactive --no-eff-email \
  --deploy-hook "systemctl reload nginx"
```

Esperado: cert emitido, fullchain en `/etc/letsencrypt/live/villadev.<tld>/`.

- [ ] **Step 6: Habilitar el timer de renovación**

```bash
sudo systemctl enable --now certbot.timer
sudo systemctl list-timers | grep certbot
```

- [ ] **Step 7: Recargar Nginx**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Verificar (desde fuera):
```bash
curl -sI https://villadev.<tld>/api/health
```
Esperado: 502 todavía (no hay app levantada aún), pero TLS válido (sin warnings de cert).

---

### Tarea J5: `deploy/compose.prod.yaml` y `deploy.sh` en el VPS

**Files:**
- Create: `deploy/compose.prod.yaml`, `deploy/deploy.sh`

- [ ] **Step 1: `deploy/compose.prod.yaml`**

```yaml
services:
  app:
    image: ghcr.io/${GHCR_OWNER}/${GHCR_REPO}:${TAG}
    container_name: villadev-app
    restart: unless-stopped
    pull_policy: always
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    user: "1001:1001"
    networks: [villadev_net]
    ports:
      - "127.0.0.1:3001:3000"
    env_file: /srv/villadev/.env
    mem_limit: 512m
    cpus: "0.5"
    pids_limit: 200
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
networks:
  villadev_net:
    driver: bridge
```

- [ ] **Step 2: `deploy/deploy.sh`**

```bash
#!/usr/bin/env bash
# deploy.sh — pull image + recreate container, runs on the VPS as villadev
set -euo pipefail

cd /srv/villadev

if [ ! -f .env ]; then
  echo "ERROR: /srv/villadev/.env missing"; exit 1
fi

# Defaults para variables del compose
: "${GHCR_OWNER:?GHCR_OWNER required}"
: "${GHCR_REPO:?GHCR_REPO required}"
: "${TAG:=latest}"
export GHCR_OWNER GHCR_REPO TAG

# Login a GHCR si la imagen es privada (token en /srv/villadev/.ghcr_token, mode 600)
if [ -f /srv/villadev/.ghcr_token ]; then
  cat /srv/villadev/.ghcr_token | docker login ghcr.io -u "${GHCR_OWNER}" --password-stdin
fi

docker compose -f compose.yaml pull
docker compose -f compose.yaml up -d --remove-orphans

# Esperar healthy hasta 90s
for i in $(seq 1 30); do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' villadev-app 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then echo "OK"; break; fi
  if [ "$STATUS" = "unhealthy" ]; then echo "FAIL: unhealthy"; docker logs --tail 100 villadev-app; exit 1; fi
  sleep 3
done

docker image prune -af --filter "until=72h" || true
echo "deploy ${TAG} done"
```

- [ ] **Step 3: Subir al VPS y dejarlos en `/srv/villadev/`**

Desde tu equipo:
```bash
scp -P <PUERTO> -i ~/.ssh/villadev_deploy \
  deploy/compose.prod.yaml deploy/deploy.sh \
  villadev@<VPS_IP>:/tmp/

ssh -p <PUERTO> -i ~/.ssh/villadev_deploy villadev@<VPS_IP>
sudo mv /tmp/compose.prod.yaml /srv/villadev/compose.yaml
sudo mv /tmp/deploy.sh /srv/villadev/deploy.sh
sudo chown villadev:villadev /srv/villadev/compose.yaml /srv/villadev/deploy.sh
sudo chmod 750 /srv/villadev/deploy.sh
```

- [ ] **Step 4: Commit**

```bash
git add deploy/compose.prod.yaml deploy/deploy.sh && git commit -m "infra(deploy): production compose + deploy.sh with healthcheck wait"
```

---

### Tarea J6: Guía manual — Crear `/srv/villadev/.env` en el VPS

> Pegas TÚ los valores en el VPS, nunca en chat. Esta es la única fuente de verdad para secretos en producción.

- [ ] **Step 1: Editar el archivo en el VPS**

```bash
ssh -p <PUERTO> -i ~/.ssh/villadev_deploy villadev@<VPS_IP>
nano /srv/villadev/.env
```

Pegar (reemplazando los placeholders con TUS valores):

```dotenv
NODE_ENV=production
PORT=3000
SITE_HOST=villadev.<tld>
SITE_ORIGIN=https://villadev.<tld>
AVAILABLE=true
RESEND_API_KEY=re_<tu-key-de-resend>
CONTACT_TO_EMAIL=villacis.j@icloud.com
CONTACT_FROM_EMAIL=contacto@villadev.<tld>
CONTACT_FROM_NAME=Contacto VillaDev
CONTACT_RATE_MAX=5
CONTACT_RATE_WINDOW=600
TRUSTED_PROXY=cloudflare        # o "nginx" si NO usas Cloudflare
GHCR_OWNER=<TU_USER_GH>
GHCR_REPO=villadev-portfolio
TAG=latest
```

```bash
chmod 600 /srv/villadev/.env
```

- [ ] **Step 2: Si la imagen GHCR es privada — crear token de pull**

En `https://github.com/settings/tokens/new` (classic), scope `read:packages`. Guardarlo en el VPS:

```bash
nano /srv/villadev/.ghcr_token
# pegar SOLO el token; sin saltos de línea
chmod 600 /srv/villadev/.ghcr_token
```

- [ ] **Step 3: Verificar permisos**

```bash
ls -la /srv/villadev/.env /srv/villadev/.ghcr_token
```

Esperado: ambos `-rw------- villadev villadev`.

---

### Tarea J7: Primer deploy manual desde el VPS (sanity check antes de CD)

- [ ] **Step 1: Pull manual + up**

En el VPS:
```bash
cd /srv/villadev
TAG=latest ./deploy.sh
```

> Si CD aún no ha corrido, no habrá imagen en GHCR. En ese caso, hacer **primero** un push manual desde tu equipo:
> ```bash
> docker build -t ghcr.io/<USER>/villadev-portfolio:latest .
> echo <token-read-write> | docker login ghcr.io -u <USER> --password-stdin
> docker push ghcr.io/<USER>/villadev-portfolio:latest
> ```
> (Generar el token de **write:packages** sólo para este paso; eliminarlo después.)

- [ ] **Step 2: Verificar contenedor sano**

```bash
docker ps --filter name=villadev-app
docker inspect --format '{{.State.Health.Status}}' villadev-app
curl -s http://127.0.0.1:3001/api/health
```

- [ ] **Step 3: Verificar desde Internet**

Desde tu equipo:
```bash
curl -sI https://villadev.<tld>/api/health
curl -s  https://villadev.<tld>/api/health
```

Esperado: 200, JSON `{"status":"ok",...}`, header `strict-transport-security`, `x-frame-options: DENY`, `content-security-policy: ...nonce-...`.

- [ ] **Step 4: Test E2E remoto**

Desde tu equipo:
```bash
E2E_BASE_URL=https://villadev.<tld> npm run test:e2e -- home
```

Esperado: home renderiza, lang switch, health 200.

---

### Tarea J8: Backups del `.env` y configuración Nginx (cumple §14 del spec)

**Files (en el VPS):**
- Create: `/srv/villadev/backup.sh`, cron entry

> Fase 1 es stateless: no hay DB de app, pero sí hay configuración irrecuperable si se pierde el VPS (el `.env` con las credenciales y el vhost de Nginx). Backup semanal cifrado a un bucket externo.

- [ ] **Step 1: Crear bucket S3-compatible gratuito** (te guío para que tú lo crees, no enviar credenciales por chat)

Recomendación: **Backblaze B2** (10GB gratis). Alternativas: Cloudflare R2 (10GB gratis), Wasabi (trial 30d).

  - Crear cuenta en `https://www.backblaze.com/sign-up`.
  - Crear bucket privado: `villadev-vps-backups` (region más cercana).
  - Crear "Application Key" con acceso sólo a ese bucket. Anotar `keyID`, `applicationKey`, `endpoint` (`s3.<region>.backblazeb2.com`).

- [ ] **Step 2: Instalar `restic` y configurar en el VPS**

```bash
ssh -p <PUERTO> -i ~/.ssh/villadev_deploy villadev@<VPS_IP>
sudo apt-get install -y restic
sudo install -d -m 700 -o villadev -g villadev /home/villadev/.config/restic
```

Pegar TÚ las credenciales (no en chat):
```bash
nano /home/villadev/.config/restic/env
# contenido:
# export RESTIC_REPOSITORY="s3:https://s3.<region>.backblazeb2.com/villadev-vps-backups/villadev-portfolio"
# export AWS_ACCESS_KEY_ID="<keyID>"
# export AWS_SECRET_ACCESS_KEY="<applicationKey>"
# export RESTIC_PASSWORD="<passphrase fuerte que generes tú>"
chmod 600 /home/villadev/.config/restic/env
```

> Anota el `RESTIC_PASSWORD` en un gestor de contraseñas — sin él los backups son inútiles.

- [ ] **Step 3: Inicializar el repo restic**

```bash
source /home/villadev/.config/restic/env
restic init
```

- [ ] **Step 4: Crear `/srv/villadev/backup.sh`**

```bash
sudo nano /srv/villadev/backup.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail
source /home/villadev/.config/restic/env

TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

# Recoger archivos de configuración (los Nginx requieren root → sudo cp readonly)
sudo cat /srv/villadev/.env > "$TMP/villadev.env"
sudo cat /etc/nginx/sites-available/villadev.conf > "$TMP/villadev.nginx.conf"
sudo tar -C / -czf "$TMP/letsencrypt.tar.gz" etc/letsencrypt/live etc/letsencrypt/renewal etc/letsencrypt/archive

restic backup "$TMP" --tag fase1 --tag villadev
restic forget --tag villadev --keep-daily 7 --keep-weekly 8 --keep-monthly 12 --prune
restic check --read-data-subset=1%
echo "backup ok"
```

```bash
sudo chown villadev:villadev /srv/villadev/backup.sh
sudo chmod 750 /srv/villadev/backup.sh
```

- [ ] **Step 5: Cron semanal (lunes 03:30 UTC)**

```bash
sudo crontab -u villadev -e
# añadir:
# 30 3 * * 1 /srv/villadev/backup.sh >> /var/log/villadev-backup.log 2>&1
```

- [ ] **Step 6: Smoke test**

```bash
/srv/villadev/backup.sh
restic snapshots
```

Esperado: snapshot listado, `check` sin errores.

- [ ] **Step 7: Documentar restore drill en `docs/runbook.md`** (agregar sección dedicada con los pasos exactos para descargar el último snapshot y restaurar `.env` + nginx + letsencrypt en un VPS nuevo).

- [ ] **Step 8: Commit del script y la entrada del runbook al repo**

```bash
git add deploy/host/backup.sh.example docs/runbook.md && git commit -m "infra: weekly encrypted backup of .env + nginx + letsencrypt to restic/B2"
```

> Subir `deploy/host/backup.sh.example` (copia del script real con placeholders en vez de paths reales si difieren) al repo para que sea reproducible.

---

## Fase K — Documentación operativa

### Tarea K1: Threat model

**Files:**
- Create: `docs/threat-model.md`

- [ ] **Step 1: Crear el doc** con: descripción del sistema, trust boundaries (Internet ↔ CF ↔ Nginx ↔ Container ↔ Resend), assets (código, .env, fotos, certs, logs), STRIDE expandido por componente (incluyendo lo que está en §9.2 del spec), controles asociados a cada amenaza, y residual risks aceptados.

Plantilla mínima:

```markdown
# Threat Model — VillaDev Portafolio (Fase 1)

## Sistema y trust boundaries
- Internet (untrusted) → Cloudflare (DDoS/WAF, untrusted-but-mediated) → Nginx en el VPS (TLS termination, trusted) → Contenedor Next.js (trusted, no-root, read-only FS) → Resend API (trusted-3rd-party).
- Sin DB en uso productivo en Fase 1. PostgreSQL instalado pero sin rol/DB de app.

## Assets
- Código fuente y secretos en `.env` (alta sensibilidad).
- Foto de perfil (baja).
- Logs (media — pueden contener IPs y patrones de abuso).
- Cert privada `/etc/letsencrypt/live/.../privkey.pem` (alta).
- Imagen Docker en GHCR (media — pública o privada según repo).

## STRIDE expandido
[matriz por componente con amenaza, vector, control, residual risk]

## Riesgos residuales aceptados Fase 1
- Sin DAST automático (planificado Fase 4).
- Sin firma cosign de imágenes (Fase 4).
- Rate limit en memoria (1 réplica, OK).
```

- [ ] **Step 2: Commit**

```bash
git add docs/threat-model.md && git commit -m "docs: threat model for Fase 1"
```

---

### Tarea K2: Runbook operativo

**Files:**
- Create: `docs/runbook.md`

- [ ] **Step 1: Crear el doc** con secciones:

- **Arrancar / parar la app** (`docker compose up -d`, `down`).
- **Ver logs** (`docker logs villadev-app --tail 200 -f`, `journalctl -u nginx`, `tail -f /var/log/nginx/villadev_*.log`).
- **Deploy manual** (`TAG=sha-xxx ./deploy.sh`).
- **Rollback** (`TAG=sha-anterior ./deploy.sh`).
- **Renovar certificado manualmente** (`certbot renew --dry-run`).
- **Restore del `.env`** desde backup.
- **Diagnóstico común**: 502 → revisar contenedor; 5xx en app → `docker logs`; rate limit no se aplica → `set_real_ip_from` mal configurado.
- **Snapshot del VPS** (cómo tomarlo desde el panel Hostinger).
- **Disable / re-enable site** (mover symlink en `sites-enabled`).

- [ ] **Step 2: Commit**

```bash
git add docs/runbook.md && git commit -m "docs: operational runbook (start/stop/deploy/rollback/cert/restore)"
```

---

### Tarea K3: Guía de secretos para el operador

**Files:**
- Create: `docs/secrets-setup.md`

- [ ] **Step 1: Consolidar** las guías manuales de F5, I3, J4, J6 en un solo documento ordenado:

```markdown
# Secrets setup — VillaDev Portafolio

Todos los secretos los pegas tú directamente en el lugar donde se usan.
**Ningún secreto debe pasar por chat, PRs, issues, o commits.**

## 1. Resend API key
(Ver Fase F5, pasos 1–4.)

## 2. SSH deploy key
(Ver Fase I3, pasos 1–2 + 4.)

## 3. GitHub repo secrets
(Ver Fase I3, paso 4. Lista exacta de los 4 secrets.)

## 4. DNS provider token para Certbot
(Ver Fase J4, pasos 3–4.)

## 5. `/srv/villadev/.env` en el VPS
(Ver Fase J6, paso 1.)

## 6. (Opcional) GHCR pull token si la imagen es privada
(Ver Fase J6, paso 2.)

## Rotación
- Resend key: cada 6 meses o si sospechas filtración. Revoca la anterior tras pegar la nueva.
- SSH deploy key: cada 12 meses. Generar par nuevo, agregar `.pub` al VPS, actualizar GH secret, eliminar la vieja del VPS.
- Cloudflare DNS token: cada 12 meses.
- GHCR pull token: cada 12 meses.

## Auditoría
- Revisar `~/.ssh/authorized_keys` del usuario `villadev` cada trimestre.
- Revisar repo `Settings → Secrets and variables → Actions` cada trimestre.
```

- [ ] **Step 2: Commit**

```bash
git add docs/secrets-setup.md && git commit -m "docs: consolidated secrets setup guide (no values, only procedures)"
```

---

## Fase L — Lanzamiento y verificación

### Tarea L1: Tag de release y push final

- [ ] **Step 1: Verificar todo verde local**

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

- [ ] **Step 2: Crear tag y push**

```bash
git tag -a v0.1.0-fase1 -m "Fase 1 — public site, i18n, contact form, hardened VPS"
git push --tags
git push origin main
```

Esperado: workflows CI y CD pasan en GitHub Actions.

---

### Tarea L2: Smoke en producción

- [ ] **Step 1: Health**

```bash
curl -sI https://villadev.<tld>/api/health
```

Esperado: 200 + JSON.

- [ ] **Step 2: Headers**

```bash
curl -sI https://villadev.<tld>/ | grep -iE 'strict-transport|x-frame|x-content|referrer-policy|content-security|permissions-policy'
```

Esperado: todos presentes, CSP con `nonce-`.

- [ ] **Step 3: SSL Labs A+**

Visitar `https://www.ssllabs.com/ssltest/analyze.html?d=villadev.<tld>&hideResults=on`. Esperado: A+. Si A-, revisar ciphers/HSTS en Nginx.

- [ ] **Step 4: ssh-audit del VPS**

Desde tu equipo:
```bash
docker run --rm positronsecurity/ssh-audit -p <PUERTO> villadev.<tld>
```

Esperado: sin warnings críticos.

- [ ] **Step 5: testssl.sh sobre el sitio**

```bash
docker run --rm -ti drwetter/testssl.sh https://villadev.<tld>
```

Esperado: A+, sin warnings rojos.

- [ ] **Step 6: Formulario real**

Abrir `https://villadev.<tld>/es#contact`, enviar un mensaje real. Verificar:
- llega a `villacis.j@icloud.com`.
- Resend dashboard registra el envío.
- Logs del contenedor muestran `contact.sent`.

- [ ] **Step 7: E2E remoto**

```bash
E2E_BASE_URL=https://villadev.<tld> npm run test:e2e
```

Esperado: todos pasan.

---

### Tarea L3: Snapshot final + actualización del runbook

- [ ] **Step 1: Tomar snapshot del VPS desde el panel Hostinger**

Nombrar: `villadev-portfolio-fase1-launch-<fecha>`.

- [ ] **Step 2: Anotar en `docs/runbook.md`** la fecha del snapshot bajo "Snapshots conocidos buenos".

- [ ] **Step 3: Commit**

```bash
git add docs/runbook.md && git commit -m "docs(runbook): record fase-1 launch snapshot reference"
git push
```

---

### Tarea L4: Revisión post-launch + cierre

- [ ] **Step 1: Recorrer la "Definición de hecho"** del spec (§17) en el orden listado. Marcar cada bullet completado. Si alguno no se cumple, abrir issue en GitHub para resolverlo antes de iniciar Fase 2.

- [ ] **Step 2: Revisar los placeholders del spec §18.1**, confirmar que todos quedaron resueltos. Actualizar el spec si algo cambió respecto al diseño original.

- [ ] **Step 3: Commit final del spec actualizado** (si hubo ajustes).

```bash
git add docs/superpowers/specs/2026-06-09-villadev-portfolio-fase1-design.md && git commit -m "docs(spec): close Fase 1 — resolve placeholders, mark done"
git push
```

- [ ] **Step 4: Anunciar internamente** (commit message o issue cerrado) que **Fase 1 está cerrada** y listar lo que entra en Fase 2 según el roadmap del spec §18.

---






