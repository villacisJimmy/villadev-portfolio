# Secrets Setup — villadev portfolio (Fase 1)

Procedimiento end-to-end para generar, almacenar y rotar todos los secretos que
maneja la Fase 1. Una sola regla, antes de empezar:

> **NUNCA pegues el valor de un secreto en chat, en un PR, en un issue, en un log,
> ni en un comentario de commit.** Si necesitas compartir una huella, comparte
> únicamente el primer y último carácter (`sk-_xxxx_…_xxxx_yyyy`) o un fingerprint
> SHA-256.

Todos los pasos asumen un VPS Ubuntu 22.04 con `villadev` ya creado por
`bootstrap.sh`, y `<VPS_IP>`, `<PUERTO_SSH>`, `<USER_GH>` sustituidos.

## Índice de secretos

| #   | Secreto                           | Ubicación canónica                                 | Modo |
| --- | --------------------------------- | -------------------------------------------------- | ---- |
| 1   | `RESEND_API_KEY`                  | `/srv/villadev/.env` + tu `.env` local             | 600  |
| 2   | Clave SSH deploy (privada)        | `~/.ssh/villadev_deploy` + GH Secret `VPS_SSH_KEY` | 600  |
| 3   | Clave SSH deploy (pública)        | `/home/villadev/.ssh/authorized_keys`              | 600  |
| 4   | GH Secrets repo (`VPS_*`)         | GitHub repo settings                               | n/a  |
| 5   | Token DNS provider para Certbot   | `/etc/letsencrypt/secrets/<provider>.ini`          | 600  |
| 6   | Contenido completo de `.env` prod | `/srv/villadev/.env`                               | 600  |
| 7   | (Opc.) GHCR PAT pull              | `/srv/villadev/.ghcr_token`                        | 600  |
| 8   | Restic password + repo URL        | `/home/villadev/.config/restic/env`                | 600  |

---

## 1. `RESEND_API_KEY`

Resend envía el formulario de contacto. La cuenta gratis cubre Fase 1.

### 1.1 Crear cuenta y verificar dominio

1. Abre <https://resend.com> y crea cuenta con tu correo personal.
2. **Domains → Add Domain** → escribe el dominio que usarás como remitente
   (por ejemplo `villadev.tld`).
3. Resend mostrará 3 registros DNS: SPF, DKIM, DMARC. Cópialos en tu proveedor
   DNS (Cloudflare o Hostinger).
4. Espera propagación (1–10 min) y pulsa "Verify". El dominio debe quedar verde.

### 1.2 Crear API key con scope mínimo

1. Resend → **API Keys → Create API Key**.
2. Nombre: `villadev-prod`.
3. Permission: **Sending access**, dominio: **el dominio verificado** (no "all").
4. Resend muestra la clave **una sola vez**. Cópiala al portapapeles.

### 1.3 Pegarla en local y en VPS — sin chat

**En tu máquina local:**

```bash
# 1. Abre .env con tu editor (NO pegues en chat).
nano .env
# 2. Pega como RESEND_API_KEY=<TU_VALOR> y guarda.
chmod 600 .env
```

**En el VPS:**

```bash
ssh -i ~/.ssh/villadev_deploy -p <PUERTO_SSH> villadev@<VPS_IP>
sudo nano /srv/villadev/.env
# Edita la línea RESEND_API_KEY=...
sudo chown villadev:villadev /srv/villadev/.env
sudo chmod 600 /srv/villadev/.env
```

Luego reinicia el container para que tome el cambio:

```bash
cd /srv/villadev && docker compose up -d --force-recreate
```

### 1.4 Rotación

Cada 6 meses, o de inmediato si sospechas filtración:

1. Crea una nueva key en Resend (no borres la vieja todavía).
2. Edita `.env` local + `/srv/villadev/.env` con el nuevo valor.
3. `docker compose up -d --force-recreate` y prueba el formulario.
4. Borra la key antigua del dashboard de Resend.

---

## 2. Clave SSH de deploy

Identidad que usará GitHub Actions para hacer SSH al VPS y correr `deploy.sh`.

### 2.1 Generar par de claves localmente

En **tu máquina** (no en el VPS, no en chat):

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/villadev_deploy -C "villadev-deploy@$(hostname)"
# Sin passphrase → la usa GHA. Si quieres passphrase, gestiónala con ssh-agent.
chmod 600 ~/.ssh/villadev_deploy
chmod 644 ~/.ssh/villadev_deploy.pub
```

### 2.2 Copiar la pública al VPS

```bash
# Concatenar la pública a authorized_keys del usuario villadev.
# Si es el primer key, usa primero la contraseña de root del provider:
ssh-copy-id -i ~/.ssh/villadev_deploy.pub -p 22 root@<VPS_IP>
# (o copia manualmente el contenido a /home/villadev/.ssh/authorized_keys)

# Verifica login sin contraseña
ssh -i ~/.ssh/villadev_deploy -p <PUERTO_SSH> villadev@<VPS_IP> "echo OK"
```

### 2.3 Subir la privada a GitHub Secret

1. En tu máquina local, lee el contenido de la privada **a tu portapapeles** (no a chat):
   ```bash
   pbcopy < ~/.ssh/villadev_deploy   # macOS
   # ó: cat ~/.ssh/villadev_deploy | xclip -selection clipboard   # Linux
   ```
2. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: `VPS_SSH_KEY`. Value: pega del portapapeles. Add secret.
4. **Vacía el portapapeles** después: `pbcopy < /dev/null` (macOS).

### 2.4 Rotación

Cada 12 meses, o inmediata si la máquina con la clave se compromete:

1. Genera nuevo par (`villadev_deploy_2`).
2. Concatena la nueva pública en `authorized_keys` del VPS (sin borrar la vieja).
3. Actualiza el GH Secret `VPS_SSH_KEY` con la nueva privada.
4. Lanza un deploy de prueba.
5. Una vez OK, elimina la pública vieja de `authorized_keys`.

---

## 3. GitHub Secrets y entorno `production`

### 3.1 Repo secrets

GitHub → repo → **Settings → Secrets and variables → Actions**:

| Secret name   | Valor a poner               |
| ------------- | --------------------------- |
| `VPS_HOST`    | `<VPS_IP>` o `villadev.tld` |
| `VPS_USER`    | `villadev`                  |
| `VPS_PORT`    | `<PUERTO_SSH>`              |
| `VPS_SSH_KEY` | privada (ver §2.3)          |

> No pegues estos valores en chat ni los menciones en commits.

### 3.2 Entorno `production` con aprobación humana

1. Repo → **Settings → Environments → New environment** → `production`.
2. **Required reviewers**: añade tu propio usuario.
3. **Deployment branches**: limita a `main`.
4. En el workflow CD (`.github/workflows/cd.yml`), el job que invoca el deploy
   ya referencia `environment: production`; al hacer push a `main` el job queda
   esperando tu aprobación manual antes de tocar el VPS.

---

## 4. Token DNS para Certbot (DNS-01)

Fase 1 usa el reto DNS-01 (no HTTP-01) para emitir el cert; eso permite cert
wildcard si lo quieres en el futuro y evita exponer `:80` durante el reto. El
token DNS es un secreto.

### 4.1 Cloudflare

1. CF dashboard → **My Profile → API Tokens → Create Token → Custom token**.
2. Permissions: **Zone → DNS → Edit**, recurso: tu zona concreta (no "All zones").
3. TTL: por defecto. Crear.
4. CF muestra el token **una vez**. Cópialo al portapapeles.

En el VPS:

```bash
sudo mkdir -p /etc/letsencrypt/secrets
sudo nano /etc/letsencrypt/secrets/cloudflare.ini
# Pega:
#   dns_cloudflare_api_token = <TU_TOKEN>
sudo chmod 600 /etc/letsencrypt/secrets/cloudflare.ini
sudo chown root:root /etc/letsencrypt/secrets/cloudflare.ini
```

Emisión inicial:

```bash
sudo apt install python3-certbot-dns-cloudflare
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/secrets/cloudflare.ini \
  -d villadev.tld -d www.villadev.tld \
  --deploy-hook "systemctl reload nginx"
```

### 4.2 Hostinger DNS (si no usas Cloudflare)

Si tu DNS lo gestiona Hostinger, usa el plugin oficial o `acme.sh` con la API key
DNS que ofrezca Hostinger. Mismo principio: token con scope DNS-only, guardado en
`/etc/letsencrypt/secrets/hostinger.ini` mode 600.

### 4.3 Rotación

Anual. El procedimiento es:

1. Crear token nuevo en el panel.
2. Editar el `.ini` correspondiente.
3. `sudo certbot renew --dry-run` para confirmar.
4. Eliminar token viejo del panel.

---

## 5. `/srv/villadev/.env` completo

Plantilla basada en `.env.example`. Crear en el VPS, **sin pegar el contenido en
chat**:

```bash
ssh -i ~/.ssh/villadev_deploy -p <PUERTO_SSH> villadev@<VPS_IP>
sudo install -o villadev -g villadev -m 600 /dev/null /srv/villadev/.env
sudo nano /srv/villadev/.env
```

Estructura mínima (sustituye `<placeholder>` por valores reales, **uno por uno y
sin pegarlos a chat**):

```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://villadev.tld
RESEND_API_KEY=<sk-…>
RESEND_FROM=Villadev <contacto@villadev.tld>
RESEND_TO=<tu_email_destino>
TRUSTED_PROXY=127.0.0.1
LOG_LEVEL=info
```

Cualquier variable adicional listada en `.env.example` debe aparecer aquí. Guarda
y confirma:

```bash
sudo chmod 600 /srv/villadev/.env
sudo chown villadev:villadev /srv/villadev/.env
ls -l /srv/villadev/.env   # → -rw------- 1 villadev villadev
```

---

## 6. (Opcional) GHCR pull token

Solo si publicas la imagen como **privada**. Para Fase 1 lo recomendado es
imagen pública (no contiene secretos) — saltea esta sección si la dejaste así.

Si la haces privada:

1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
2. Generate new → scope mínimo `read:packages`.
3. En el VPS:
   ```bash
   sudo install -o villadev -g villadev -m 600 /dev/null /srv/villadev/.ghcr_token
   sudo nano /srv/villadev/.ghcr_token
   # Pega el PAT, una sola línea, sin espacios.
   ```
4. `deploy.sh` detecta el fichero y hace `docker login ghcr.io` automáticamente.

Rotación anual (o si comprometes la máquina). Misma rutina: crear → reemplazar →
borrar el viejo.

---

## 7. Restic backup credentials

Generadas durante la configuración inicial del backup (Fase J8 manual). Para
referencia:

```bash
sudo -u villadev mkdir -p /home/villadev/.config/restic
sudo -u villadev install -m 600 /dev/null /home/villadev/.config/restic/env
sudo -u villadev nano /home/villadev/.config/restic/env
```

Contenido (sustituye, **sin pegar a chat**):

```
export RESTIC_REPOSITORY="s3:s3.<region>.amazonaws.com/<bucket>/villadev"
export RESTIC_PASSWORD="<contraseña_larga_aleatoria_solo_aquí>"
export AWS_ACCESS_KEY_ID="<KEY>"
export AWS_SECRET_ACCESS_KEY="<SECRET>"
```

> La `RESTIC_PASSWORD` no se puede recuperar; si la pierdes, los backups quedan
> inutilizables. Anótala en tu gestor de contraseñas personal, **no aquí**.

---

## 8. Cadencias de rotación

| Secreto              | Cadencia                                                   | Disparadores extra                         |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `RESEND_API_KEY`     | 6 meses                                                    | Sospecha de filtración, salida de personal |
| Clave SSH deploy     | 12 meses                                                   | Robo de laptop, salida de personal         |
| GH Secrets (`VPS_*`) | con el SSH                                                 | Cambio de host/usuario                     |
| Token DNS Certbot    | 12 meses                                                   | Cambio de proveedor DNS                    |
| GHCR pull token      | 12 meses                                                   | Cambio del repo a público/privado          |
| Restic password      | NUNCA — destruir el repo y crear uno nuevo si hay sospecha | n/a                                        |

---

## 9. Auditoría trimestral

Cada 3 meses, revisar:

```bash
# 1. ¿Qué llaves SSH están autorizadas al usuario villadev?
ssh -p <PUERTO_SSH> villadev@<VPS_IP> "cat ~/.ssh/authorized_keys"
# → Confirmar que solo aparecen las que recuerdas. Eliminar entradas viejas.

# 2. GitHub repo → Settings → Secrets and variables → Actions.
#    Revisar que solo existan los 4 esperados (VPS_HOST/USER/PORT/SSH_KEY).
#    Revisar última fecha de uso si GitHub la expone.

# 3. Resend dashboard → API keys → listar.
#    Borrar las que no estés usando activamente.

# 4. CF (o Hostinger DNS) → API tokens → listar.
#    Borrar tokens caducos.

# 5. Revisar permisos de los .env:
ssh -p <PUERTO_SSH> villadev@<VPS_IP> 'ls -l /srv/villadev/.env /srv/villadev/.ghcr_token 2>/dev/null'
# → Ambos deben mostrar -rw------- villadev villadev.
```

Anota la auditoría con fecha en `docs/audits/YYYY-Qn.md` (puedes crear la
carpeta cuando hagas la primera). Mantén el registro al menos 12 meses.

---

## 10. Qué hacer si crees que un secreto se filtró

1. **No esperar a estar seguro.** Asumir compromiso.
2. Rotar el secreto **ya** siguiendo la sección correspondiente.
3. Revisar logs:
   - GH Actions runs recientes.
   - `docker logs villadev-app --since 24h`.
   - Resend dashboard → cuántos envíos en últimas 24h.
   - `last -i` en el VPS, `journalctl _COMM=sshd`.
4. Si la filtración fue por commit, hacer `git rm` + reescritura de historia
   (BFG / git filter-repo) y un push forzado. Avisar a quien tenga el repo
   clonado para que rebase.
5. Documentar en `docs/incidents/YYYY-MM-DD-<slug>.md`.
