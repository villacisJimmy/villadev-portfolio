# Threat Model — villadev portfolio (Fase 1)

Modelo STRIDE de la aplicación de portafolio en su estado de Fase 1: sitio estático
renderizado en el servidor (Next.js) con un único endpoint mutativo (`/contact`)
que delega el envío de correo a Resend. No hay base de datos de aplicación, ni
sesiones, ni autenticación de usuarios finales.

## 1. Descripción del sistema

```
[Visitante] ──HTTPS──▶ [Cloudflare proxy/CDN] ──HTTPS──▶ [Nginx 443]
                                                          │
                                              proxy_pass http://127.0.0.1:3001
                                                          │
                                                  [Container Docker]
                                                  Next.js (Node 22, user 1001,
                                                  read-only fs, cap_drop ALL)
                                                          │
                                              Server Action `/contact`
                                                          │
                                                  Resend API (HTTPS)
                                                          │
                                                 [Buzón del dueño]
```

### Componentes y fronteras de confianza

| Frontera | Lado externo          | Lado interno      | Notas                                      |
| -------- | --------------------- | ----------------- | ------------------------------------------ |
| TB-1     | Internet              | Cloudflare        | WAF/DDoS gestionado por CF                 |
| TB-2     | Cloudflare            | Nginx (VPS)       | Solo HTTPS, real-IP por `CF-Connecting-IP` |
| TB-3     | Nginx                 | Container Next.js | Loopback `127.0.0.1:3001`                  |
| TB-4     | Container             | Resend API        | HTTPS saliente, API key                    |
| TB-5     | GitHub Actions runner | GHCR              | OIDC + token push                          |
| TB-6     | GitHub Actions runner | VPS               | SSH + clave deploy                         |

## 2. Activos

| ID  | Activo                                  | Sensibilidad |
| --- | --------------------------------------- | ------------ |
| A1  | Código fuente público (repo)            | Bajo         |
| A2  | `RESEND_API_KEY` (`/srv/villadev/.env`) | Alto         |
| A3  | Datos PII del formulario (nombre/email) | Medio        |
| A4  | Certificados TLS Let's Encrypt          | Alto         |
| A5  | Logs Nginx y Docker (IPs visitantes)    | Medio        |
| A6  | Imagen Docker en GHCR                   | Medio        |
| A7  | Clave SSH de deploy                     | Alto         |
| A8  | Token DNS para reto DNS-01 de Certbot   | Alto         |
| A9  | Disponibilidad del sitio                | Medio        |

## 3. STRIDE por componente

### 3.1 Cloudflare / Nginx (TB-1, TB-2)

| STRIDE          | Amenaza                                                    | Control                                                                                                          |
| --------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Spoofing        | Suplantación de IP real para sortear rate-limit            | `set_real_ip_from` con prefijos CF + `real_ip_header CF-Connecting-IP`; bloque comentado para entornos sin CF    |
| Tampering       | Inyección de cabeceras `X-Forwarded-*` por cliente directo | Sobrescritura en Nginx con `proxy_set_header`; el container no acepta tráfico fuera de loopback                  |
| Repudiation     | Solicitud sin huella                                       | `access_log` Nginx + `json-file` log-driver Docker (10 MB × 5)                                                   |
| Info disclosure | Fugas TLS débil / OCSP                                     | TLS 1.2+1.3, suite restringida, `ssl_stapling on`, `ssl_session_tickets off`                                     |
| DoS             | Inundación HTTP/HTTPS                                      | CF WAF + `limit_req zone=contact rate=10r/m burst=10 nodelay`, UFW restringe puertos, `client_max_body_size 64k` |
| Elevation       | Root takeover por bug Nginx                                | Paquete `nginx` desde apt, parches automáticos vía `unattended-upgrades` (security)                              |

### 3.2 Container Next.js (TB-3)

| STRIDE          | Amenaza                                         | Control                                                                                                                                             |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spoofing        | Bot intenta saltarse el honeypot del formulario | Campo honeypot oculto + verificación silenciosa server-side; respuesta 200 falsa para no señalizar al bot                                           |
| Tampering       | XSS por contenido renderizado                   | CSP con `nonce` por petición, sin `unsafe-inline`; React escapa por defecto; sanitizado de input antes de pasarlo a Resend                          |
| Repudiation     | Disputas sobre mensajes enviados                | Resend conserva el envío y entrega DKIM-firmada; Nginx log con `request_id`                                                                         |
| Info disclosure | Stack trace en producción                       | `NODE_ENV=production`, `next.config.ts` desactiva `x-powered-by`, errores en server-side a logger sin payload del usuario                           |
| DoS             | Spam masivo al endpoint `/contact`              | Rate limit en Nginx (capa 7) + honeypot + tope `client_max_body_size 64k`; tope de longitud aplicado en Zod schema                                  |
| Elevation       | Escape del container                            | `read_only: true`, `cap_drop: [ALL]`, `no-new-privileges`, `user: 1001:1001`, `userns-remap` en Docker daemon, `pids_limit: 200`, `mem_limit: 512m` |

### 3.3 Salida a Resend (TB-4)

| STRIDE          | Amenaza                                        | Control                                                                                                                              |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Spoofing        | Correo simula venir del dueño                  | DKIM + SPF + DMARC `p=quarantine` sobre el dominio de envío; Resend domain verification obligatoria antes de obtener API key activa  |
| Tampering       | Inyección de cabeceras (CRLF) en el formulario | Construcción del correo con la API de Resend (estructurada, no SMTP raw); validación Zod rechaza saltos de línea en `subject`/`name` |
| Repudiation     | Quién envió qué                                | `request_id` en log Nginx ↔ Resend `email_id`; ambos guardados al menos 30 días por log rotation                                     |
| Info disclosure | Filtración de la API key en logs               | API key sólo en `/srv/villadev/.env` mode 600; nunca pasa por URL ni args; logger redacta `Authorization`                            |
| DoS             | Agotamiento de cuota Resend                    | Rate-limit Nginx 10 req/min/IP + cuota de Resend; alerta manual al dueño si se acerca al límite                                      |
| Elevation       | Misuse de la API key para enviar spam          | API key con scope mínimo (solo `emails.send`), rotación cada 6 meses, dominio verificado único                                       |

### 3.4 Pipeline CI/CD (TB-5, TB-6)

| STRIDE          | Amenaza                                    | Control                                                                                                                       |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Spoofing        | PR malicioso despliega                     | Workflows `pull_request` corren con permisos read-only; deploy solo desde `main` y aprobación humana del entorno `production` |
| Tampering       | Inyección de dependencia                   | `pnpm`/`npm ci` con lockfile, `gitleaks` en pre-commit y CI, escaneo de imágenes (Fase 2: Trivy)                              |
| Repudiation     | Quién desplegó qué                         | GitHub Actions run log + commit SHA en tag de imagen (`sha-xxxx`)                                                             |
| Info disclosure | Secretos en logs                           | `secrets.*` enmascarados por Actions; no se hace `echo` de variables sensibles                                                |
| DoS             | Abuso de minutos CI                        | Workflows limitados a `main` + PR; jobs cortos y cacheados                                                                    |
| Elevation       | Token GITHUB_TOKEN con demasiados permisos | `permissions:` mínimo por job (`contents: read`, `packages: write` solo en publish)                                           |

### 3.5 Host VPS

| STRIDE          | Amenaza                            | Control                                                                                                             |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Spoofing        | Brute-force SSH                    | Password auth deshabilitado, `AllowUsers villadev`, puerto SSH no estándar, `fail2ban` jail `sshd` con `maxretry=4` |
| Tampering       | Mutación de binarios del host      | `unattended-upgrades` para security, paquetes desde repos firmados                                                  |
| Repudiation     | Acción sin trazabilidad            | `journalctl` + `auth.log` + Nginx logs; backup restic semanal                                                       |
| Info disclosure | Lectura de `.env` por otro usuario | `/srv/villadev` mode 750 owner `villadev`, `.env` mode 600                                                          |
| DoS             | Disco lleno por logs               | `logrotate` paquete, `json-file` con `max-size`/`max-file`, monitoreo manual; Fase 2: Prometheus node-exporter      |
| Elevation       | Escalada local via sudo            | sudoers de `villadev` limitado a `nginx reload/restart` y `certbot`, no `ALL`                                       |

## 4. Controles transversales

- **Defensa en profundidad**: cada nivel (CF → Nginx → Container) aplica sus propios límites; un bypass en uno no abre el siguiente.
- **Least privilege**: contenedor sin capabilities, usuario no-root, fs read-only; usuario Linux con sudo recortado.
- **Secret hygiene**: secretos vivos solo en `.env` (mode 600), GitHub Secrets (cifrados en reposo), y `/etc/letsencrypt/secrets/*.ini` (mode 600). No se inyectan por línea de comandos. Ver `secrets-setup.md`.
- **Logs separados**: cada componente loguea en su namespace (`/var/log/nginx/villadev_*`, Docker json-file por contenedor, journald para systemd) — facilita aislamiento si una neighbor app se compromete.
- **Backups verificables**: restic semanal con `restic check --read-data-subset=1%` para detectar corrupción del repo de backup.

## 5. Riesgos residuales aceptados en Fase 1

| Riesgo                                                                           | Justificación de aceptación                             | Mitigación planeada                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Rate limit solo en memoria de Nginx por IP — un IP rotando puede pasar           | Carga esperada baja, sitio público de portafolio        | Fase 2: token bucket + captcha si se ve abuso           |
| Sin firma de imágenes (cosign / sigstore)                                        | Repo único; pull desde GHCR ya autenticado por GHA OIDC | Fase 2: introducir cosign + verificación en `deploy.sh` |
| Sin DAST automatizado (ZAP) en CI                                                | Superficie pequeña, SAST y CSP cubren la mayoría        | Fase 2: ZAP baseline en workflow nocturno               |
| Sin SBOM publicado con la imagen                                                 | No hay distribución externa de la imagen                | Fase 2: `docker sbom` exportado al release              |
| `journalctl`/logs de Nginx contienen IP de visitantes (PII bajo GDPR)            | Necesarios para abuso; retention 30 días vía logrotate  | Documentado en privacy policy del sitio                 |
| `userns-remap` no aísla del kernel — vuln tipo Dirty COW seguiría siendo crítica | Mitigado por `unattended-upgrades` security             | Fase 2: AppArmor profile a medida                       |
| Backup restic depende de la salud del bucket remoto (no replicado)               | Hostinger snapshot del VPS sirve de respaldo secundario | Fase 2: replicar restic a segundo proveedor             |
| No hay alerting automático (sin Prometheus / sin uptime check externo)           | Volumen bajo, dueño revisa manualmente                  | Fase 2: uptime monitor externo + alerta a email         |

## 6. Mapeo OWASP ASVS Nivel 1 (resumen)

| Sección ASVS           | Cobertura Fase 1                                             |
| ---------------------- | ------------------------------------------------------------ |
| V1 Architecture        | Cubierto: documento presente, fronteras explícitas           |
| V2 Authentication      | N/A (no hay usuarios)                                        |
| V3 Session management  | N/A (sin sesiones)                                           |
| V4 Access control      | Cubierto a nivel host (UFW + sudoers); endpoint público      |
| V5 Validation/Encoding | Cubierto: Zod schemas, React escaping, CSP nonce             |
| V7 Errors/logging      | Cubierto: logger sin PII en payload; logs separados          |
| V8 Data protection     | Parcial: `.env` cifrado en reposo solo a nivel disco del VPS |
| V9 Communications      | Cubierto: TLS 1.2+, HSTS, CF redirect                        |
| V10 Malicious code     | Parcial: SAST básico (gitleaks); falta SCA con Trivy         |
| V14 Configuration      | Cubierto: bootstrap idempotente + compose hardened           |

Fase 2 cerrará V8 (gestión de claves), V10 (Trivy + SBOM) y añadirá V11/V13.
