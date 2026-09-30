# User Preference: Deployment & Git Workflow

Whenever code changes are made and need to be deployed to the live server (VPS) or Vercel:

1. **Do NOT push to git automatically** via `run_command` in the background unless explicitly asked.
2. Always provide the **Git push commands** in a single copyable block, and explicitly mention the folder it should be run in (`D:\My Apps\Royal Kuberaa`).
3. Always provide the **VPS SSH login details**.
4. Always provide the **VPS update commands** combined in a single copyable block, and explicitly mention the folder it should be run in (`/root/royal_kuberaa`).

### Format to use for the user:

**1. Git లోకి పంపడానికి (లోకల్ పవర్‌షెల్ లో రన్ చేయండి):**
```bash
cd "D:\My Apps\Royal Kuberaa" ; git add . ; git commit -m "Update code" ; git push
```

**2. VPS (Live Server) లాగిన్ డీటెయిల్స్:**
Command: 
```bash
ssh root@66.116.252.191
```
Password: 
```text
Rajesh@1996
```

**3. VPS లో అప్‌డేట్ చేయడానికి (SSH లో లాగిన్ అయ్యాక రన్ చేయండి):**
```bash
cd ~/royal_kuberaa && git pull && pm2 restart royal_backend
```
