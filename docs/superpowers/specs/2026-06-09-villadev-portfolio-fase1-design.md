# VillaDev Portafolio — Diseño de Fase 1

**Autor:** Jimmy Villacis (g.villacis.jimmy@gmail.com)
**Fecha:** 2026-06-09
**Estado:** Aprobado (pendiente de revisión final del autor)
**Spec relacionado:** [README del handoff](../../../../design_handoff_villadev_portfolio/README.md)

---

## 1. Contexto y motivación

El usuario tiene un prototipo HTML/CSS/JS de alta fidelidad del portafolio personal "VillaDev" (en `design_handoff_villadev_portfolio/design/`). El objetivo del proyecto completo es convertirlo en una web app dinámica con backend, hosteada en un VPS de Hostinger compartido con otras 3 aplicaciones del mismo usuario.

La marca personal posiciona **seguridad por diseño** y **desarrollo acelerado con IA** como diferenciadores. El portafolio mismo debe ser una demostración verificable de esos valores, no solo una declaración: el código, la infra y el ciclo de desarrollo deben ser visibles y consistentemente seguros.

El proyecto se entrega por **fases con valor incremental** para acortar el time-to-production y permitir aprendizaje iterativo. Este documento define la **Fase 1**.

## 2. Objetivos de Fase 1

1. Sitio público en producción con la misma fidelidad visual del prototipo (Home + Catálogo de proyectos).
2. i18n ES/EN funcional con rutas SEO-friendly.
3. Formulario de contacto enviando correos reales (sin `mailto:`).
4. VPS endurecido y preparado para multi-tenancy con las 4 apps planeadas.
5. CI/CD que despliega con un push a `main`.
6. Ciclo de desarrollo seguro (SSDLC) operativo desde el primer commit: SAST, secret scan, dependency scan, header policies, validación en frontera.

## 3. No-objetivos de Fase 1

- **No** habrá base de datos en uso productivo (PostgreSQL queda preparado pero no usado).
- **No** habrá panel de administración (queda para Fase 2).
- **No** habrá autenticación (queda para Fase 2).
- **No** habrá MFA, RBAC ni audit log (Fase 3).
- **No** habrá DAST, SBOM firmado, Renovate auto-merge ni monitoreo activo (Fase 4).
- El contenido (proyectos, certificaciones, experiencia, servicios, skills) **vive en archivos TypeScript del repo**; cambiarlo requiere commit + redeploy.
- No hay analítica ni telemetría hacia terceros (decisión de privacidad).

## 4. Arquitectura

```
Internet
   │
   ▼
[Cloudflare DNS + Proxy] ──► [VPS Hostinger : Nginx 80/443 (TLS termination)]
                                         │
                                         ├─► villadev.tld         → 127.0.0.1:3001  [contenedor portafolio]
                                         ├─► app2.villadev.tld    → 127.0.0.1:3002  [futuro]
                                         ├─► app3.villadev.tld    → 127.0.0.1:3003  [futuro]
                                         └─► app4.villadev.tld    → 127.0.0.1:3004  [futuro]

Servicios del host (fuera de contenedores):
  - Nginx (reverse proxy + TLS termination)
  - Certbot (cert wildcard *.villadev.tld via DNS-01, auto-renew)
  - fail2ban (sshd + Nginx admin paths)
  - UFW (firewall: 22-custom, 80, 443)
  - journald + logrotate
  - unattended-upgrades (solo -security)
  - PostgreSQL (preparado para Fase 2, sin uso productivo en Fase 1)
  - Docker daemon (userns-remap, live-restore, JSON logs rotados)
```

El contenedor del portafolio es **stateless** en Fase 1: contenido inmutable, sin DB, sin volúmenes persistentes salvo logs.

## 5. Stack técnico

| Área       | Elección                                                                                                                        | Versión objetivo                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Framework  | Next.js (App Router) + React + TypeScript estricto                                                                              | Next 15.x, React 19.x, TS 5.x                                 |
| Runtime    | Node.js                                                                                                                         | 22.x LTS                                                      |
| Estilos    | CSS Modules + variables CSS (tokens portados del prototipo)                                                                     | —                                                             |
| Fuentes    | `next/font/google` — Space Grotesk + JetBrains Mono (self-hosted al build)                                                      | —                                                             |
| i18n       | `next-intl` con rutas `/es/...` y `/en/...`, default `es`, redirección por `Accept-Language` en primer hit                      | `^3.x`                                                        |
| Validación | Zod                                                                                                                             | `^3.x`                                                        |
| Email      | Resend (API REST, sin SMTP propio)                                                                                              | `^3.x` SDK                                                    |
| Logging    | `pino` estructurado JSON, redacción automática de campos sensibles                                                              | `^9.x`                                                        |
| Rate limit | Token bucket en memoria por IP (suficiente para 1 endpoint, 1 réplica)                                                          | implementación propia o `@upstash/ratelimit` con `MapAdapter` |
| Headers    | Middleware Next.js con CSP nonce-based, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | helper propio o `next-safe`                                   |
| Tests unit | Vitest                                                                                                                          | `^2.x`                                                        |
| Tests e2e  | Playwright (smoke: home, switch idioma, contact form valida y envía)                                                            | `^1.4x`                                                       |
| Linting    | ESLint + `eslint-plugin-security` + `eslint-plugin-no-secrets`                                                                  | `^9.x`                                                        |
| Formato    | Prettier                                                                                                                        | `^3.x`                                                        |
| Pre-commit | Husky + lint-staged + gitleaks                                                                                                  | —                                                             |
| Container  | Docker multi-stage; runner `node:22-alpine`, usuario no-root (uid 1001), `output: 'standalone'`                                 | —                                                             |
| Registry   | GHCR (`ghcr.io/<user>/villadev`)                                                                                                | —                                                             |

### TypeScript strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

## 6. Modelo de contenido (Fase 1)

Todo el contenido vive en `src/content/*.ts` como constantes tipadas. Cada string traducible es un objeto `{ es: string; en: string }`. Esto permite el salto a DB en Fase 2 sin reescribir vistas (los componentes consumen una interfaz tipada que es idéntica entre archivo y DB).

```typescript
type LocalizedString = { es: string; en: string };

interface Project {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  status: "live" | "soon";
  category: "web" | "auto" | "sec";
  url?: string;
  image?: string;
  tags: string[];
  featured: boolean;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  ongoing: boolean;
}

interface ExperienceItem {
  id: string;
  role: LocalizedString;
  company: string;
  period: string;
  description: LocalizedString;
  current: boolean;
  chips: string[];
}

interface Service {
  id: string;
  index: string;
  title: LocalizedString;
  description: LocalizedString;
  tags: string[];
}
interface Skill {
  id: string;
  category: LocalizedString;
  description: LocalizedString;
}
```

Datos semilla: portados del prototipo (`design/Portafolio.html` + `design/assets/i18n.js`).

Estado dinámico mínimo:

- `available: boolean` — controla el badge "Disponible para proyectos". En Fase 1 se lee de `process.env.AVAILABLE` (`"true"` / `"false"`) **en runtime** (no build time), coerced con Zod boolean. Cambiarlo requiere reiniciar el contenedor (`docker compose up -d --force-recreate app`) pero no rebuild. En Fase 3 pasa a DB editable desde el admin.

## 7. Vistas y comportamiento

Idéntico al prototipo (referenciar el README del handoff para detalle exhaustivo). Resumen estricto:

### 7.1 Layout (`app/[locale]/(public)/layout.tsx`)

- Navbar fijo con clase `.scrolled` cuando `scrollY > 24`.
- Mobile menu overlay para `< 760px`.
- Switch idioma reescribe `/es/...` ↔ `/en/...` (no toca `localStorage`).
- Footer con año dinámico.

### 7.2 Home (`app/[locale]/(public)/page.tsx`)

Secciones en orden: Hero, Servicios, Sobre mí, Proyectos destacados, Experiencia, Certificaciones, Skills, Contacto. Detalles visuales y de comportamiento: ver README §1.1–1.9.

Componentes interactivos:

- `<Hero />` — con typing del terminal, counters animados, badge pulsante.
- `<Services />` — glow radial siguiendo el cursor (`pointermove`).
- `<About />` — foto con scan-line CSS y esquinas tipo "mira".
- `<Projects featured />` — toma `featured: true` de `projects.ts`.
- `<Experience />` — timeline vertical.
- `<Certifications />` — grid auto-fill.
- `<Skills />` — grid auto-fill.
- `<Contact />` — formulario con Server Action.

### 7.3 Catálogo (`app/[locale]/(public)/proyectos/page.tsx`)

- Lista todos los proyectos (no solo featured).
- Filtro por categoría como **query param** (`?cat=auto`). El filtro reescribe la URL para que sea compartible y SEO-friendly.
- Misma tarjeta `.proj` que en Home.

### 7.4 Comportamiento que respeta `prefers-reduced-motion`

- Typing del terminal → versión estática.
- Reveal on scroll → render inmediato sin animación.
- Counters → muestran valor final sin animar.
- Scan line, glow, pulse → desactivados.

## 8. Formulario de contacto

### 8.1 Esquema (Zod, compartido)

```typescript
const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  subject: z.enum(["proyecto", "consultoria", "colaboracion", "otro"]),
  message: z.string().trim().min(20).max(2000),
  // honeypot: campo oculto que un bot llenaría; debe llegar vacío
  hp: z.string().max(0).optional(),
});
```

### 8.2 Flujo

1. Cliente: submit → Server Action `submitContact(formData)`.
2. Server Action:
   - Valida con `ContactSchema.safeParse` (mensajes de error genéricos al cliente, detalle en logs).
   - Aplica rate limit: máximo **5 envíos / 10 min por IP** (token bucket). Falla → 429 con mensaje "demasiados intentos".
   - **Fuente de IP**: lee el header `CF-Connecting-IP` si Cloudflare está habilitado, o `X-Forwarded-For` (último valor antes del proxy de confianza) si solo está Nginx. Nginx debe ir configurado con `set_real_ip_from <IP del proxy de confianza>` para que el header no sea spoofable. La IP cruda del socket nunca se usa porque siempre será la de Nginx.
   - Rechaza si el honeypot `hp` viene con cualquier valor.
   - Llama Resend con `from: 'Contacto VillaDev <contacto@villadev.tld>'`, `to: 'villacis.j@icloud.com'`, `reply_to: <email del usuario>`, asunto prefijado por `subject`.
   - Loggea evento estructurado (sin el cuerpo del mensaje, solo metadatos: IP enmascarada, longitud, timestamp, resultado).
3. Cliente recibe `{ ok: true }` o `{ ok: false, error: 'validation' | 'rate_limit' | 'internal' }`. UI muestra estado `idle | submitting | success | error`.

### 8.3 Anti-abuso

- Honeypot oculto.
- Rate limit por IP.
- Validación estricta de longitudes y tipos.
- CSRF: Server Actions de Next.js usan tokens internos automáticamente.
- No se eco-imprime el contenido del mensaje en ningún log persistente.

## 9. Seguridad

### 9.1 Headers HTTP (middleware)

- **CSP nonce-based** (sin `unsafe-inline`). Cada request genera nonce; el `<canvas>` y `<script>` inline del prototipo se reescriben para usar el nonce.
  - `default-src 'self'`
  - `script-src 'self' 'nonce-<nonce>'`
  - `style-src 'self' 'nonce-<nonce>'` (fuentes y CSS Modules)
  - `img-src 'self' data:`
  - `font-src 'self'`
  - `connect-src 'self' https://api.resend.com`
  - `frame-ancestors 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`
  - `upgrade-insecure-requests`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

### 9.2 Modelo de amenazas (resumen STRIDE para Fase 1)

| Amenaza             | Vector                                   | Mitigación                                                                                                     |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **S**poofing        | Falsificar emisor del correo de contacto | DKIM/SPF/DMARC gestionados por Resend; `reply_to` es el del usuario, `from` siempre es del dominio propio      |
| **T**ampering       | Inyección en form fields                 | Zod en frontera, ORM (Fase 2), output encoding por React                                                       |
| **R**epudiation     | Envío masivo desde un atacante           | Logs estructurados con IP enmascarada + ventana temporal                                                       |
| **I**nfo disclosure | Stack traces, headers reveladores        | Errores genéricos al cliente; `X-Powered-By` desactivado; logs internos                                        |
| **D**oS             | Spam al endpoint contacto                | Rate limit por IP + Cloudflare WAF al frente + límites de tamaño                                               |
| **E**levation       | RCE vía dependencia                      | `npm audit` + Semgrep + imagen `alpine` + `read_only` FS + `cap_drop ALL` + `no-new-privileges` + userns-remap |

Threat model expandido vive en `docs/threat-model.md` y se actualiza al inicio de cada fase.

### 9.3 Manejo de secretos

- Todos los secretos viven en `/srv/villadev/.env` (mode 600, owner `villadev:villadev`), fuera del repo y fuera de la imagen Docker.
- En GitHub Actions, secretos viven en GitHub Secrets (no se imprimen, masked en logs).
- Pre-commit: **gitleaks** bloquea commits con patrones de secreto.
- Nunca se imprimen secretos en chat, issues, PRs ni logs. El usuario los genera siguiendo guías paso a paso.

## 10. Dominio, DNS y TLS

### 10.1 DNS (en Cloudflare, recomendado, o en el registrador)

- `A    villadev.tld         → <IP VPS>`
- `A    *.villadev.tld       → <IP VPS>` (habilita los 3 apps futuros sin tocar DNS)
- `CNAME www                  → villadev.tld` (redirect 301 en Nginx)
- Si se usa Cloudflare: registros en modo "proxied" (naranja) → WAF, DDoS mitigation y caché gratis.

### 10.2 TLS

- Certificado **wildcard `*.villadev.tld`** + `villadev.tld` con Let's Encrypt vía **DNS-01 challenge** (única manera de obtener wildcard).
- Renovación automática vía el systemd timer `certbot.timer` (instalado por el paquete) con hook `--deploy-hook "systemctl reload nginx"`.
- API token del DNS provider con permisos mínimos (solo zonas DNS); vive en `/etc/letsencrypt/credentials.ini` (mode 600).
- Nginx: TLS 1.2 + 1.3 solamente, ciphers Mozilla "Intermediate", OCSP stapling, HTTP/2.

## 11. Docker

### 11.1 Dockerfile (multi-stage)

- **Stage `deps`**: `node:22-alpine`, copia `package.json` + `package-lock.json`, `npm ci --omit=dev` para producción, segunda capa con deps de dev para el build.
- **Stage `builder`**: copia código, `npm run build` (Next con `output: 'standalone'`).
- **Stage `runner`**: `node:22-alpine`, instala solo `dumb-init`, crea grupo + usuario `nextjs:nextjs` (1001:1001), copia desde builder `.next/standalone`, `.next/static`, `public`. `USER nextjs`. `EXPOSE 3000`. `CMD ["dumb-init", "node", "server.js"]`.
- Imagen final objetivo: < 200MB.

### 11.2 `compose.yaml` en el VPS (`/srv/villadev/compose.yaml`)

```yaml
services:
  app:
    image: ghcr.io/<user>/villadev:${TAG}
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    user: "1001:1001"
    networks: [villadev_net]
    ports:
      - "127.0.0.1:3001:3000" # solo loopback; Nginx hace el proxy
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
        max-file: "3"
networks:
  villadev_net:
    driver: bridge
```

### 11.3 Multi-app

Cada app futuro vive en `/srv/<app>/` con su propio `compose.yaml`, puerto upstream, red bridge, `.env`, volúmenes. **Sin compartir red ni volúmenes entre apps.** Documentado en `docs/runbook.md`.

## 12. CI/CD

### 12.1 Repo

GitHub privado durante el desarrollo. Tras Fase 2 (cuando el admin esté listo y no haya secretos en config), puede pasar a público como parte del showcase.

### 12.2 Pipeline (`.github/workflows/ci-cd.yml`)

**Jobs en cada PR/push a cualquier rama:**

1. `lint` — ESLint (+ `eslint-plugin-security`, `no-secrets`), Prettier check.
2. `typecheck` — `tsc --noEmit`.
3. `test-unit` — Vitest.
4. `test-e2e` — Playwright smoke (Home renderiza, switch idioma, contact form valida + bloquea honeypot).
5. `security` — `gitleaks`, `npm audit --audit-level=high`, **Semgrep** con reglas OWASP/seguridad para JS/TS.
6. `build` — `next build` para detectar errores tempranos.

**Jobs adicionales en push a `main`:** 7. `docker-build-push` — `docker build` + push a GHCR con tags `sha-<short>` y `latest`. Build con `BuildKit` y caché. 8. `deploy` — SSH al VPS (`appleboy/ssh-action`) ejecuta `/srv/villadev/deploy.sh` que hace `docker compose pull && docker compose up -d --remove-orphans && docker image prune -af`.

**Secretos requeridos en GitHub** (guía aparte para el usuario):

- Push a GHCR usa el `GITHUB_TOKEN` integrado (con `permissions: packages: write` declarado en el workflow) — no requiere PAT mientras la imagen viva en el mismo owner que el repo.
- `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY` (key dedicada, no la personal).
- `RESEND_API_KEY` y `CONTACT_TO_EMAIL` pasan vía `/srv/villadev/.env` en el VPS — **no** suben a GitHub Secrets.

**Rollback**: `TAG=sha-anterior docker compose up -d` — 1 comando, documentado en runbook.

### 12.3 Pre-commit (Husky + lint-staged)

- ESLint + Prettier en archivos staged.
- `tsc --noEmit` (rápido en proyectos pequeños).
- `gitleaks protect --staged`.

## 13. Endurecimiento del VPS

Checklist mínimo (script idempotente bajo `deploy/host/bootstrap.sh`, ejecutado una vez):

- [ ] Crear usuario `villadev` con sudo, sin contraseña SSH (solo key).
- [ ] Deshabilitar login SSH de `root`.
- [ ] Cambiar puerto SSH a no-estándar.
- [ ] `PasswordAuthentication no`, `PermitRootLogin no`, `AllowUsers villadev`.
- [ ] Instalar `fail2ban` con jail para sshd y para `/admin` (preparado para Fase 2).
- [ ] UFW: `default deny incoming`, `default allow outgoing`, permitir SSH (custom port), 80, 443. Habilitar.
- [ ] `unattended-upgrades` solo para `-security`.
- [ ] Instalar Docker; habilitar `userns-remap`, `live-restore`, log JSON con rotación.
- [ ] Instalar Nginx; aplicar config endurecida (`docs/nginx-hardening.md`).
- [ ] Instalar Certbot + plugin DNS del proveedor; obtener wildcard.
- [ ] Instalar PostgreSQL (binding 127.0.0.1, sin rol/DB de app todavía — esos se crean en Fase 2).
- [ ] Configurar `logrotate` para Nginx por vhost.
- [ ] Tomar snapshot del VPS desde el panel de Hostinger antes y después del bootstrap.

Verificación post-bootstrap:

- `ssh-audit` (Lynis / propio) sobre la config SSH.
- `testssl.sh` sobre `villadev.tld` (apunta a A+ en SSL Labs).
- `nikto` + curl manual sobre los headers.

## 14. Backups (Fase 1)

Aunque Fase 1 es stateless, se respalda:

- Snapshot semanal cifrado de `/srv/villadev/.env` y de `/etc/nginx/sites-available/` a almacenamiento externo (bucket S3-compatible — el usuario crea uno gratuito siguiendo guía).
- Snapshot mensual del VPS completo desde el panel de Hostinger.
- Restore drill cada 3 meses (documentado en `docs/runbook.md`).

## 15. Estructura del repo

```
villadev-portfolio/
├── .github/workflows/ci-cd.yml
├── .gitignore
├── .gitleaks.toml
├── .nvmrc
├── .prettierrc
├── .env.example
├── Dockerfile
├── compose.yaml                       # solo para desarrollo local
├── deploy/
│   ├── host/bootstrap.sh              # endurecimiento idempotente del VPS
│   ├── nginx/villadev.conf.example
│   ├── systemd/villadev-compose.service.example
│   └── deploy.sh                      # ejecutado por el job CD
├── docs/
│   ├── superpowers/specs/
│   │   └── 2026-06-09-villadev-portfolio-fase1-design.md   # ESTE DOC
│   ├── threat-model.md
│   ├── runbook.md
│   ├── nginx-hardening.md
│   └── secrets-setup.md               # guías paso a paso (cuentas Resend, GHCR, etc.)
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── public/
│   └── profile.jpeg
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx
│   │   │   │   └── proyectos/page.tsx
│   │   ├── api/health/route.ts
│   │   └── middleware.ts              # i18n + security headers + CSP nonce
│   ├── components/
│   │   ├── Hero/...
│   │   ├── Navbar/...
│   │   ├── Services/...
│   │   ├── About/...
│   │   ├── Projects/...
│   │   ├── Experience/...
│   │   ├── Certifications/...
│   │   ├── Skills/...
│   │   ├── Contact/...
│   │   ├── Footer/...
│   │   └── ui/                        # primitivos: Button, Chip, Card, Eyebrow
│   ├── content/
│   │   ├── projects.ts
│   │   ├── certifications.ts
│   │   ├── experience.ts
│   │   ├── services.ts
│   │   └── skills.ts
│   ├── lib/
│   │   ├── i18n/                      # config next-intl
│   │   ├── schemas/
│   │   │   └── contact.ts             # Zod ContactSchema
│   │   ├── email/
│   │   │   └── resend.ts              # cliente Resend + render del correo
│   │   ├── rate-limit.ts
│   │   ├── logger.ts                  # pino con redaction
│   │   └── csp.ts                     # generador de nonce y headers
│   ├── server-actions/
│   │   └── contact.ts
│   └── styles/
│       ├── tokens.css                 # variables CSS del prototipo, portadas tal cual
│       └── globals.css
├── tests/
│   ├── unit/
│   └── e2e/
└── tsconfig.json
```

## 16. Estrategia de testing

- **Unit (Vitest)**: validadores Zod, rate limit, logger redaction, helpers de CSP, render de componentes con i18n.
- **e2e crítico (Playwright)**:
  - Home renderiza en `/es` y en `/en` con strings correctas.
  - Switch idioma reescribe la URL.
  - Catálogo filtra por `?cat=auto`.
  - Contact form: validación, honeypot bloquea, rate limit dispara 429 al sexto intento, envío exitoso muestra estado success.
- **Smoke en CI** sobre el build de producción.
- **Tests con `prefers-reduced-motion`** activado para confirmar que las versiones estáticas se sirven.

Cobertura objetivo Fase 1: 70% líneas en `src/lib/` y `src/server-actions/`. UI no se mide por cobertura.

## 17. Definición de "hecho" para Fase 1

- [ ] Sitio en `https://villadev.tld` responde con cert válido y headers A+.
- [ ] `/es` y `/en` renderizan todas las secciones con paridad visual respecto al prototipo (screenshots `01-...09-*.png`).
- [ ] Switch de idioma funciona y persiste por URL.
- [ ] Catálogo `/es/proyectos` filtra por `?cat=`.
- [ ] Form de contacto envía correo real vía Resend; honeypot y rate limit verificados.
- [ ] CI pasa todos los jobs (lint, typecheck, unit, e2e, security, build).
- [ ] Deploy con push a `main` lleva imagen a producción en < 5 min.
- [ ] Rollback documentado y probado al menos una vez.
- [ ] Threat model documentado.
- [ ] Runbook con: arrancar, parar, ver logs, deploy manual, rollback, restore desde backup.
- [ ] VPS pasa el checklist de endurecimiento; `testssl.sh` da A+; `ssh-audit` sin warnings críticos.
- [ ] Snapshot del VPS tomado tras el primer deploy exitoso.

## 18. Roadmap (vista rápida de fases siguientes)

- **Fase 2 — DB + admin mínimo**: PostgreSQL + Prisma + Auth.js (login solo). CRUD de proyectos. Audit log. Contenido pasa de archivos a DB con migración semilla.
- **Fase 3 — Admin completo**: CRUD de certs/experiencia/disponibilidad. MFA TOTP. RBAC (admin / viewer). Rate limit en Redis. Sesiones rotables.
- **Fase 4 — Endurecimiento avanzado**: DAST (OWASP ZAP) en CI, SBOM (`cyclonedx-npm`) + firma con `cosign`, Renovate auto-merge, Semgrep custom rules, monitoreo (Grafana/Loki o Uptime Kuma), alertas.

## 18.1 Placeholders pendientes de resolver con el usuario

Estos valores no están en el spec porque sólo el usuario puede definirlos. Se resuelven al inicio de la implementación:

- `<TLD>` — extensión del dominio principal (`.com`, `.dev`, `.cl`, etc.). Todo el documento dice `villadev.tld`; reemplazar globalmente cuando se confirme.
- `<GITHUB_USER>` — owner de GitHub donde vive el repo y GHCR (aparece como `<user>` en strings de imagen).
- `<VPS_IP>` — IP pública del VPS Hostinger.
- `<SSH_PORT>` — puerto no-estándar elegido para SSH.
- DNS provider para el DNS-01 challenge (Cloudflare vs Hostinger DNS) — define qué plugin de Certbot se usa.
- Decisión final sobre Cloudflare al frente: sí/no.

## 19. Decisiones explícitas y riesgos asumidos

- **Cloudflare al frente**: recomendado pero **opcional**. Si el usuario decide no usarlo, se pierden WAF/DDoS, queda como riesgo aceptado; mitigado parcialmente por rate limit + UFW + fail2ban.
- **Rate limit en memoria**: aceptable porque hay 1 réplica; al pasar a múltiples réplicas (no contemplado en este proyecto), migrar a Redis es trivial.
- **Sin DB en Fase 1**: aceptado; el contenido cambia con redeploy. PostgreSQL queda instalado pero ocioso para acelerar Fase 2.
- **Resend como dependencia externa**: aceptado; Resend cae → form muestra error; queda registrado en logs; rara vez ocurre. No es path crítico para la vida útil del sitio.
- **Imagen Docker Alpine**: trade-off: imagen pequeña vs ocasional incompatibilidad con paquetes nativos (muy raro en Next.js). Si surge, migrar a `node:22-slim`.

## 20. Glosario rápido

- **SSDLC**: Secure Software Development Lifecycle.
- **CSP nonce-based**: cada request genera un nonce aleatorio; los `<script>` legítimos llevan ese nonce; bloquea XSS por inyección de script externo.
- **DNS-01**: método de Let's Encrypt para validar control del dominio creando un registro TXT; es el único modo que permite certificados wildcard.
- **userns-remap**: feature de Docker que mapea el `root` del contenedor a un UID no-privilegiado del host; reduce el impacto de un escape.
- **STRIDE**: marco de threat modeling de Microsoft (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege).
