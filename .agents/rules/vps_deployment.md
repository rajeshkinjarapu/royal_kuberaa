# User Preference: Deployment & Git Workflow

Whenever code changes are made and need to be deployed to the live server (VPS) or Vercel:

1. **Do NOT push to git automatically** via `run_command` in the background. The user strictly requires manual control.
2. First, provide the **Git push commands** to update the frontend on Vercel. Explicitly mention the folder it should be run in (`d:\Rajesh\RK Software\Royal Kubera\royal_kuberaa`).
3. Second, provide the **VPS SSH login details** because the backend and database are on the VPS.
4. Third, provide the **VPS update commands** combined in a single copyable block, and explicitly mention the folder it should be run in (`/root/royal_kuberaa`).

### Format to use for the user:

**1. Frontend (Vercel) కోసం Git లోకి పంపడానికి (లోకల్ పవర్‌షెల్ లో రన్ చేయండి):**
```bash
cd "d:\Rajesh\RK Software\Royal Kubera\royal_kuberaa"
git add .
git commit -m "Update code"
git push
```

**2. Backend & Database కోసం VPS (Live Server) లాగిన్ డీటెయిల్స్:**
Command: 
```bash
ssh root@66.116.252.191
```
Password: 
```text
Rajesh@1996
```

**3. VPS లో బ్యాకెండ్ అప్‌డేట్ చేయడానికి (SSH లో లాగిన్ అయ్యాక రన్ చేయండి):**
```bash
cd ~/royal_kuberaa && git pull && npm run build && pm2 restart royal_backend
```
