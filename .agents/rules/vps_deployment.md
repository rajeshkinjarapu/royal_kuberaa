# Strict User Rule: VPS Login Details & Deployment Workflow

Whenever code changes are made and need to be deployed, you MUST follow this format EVERY SINGLE TIME without fail. The user has set this as a permanent, non-negotiable rule.

### Mandatory Rules:
1. **Never run git or VPS commands in the background**: The user manually copies and runs all commands in their own terminal.
2. **Always provide full VPS Login Details**: IP, Username, and Password must be displayed every single time VPS updates are mentioned.
3. **Single Copy-Pasteable Command**: All VPS commands must be chained together so the user can copy-paste and run in one go.

---

### Standard Deployment Template to Provide to User:

#### 1️⃣ Local Terminal (VS Code / PowerShell):
Folder: `d:\My Apps\Royal Kuberaa`
```bash
git add .
git commit -m "<Clear description of changes>"
git push
```

#### 2️⃣ VPS (Live Server) Login Details:
- **Host / IP**: `66.116.252.191`
- **User**: `root`
- **SSH Command**:
```bash
ssh root@66.116.252.191
```
- **Password**:
```text
Rajesh@1996
```

#### 3️⃣ VPS Update & Restart Command (Run in SSH Terminal):
```bash
cd ~/royal_kuberaa && git pull origin main && pm2 restart all
```
*(Alternative if backend dependencies changed)*:
```bash
cd ~/royal_kuberaa && git pull origin main && cd mlm_backend && npm install && cd .. && pm2 restart all
```
