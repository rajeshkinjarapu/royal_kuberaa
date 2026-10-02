# User Preference: Deployment & Git Workflow

Whenever code changes are made and need to be deployed to the live server (VPS) or Vercel:

1. **IMPORTANT:** The user strictly requires manual control over VPS updates. Whenever you tell the user to run commands on their VPS, you MUST provide the VPS SSH details every single time without fail.
2. First, provide the **Git push commands** to update the frontend on Vercel. Explicitly mention the folder it should be run in (`d:\My Apps\Royal Kuberaa`).
3. Second, **ALWAYS provide the VPS SSH login details** (as shown below) because the user needs them to log in and restart the backend.
4. Third, provide the **VPS update commands** combined in a single copyable block, and explicitly mention the folder it should be run in (`/root/royal_kuberaa`).

### Format to use for the user:

**1. Frontend (Vercel) కోసం Git లోకి పంపడానికి (లోకల్ పవర్‌షెల్ లో రన్ చేయండి):**
```bash
cd "d:\My Apps\Royal Kuberaa"
git add .
git commit -m "Update code"
git push
```

**2. Backend & Database కోసం VPS (Live Server) లాగిన్ డీటెయిల్స్ (ఇది కచ్చితంగా ఇవ్వాలి):**
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
cd ~/royal_kuberaa && git pull && cd mlm_backend && npm install && pm2 restart royal_backend
```
