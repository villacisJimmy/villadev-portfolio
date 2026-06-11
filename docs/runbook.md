# Runbook — villadev portfolio (Fase 1)

Procedimientos operacionales para el sitio en el VPS. Todos los comandos asumen
que has hecho SSH como `villadev` al VPS, y que el árbol de despliegue vive en
`/srv/villadev`. Sustituye `<VPS_IP>`, `<PUERTO_SSH>` y `villadev.tld` por los
valores reales.

## 1. Referencia rápida de arquitectura

```
Internet ──▶ Cloudflare ──▶ Nginx (443) ──▶ Container villadev-app (127.0.0.1:3001)
                                                  │
                                          /api/health  → 200 OK
                                          /contact     → Resend
```

- Host: VPS Hostinger, Ubuntu 22.04 LTS
- Puertos abiertos (UFW): `<PUERTO_SSH>`, 80, 443
- Container: `villadev-app`, imagen `ghcr.io/<USER_GH>/villadev-portfolio:<TAG>`
- Compose file: `/srv/villadev/compose.yaml`
- Env: `/srv/villadev/.env` (mode 600)
- Logs Nginx: `/var/log/nginx/villadev_access.log`, `/var/log/nginx/villadev_error.log`
- Logs container: `docker logs villadev-app`
- Backups: restic semanal vía cron del usuario `villadev`

## 2. Conexión al VPS

```bash
# Desde tu máquina (clave privada en ~/.ssh/villadev_deploy)
ssh -i ~/.ssh/villadev_deploy -p <PUERTO_SSH> villadev@<VPS_IP>
```

## 3. Operación diaria

### 3.1 Estado general

```bash
docker ps
docker compose -f /srv/villadev/compose.yaml ps
systemctl status nginx --no-pager
systemctl status fail2ban --no-pager
ufw status verbose
df -h /
```

### 3.2 Iniciar / parar / reiniciar el app

```bash
cd /srv/villadev

# Levantar (idempotente)
docker compose up -d

# Parar (mantiene volúmenes/red)
docker compose down

# Reinicio en frío
docker compose restart app
```

### 3.3 Ver logs

```bash
# App, últimas 200 líneas, seguir en vivo
docker logs villadev-app --tail 200 -f

# Nginx
sudo tail -f /var/log/nginx/villadev_access.log
sudo tail -f /var/log/nginx/villadev_error.log

# systemd: Nginx
sudo journalctl -u nginx -n 200 --no-pager

# systemd: Docker
sudo journalctl -u docker -n 200 --no-pager

# fail2ban (qué IPs ha baneado)
sudo fail2ban-client status sshd
sudo fail2ban-client status nginx-http-auth
```

### 3.4 Healthcheck manual

```bash
# Desde el host (debe responder 200)
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/api/health

# Externamente (debe responder 200 vía CF)
curl -fsS -o /dev/null -w "%{http_code}\n" https://villadev.tld/api/health
```

## 4. Despliegues

### 4.1 Despliegue manual (rollback o forzado)

GHA hace deploy automático en push a `main`. Para forzar/rollback manual:

```bash
cd /srv/villadev

export GHCR_OWNER="<USER_GH>"
export GHCR_REPO="villadev-portfolio"
export TAG="sha-<commit_sha_corto>"   # tag previo conocido bueno

./deploy.sh
```

`deploy.sh` hace `pull`, `up -d`, espera healthy hasta 90s, y aborta si queda
`unhealthy` mostrando los últimos 100 líneas del log del container.

### 4.2 Rollback rápido

1. Identifica el último tag bueno: `docker images | grep villadev-portfolio`
2. Re-despliega ese tag:
   ```bash
   cd /srv/villadev
   GHCR_OWNER="<USER_GH>" GHCR_REPO="villadev-portfolio" TAG="sha-<bueno>" ./deploy.sh
   ```
3. Verifica `/api/health` externo y mira un par de páginas.
4. Anota el incidente en la sección 11 de este runbook.

### 4.3 Apagar el sitio temporalmente (mantenimiento)

```bash
# Opción A: parar el container (Nginx devolverá 502)
cd /srv/villadev && docker compose down

# Opción B (preferida): retirar el vhost de sites-enabled
sudo rm /etc/nginx/sites-enabled/villadev.conf
sudo nginx -t && sudo systemctl reload nginx

# Reactivar
sudo ln -s /etc/nginx/sites-available/villadev.conf /etc/nginx/sites-enabled/villadev.conf
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Certificados TLS

Renovación automática vía `certbot.timer` (DNS-01). Para verificar / forzar:

```bash
# Listar certs
sudo certbot certificates

# Simulación de renovación (no toca disco real)
sudo certbot renew --dry-run

# Forzar renovación real (con prudencia, hay rate limit de LE)
sudo certbot renew --force-renewal

# Hooks: el hook post-renewal recarga Nginx automáticamente.
# Si lo configuraste con --deploy-hook 'systemctl reload nginx', verifícalo:
sudo systemctl cat certbot.service | head -40
```

Si el sitio sirve un cert expirado, la causa típica es token DNS rotado sin
actualizar `/etc/letsencrypt/secrets/*.ini`. Ver `secrets-setup.md`.

## 6. Backups y restauración

### 6.1 Listar snapshots

```bash
source ~/.config/restic/env
restic snapshots
```

### 6.2 Restaurar último snapshot a un directorio temporal

```bash
source ~/.config/restic/env
restic restore latest --target /tmp/restore
ls -la /tmp/restore
```

### 6.3 Restaurar archivos concretos

```bash
# .env de la app
sudo cp /tmp/restore/villadev.env /srv/villadev/.env
sudo chown villadev:villadev /srv/villadev/.env
sudo chmod 600 /srv/villadev/.env

# Vhost de Nginx
sudo cp /tmp/restore/villadev.nginx.conf /etc/nginx/sites-available/villadev.conf
sudo nginx -t && sudo systemctl reload nginx

# Let's Encrypt
sudo tar -C / -xzf /tmp/restore/letsencrypt.tar.gz
sudo systemctl reload nginx
```

### 6.4 Verificar integridad del repo restic

```bash
source ~/.config/restic/env
restic check
```

### 6.5 Snapshot del VPS desde Hostinger

Hostinger ofrece snapshot manual desde su panel:

1. Panel Hostinger → VPS → tu VPS → pestaña Snapshots.
2. Crear snapshot manual antes de un cambio mayor (cambio de kernel, migración Postgres, etc.).
3. Anotar fecha y razón. El snapshot ocupa cuota — eliminar viejos cuando ya no apliquen.

## 7. Diagnóstico

### 7.1 502 Bad Gateway

```bash
# 1. ¿El container está arriba?
docker ps --filter name=villadev-app

# 2. ¿Healthy?
docker inspect -f '{{.State.Health.Status}}' villadev-app

# 3. ¿Responde en loopback?
curl -v http://127.0.0.1:3001/api/health

# 4. Si curl loopback responde 200 pero Nginx 502, revisa nginx error log
sudo tail -n 50 /var/log/nginx/villadev_error.log

# 5. Si curl loopback falla, mira logs del container
docker logs villadev-app --tail 200
```

Causas comunes:

- Container reiniciándose por OOM → ver `dmesg | tail`, considerar subir `mem_limit`.
- `.env` mal formado → el container no arranca, log lo dirá.
- Puerto colisiona con otra app vecina del VPS → confirmar que `3001` es exclusivo del proyecto (ver MEMORIA del VPS multi-tenant).

### 7.2 Rate-limit golpea a usuarios reales

Síntoma: usuarios reportan 503 / "Demasiadas solicitudes" mientras navegan.

```bash
# 1. Verificar qué IP ve Nginx
sudo tail -n 50 /var/log/nginx/villadev_access.log
# Si todas las requests vienen de IPs de Cloudflare → set_real_ip_from no está
# capturando los prefijos actuales de CF (raros, pero CF los publica).

# 2. Actualizar prefijos CF si es el caso
curl -fsS https://www.cloudflare.com/ips-v4

# 3. Comparar con villadev.conf y editar:
sudo nano /etc/nginx/sites-available/villadev.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 7.3 Resend no envía

```bash
# 1. ¿La API key vive en .env?
sudo grep -c RESEND_API_KEY /srv/villadev/.env

# 2. ¿El container la ve?
docker exec villadev-app env | grep RESEND
# (debería imprimir la clave; si no, recrear el container con docker compose up -d)

# 3. ¿El dominio sigue verificado?
# → Resend dashboard → Domains → comprobar DKIM/SPF/DMARC en verde.

# 4. Logs de la app filtrando contact
docker logs villadev-app --tail 500 | grep -i "contact\|resend"
```

### 7.4 fail2ban bloqueó tu IP por error

```bash
# Estado
sudo fail2ban-client status sshd

# Desbloquear una IP concreta
sudo fail2ban-client set sshd unbanip <TU_IP>
```

## 8. Mantenimiento periódico

| Cadencia   | Tarea                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------- |
| Semanal    | Revisar `df -h`, `docker images`, snapshots restic, último access log                    |
| Mensual    | `sudo apt update && apt list --upgradable`, revisión de `fail2ban-client banned`         |
| Trimestral | Auditoría de `/home/villadev/.ssh/authorized_keys` y GH Secrets (ver `secrets-setup.md`) |
| Semestral  | Rotar `RESEND_API_KEY`                                                                   |
| Anual      | Rotar clave SSH deploy, rotar token DNS de Certbot, rotar PAT/GHCR si aplica             |

## 9. Limpieza de imágenes Docker

`deploy.sh` ya hace prune de imágenes >72h al final de cada deploy. Manual:

```bash
docker image prune -af --filter "until=72h"
docker system df
```

## 10. Aislamiento multi-tenant del VPS

Este VPS aloja varias aplicaciones bajo la convención de aislamiento estricto:
usuario Linux dedicado, DB dedicado, subdominio, puerto, systemd unit, `.env`,
backup target y namespace de logs separados.

- Nuestro tramo: usuario `villadev`, puerto `3001`, subdirectorio `/srv/villadev`, vhost `villadev.conf`, namespace de logs `/var/log/nginx/villadev_*`.
- Antes de cambiar puertos o paths, verificar `ss -ltnp` para no chocar con un vecino.

## 11. Snapshots conocidos buenos

Llena esta tabla en cada release exitoso (la usarás para rollback rápido):

| Fecha (YYYY-MM-DD) | TAG (sha)      | Notas         |
| ------------------ | -------------- | ------------- |
| (pendiente launch) | `sha-________` | Primer launch |
|                    |                |               |

## 12. Escalado de incidentes

Contactos (placeholder — sustituir antes del launch):

- Dueño / on-call primario: `<NOMBRE_DUEÑO>` — `<EMAIL_PERSONAL>` — `<TEL>`
- Backup técnico: `<CONTACTO_BACKUP>`
- Resend support: <https://resend.com/support>
- Hostinger support: <https://www.hostinger.com/contact>
- Cloudflare support: <https://www.cloudflare.com/support/>

Severidades:

- **SEV-1**: sitio caído > 15 min, fuga de secretos confirmada, brecha de seguridad. Acción inmediata + snapshot Hostinger + investigación post-mortem en `docs/postmortems/`.
- **SEV-2**: degradación funcional (Resend off, formulario rechaza válidos). Diagnosticar en horas, no horas extras.
- **SEV-3**: cosmético / no bloqueante. Ticket en backlog.

## 13. Operaciones avanzadas

### 13.1 Acceder al shell del container (debug)

```bash
docker exec -it villadev-app /bin/sh
# Recuerda: fs read-only, así que no podrás escribir fuera de /tmp.
```

### 13.2 Volcar el `.env` efectivo (sin imprimirlo en chat)

```bash
docker exec villadev-app env | sort > /tmp/env-dump.txt
sudo chmod 600 /tmp/env-dump.txt
# Revisar localmente, NO pegar contenido en chats.
rm /tmp/env-dump.txt
```

### 13.3 Forzar recreación con misma imagen

```bash
cd /srv/villadev
docker compose up -d --force-recreate
```

### 13.4 Comprobar configuración Nginx sin recargar

```bash
sudo nginx -t
```
