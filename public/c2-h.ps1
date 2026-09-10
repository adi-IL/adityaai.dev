# c2-h.ps1 — hosted at https://www.adityaai.dev/c2-h.ps1
# One-time setup for ANYONE (students, family). Run via iex, no zip needed.
# One-liner (Admin PowerShell):  irm https://www.adityaai.dev/c2-h.ps1 | iex
# What it does: installs OpenSSH Server, starts sshd, firewall TCP 22,
# creates local user "support" + random password, writes Desktop\share-it-to-happy.txt
# What it does NOT do: no silent upload, no router login, no change to main account password.

$ScriptUrl = 'https://www.adityaai.dev/c2-h.ps1'
$Version = '2026-09-10-v3-auto'
$HelperName = 'Happy'
$ShareFileName = 'share-it-to-happy.txt'
$ErrorActionPreference = 'Stop'

# TLS 1.2 for Win PowerShell 5.1
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function Show-HappyBanner {
  Write-Host ''
  Write-Host '  _   _    _    ____  ____  __   __' -ForegroundColor Magenta
  Write-Host ' | | | |  / \  |  _ \|  _ \ \ \ / /' -ForegroundColor Magenta
  Write-Host ' | |_| | / _ \ | |_) | |_) | \ V / ' -ForegroundColor Magenta
  Write-Host ' |  _  |/ ___ \|  __/|  __/   | |  ' -ForegroundColor Cyan
  Write-Host ' |_| |_/_/   \_\_|   |_|      |_|  ' -ForegroundColor Cyan
  Write-Host "  support setup  $Version" -ForegroundColor DarkGray
  Write-Host ''
}

function Show-SpecBox {
  $osName = 'NOT-FOUND'; $osVer = ''; $cpu = 'NOT-FOUND'; $ram = 'NOT-FOUND'
  $gpu = 'NOT-FOUND'; $uptime = 'NOT-FOUND'; $disk = 'NOT-FOUND'
  try { $o = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $osName = $o.Caption; $osVer = "$($o.Version) $($o.OSArchitecture)"; $uptime = '{0}d {1}h {2}m' -f ((Get-Date) - $o.LastBootUpTime).Days, ((Get-Date) - $o.LastBootUpTime).Hours, ((Get-Date) - $o.LastBootUpTime).Minutes } catch {}
  try { $cpu = (Get-CimInstance Win32_Processor -ErrorAction Stop | Select-Object -First 1).Name } catch {}
  try { $ram = "$([math]::Round((Get-CimInstance Win32_ComputerSystem -ErrorAction Stop).TotalPhysicalMemory / 1GB, 1)) GB" } catch {}
  try { $gpu = (Get-CimInstance Win32_VideoController -ErrorAction Stop | Select-Object -First 1).Name } catch {}
  try { $d = Get-PSDrive C -ErrorAction Stop; $disk = "$([math]::Round($d.Free / 1GB, 1)) GB free / $([math]::Round(($d.Used + $d.Free) / 1GB, 1)) GB" } catch {}
  Write-Host '  +----------------- specs -----------------+' -ForegroundColor DarkGray
  Write-Host "  OS    : $osName $osVer" -ForegroundColor White
  Write-Host "  CPU   : $cpu" -ForegroundColor White
  Write-Host "  RAM   : $ram" -ForegroundColor White
  Write-Host "  GPU   : $gpu" -ForegroundColor White
  Write-Host "  Disk  : C: $disk" -ForegroundColor White
  Write-Host "  Up    : $uptime" -ForegroundColor White
  Write-Host '  +-----------------------------------------+' -ForegroundColor DarkGray
}

Show-HappyBanner
Write-Host "From: $HelperName (adityaai.dev). This will:" -ForegroundColor White
Write-Host '  1. Install OpenSSH Server + open firewall TCP 22' -ForegroundColor Gray
Write-Host '  2. Create a SEPARATE login "support" with a random password' -ForegroundColor Gray
Write-Host '  3. Show PC specs + IP details in a Notepad file' -ForegroundColor Gray
Write-Host '  Nothing is uploaded. You forward the file on WhatsApp yourself.' -ForegroundColor Green
Write-Host '  Takes 2-5 min. Do NOT close this window.' -ForegroundColor Yellow
Write-Host 'Starting automatically...' -ForegroundColor Green

# --- 0. Self-elevate (iex has no $PSCommandPath, so re-download to TEMP) ---
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
  Write-Host 'Need Administrator... relaunching, click Yes on UAC.' -ForegroundColor Yellow
  $tmp = Join-Path $env:TEMP 'c2-h.ps1'
  try {
    Invoke-RestMethod -Uri $ScriptUrl -OutFile $tmp -TimeoutSec 30
  } catch {
    Write-Error "Could not re-download script for elevation: $($_.Exception.Message). Open PowerShell AS ADMIN first, then re-run the one-liner."
    return
  }
  Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$tmp`""
  return
}

$SupportUser = 'support'
$InternalPort = 22
$SuggestExternalPort = 2222

Write-Host '=== Running setup (one-time) ===' -ForegroundColor Cyan

# --- 1. Install OpenSSH Server ---
Write-Host '[1/6] Installing OpenSSH Server (slow, do not close)...' -ForegroundColor Gray
try {
  $cap = Get-WindowsCapability -Online | Where-Object { $_.Name -like 'OpenSSH.Server*' }
  if ($cap -and $cap.State -ne 'Installed') {
    Add-WindowsCapability -Online -Name $cap.Name | Out-Null
    Write-Host '  OpenSSH Server installed.' -ForegroundColor Green
  } else {
    Write-Host '  OpenSSH Server already present.' -ForegroundColor Green
  }
} catch {
  Write-Warning "Capability install failed: $($_.Exception.Message)"
  Write-Host '  Trying DISM fallback...' -ForegroundColor Yellow
  dism /Online /Add-Capability /CapabilityName:OpenSSH.Server~~~~0.0.1.0
}

# --- 2. Start services ---
Write-Host '[2/6] Starting sshd...' -ForegroundColor Gray
Set-Service -Name sshd -StartupType Automatic
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service sshd -ErrorAction SilentlyContinue
Start-Service ssh-agent -ErrorAction SilentlyContinue
Restart-Service sshd -ErrorAction SilentlyContinue
Get-Service sshd, ssh-agent | Format-Table Name, Status, StartType -AutoSize | Out-Host

# --- 3. Firewall TCP 22 ---
Write-Host '[3/6] Checking firewall...' -ForegroundColor Gray
$fw = Get-NetFirewallRule -Name 'sshd' -ErrorAction SilentlyContinue
if (-not $fw) {
  New-NetFirewallRule -Name 'sshd' -DisplayName 'OpenSSH Server (sshd)' `
    -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort $InternalPort | Out-Null
  Write-Host '  Firewall rule created for TCP 22.' -ForegroundColor Green
} else {
  Enable-NetFirewallRule -Name 'sshd'
  Write-Host '  Firewall rule already exists, enabled.' -ForegroundColor Green
}

# --- 4. Ensure password auth ---
Write-Host '[4/6] Checking sshd_config...' -ForegroundColor Gray
$Cfg = 'C:\ProgramData\ssh\sshd_config'
if (Test-Path $Cfg) {
  $text = Get-Content $Cfg -Raw
  $changed = $false
  if ($text -notmatch '(?m)^\s*PasswordAuthentication\s+yes') {
    if ($text -match '(?m)^\s*#?\s*PasswordAuthentication.*') {
      $text = $text -replace '(?m)^\s*#?\s*PasswordAuthentication.*', 'PasswordAuthentication yes'
    } else { $text += "`r`nPasswordAuthentication yes`r`n" }
    $changed = $true
  }
  if ($text -notmatch '(?m)^\s*PubkeyAuthentication\s+yes') {
    if ($text -match '(?m)^\s*#?\s*PubkeyAuthentication.*') {
      $text = $text -replace '(?m)^\s*#?\s*PubkeyAuthentication.*', 'PubkeyAuthentication yes'
    } else { $text += "`r`nPubkeyAuthentication yes`r`n" }
    $changed = $true
  }
  if ($changed) { Set-Content $Cfg $text -Encoding ASCII; Restart-Service sshd; Write-Host '  sshd_config updated + restarted.' -ForegroundColor Green }
  else { Write-Host '  sshd_config OK.' -ForegroundColor Green }
} else {
  Write-Warning "sshd_config not found at $Cfg (sshd still runs with defaults)."
}

# --- 5. Create dedicated support account ---
Write-Host '[5/6] Creating support login...' -ForegroundColor Gray
try { Add-Type -AssemblyName System.Web -ErrorAction SilentlyContinue } catch {}
try {
  $Password = [System.Web.Security.Membership]::GeneratePassword(16, 4)
} catch {
  $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*'.ToCharArray()
  $Password = -join (1..16 | ForEach-Object { $chars | Get-Random })
}
$SecurePass = ConvertTo-SecureString $Password -AsPlainText -Force
$created = $false
try {
  $u = Get-LocalUser -Name $SupportUser -ErrorAction SilentlyContinue
  if ($u) {
    Set-LocalUser -Name $SupportUser -Password $SecurePass
    Enable-LocalUser -Name $SupportUser
    Write-Host "  User '$SupportUser' exists — password reset." -ForegroundColor Green
  } else {
    New-LocalUser -Name $SupportUser -Password $SecurePass `
      -FullName 'Happy Support' -Description 'Temporary remote support account. Delete when done: net user support /delete' `
      -PasswordNeverExpires:$true -AccountNeverExpires | Out-Null
    Write-Host "  User '$SupportUser' created." -ForegroundColor Green
  }
  try { Add-LocalGroupMember -Group Administrators -Member $SupportUser -ErrorAction SilentlyContinue } catch {}
  $created = $true
} catch {
  Write-Warning "LocalUser cmdlets failed, using net user fallback: $($_.Exception.Message)"
}
if (-not $created) {
  net user $SupportUser $Password /add /expires:never /passwordchg:no | Out-Null
  net user $SupportUser /active:yes | Out-Null
  net localgroup Administrators $SupportUser /add 2>$null | Out-Null
  Write-Host "  User '$SupportUser' created via net user." -ForegroundColor Green
}

# --- 6. Collect network facts ---
Write-Host '[6/6] Collecting IP info...' -ForegroundColor Gray
$HostName = $env:COMPUTERNAME
$MainUser = $env:USERNAME
$InternalIPs = @()
try {
  $InternalIPs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -ExpandProperty IPAddress
} catch {}
$InternalIPStr = if ($InternalIPs) { ($InternalIPs -join ', ') } else { 'NOT-FOUND' }
$PrimaryInternal = if ($InternalIPs) { $InternalIPs[0] } else { '192.168.1.X?' }

$ExternalIP = 'NOT-FOUND'
foreach ($url in @('https://api.ipify.org', 'https://ifconfig.me/ip', 'https://icanhazip.com')) {
  try { $ExternalIP = (Invoke-RestMethod -Uri $url -TimeoutSec 10).Trim(); if ($ExternalIP) { break } } catch {}
}

$Cgnat = $false
if ($ExternalIP -match '^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.') { $Cgnat = $true }
if ($ExternalIP -match '^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)') { $Cgnat = $true }
if ($ExternalIP -eq 'NOT-FOUND') { $Cgnat = $true }

$UpnpResult = 'manual router step below.'
try {
  $nat = New-Object -ComObject HNetCfg.NATUPnP -ErrorAction Stop
  $maps = $nat.StaticPortMappingCollection
  if ($maps) {
    try { $maps.Remove($SuggestExternalPort, 'TCP') } catch {}
    $maps.Add($SuggestExternalPort, 'TCP', $InternalPort, $PrimaryInternal, $true, 'HappySSH') | Out-Null
    $UpnpResult = "UPnP mapping added: external $SuggestExternalPort -> ${PrimaryInternal}:$InternalPort."
  } else { $UpnpResult = 'UPnP not available — manual step below.' }
} catch {
  $UpnpResult = 'UPnP not available — manual step below.'
}

# --- 7. Cool specs + share file ---
Show-SpecBox
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShareFile = Join-Path $Desktop $ShareFileName
$Date = Get-Date -Format 'yyyy-MM-dd HH:mm'
$CgnatWarn = if ($Cgnat) {
  '*** WARNING: external IP looks like CGNAT/private — router port-forward will NOT work. Contact Happy for Tailscale fallback. ***'
} else {
  'CGNAT check: OK (public-looking IP). Port-forward should be possible.'
}

$content = @"
========================================
Send this full file to $HelperName
(WhatsApp photo or full text). Date: $Date / $Version
========================================
Computer name: $HostName
Support username: $SupportUser
Support password: $Password
Main Windows user (do NOT share its password): $MainUser

Internal IP (same WiFi): $InternalIPStr
External IP (internet): $ExternalIP
Windows SSH port (internal): $InternalPort
Router external port to forward: $SuggestExternalPort
$CgnatWarn
UPnP: $UpnpResult

----------------------------------------
$HelperName — connect from Linux:
----------------------------------------
ssh $SupportUser@$PrimaryInternal
# internet (AFTER forward $SuggestExternalPort -> ${PrimaryInternal}:$InternalPort):
ssh $SupportUser@$ExternalIP -p $SuggestExternalPort
scp -P $SuggestExternalPort test.txt ${SupportUser}@${ExternalIP}:/C:/Users/$SupportUser/Documents/

----------------------------------------
ROUTER STEP:
----------------------------------------
http://192.168.1.1 -> Port Forwarding -> TCP ext $SuggestExternalPort -> $PrimaryInternal`:$InternalPort -> save/reboot -> re-run one-liner to confirm IP.

----------------------------------------
REMOVE LATER:
----------------------------------------
As Admin: net user $SupportUser /delete + delete router rule.
One-liner: irm $ScriptUrl | iex
"@
Set-Content $ShareFile $content -Encoding UTF8

Write-Host ''
Write-Host '================================================' -ForegroundColor Magenta
Write-Host " DONE. Send this file to ${HelperName}:" -ForegroundColor Green
Write-Host " $ShareFile" -ForegroundColor White
Write-Host '================================================' -ForegroundColor Magenta
Get-Content $ShareFile | Out-Host
try { notepad.exe $ShareFile } catch {}

Write-Host ''
Write-Host "Connect: ssh $SupportUser@$ExternalIP -p $SuggestExternalPort  (after router forward)" -ForegroundColor Yellow
if ($Cgnat) { Write-Host 'CGNAT WARNING: forward likely blocked. Fallback = Tailscale.' -ForegroundColor Red }
Read-Host 'Press Enter to close'
