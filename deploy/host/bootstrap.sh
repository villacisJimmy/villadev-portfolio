#!/usr/bin/env bash
# bootstrap.sh — idempotent VPS hardening for villadev portfolio app.
# Run as root, once. Re-runs are safe.
# Usage:
#   SSH_PORT=<port> APP_USER=villadev TIMEZONE=UTC bash bootstrap.sh
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
echo "${APP_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload nginx, /usr/bin/certbot" \
  > /etc/sudoers.d/${APP_USER}-ops
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
sed -i "s/^#*listen_addresses.*/listen_addresses = '127.0.0.1'/" /etc/postgresql/*/main/postgresql.conf || true
systemctl enable --now postgresql
systemctl restart postgresql

echo "==> /srv/villadev tree"
install -d -o "$APP_USER" -g "$APP_USER" -m 750 /srv/villadev
install -d -o "$APP_USER" -g "$APP_USER" -m 750 /var/backups/villadev

echo "==> done. Reboot recommended if kernel updated."
