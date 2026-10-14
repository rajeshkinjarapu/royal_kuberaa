---
description: "Strict rule: Guidelines for providing VPS instructions and credentials to the user"
---
# VPS Instructions & Login Rule (Permanent & Mandatory)

Whenever providing VPS details or asking the user to run commands on their VPS, you MUST provide them in this exact copy-pasteable format EVERY SINGLE TIME without exception:

### 1️⃣ SSH Command (Copy & Run to Connect):
```bash
ssh root@66.116.252.191
```

### 2️⃣ Password (Copy & Paste when prompted):
```text
Rajesh@1996
```

### 3️⃣ Single Update & Restart Command (Run in SSH Terminal):
```bash
cd ~/royal_kuberaa && git pull origin main && pm2 restart all
```
*(If dependencies changed)*:
```bash
cd ~/royal_kuberaa && git pull origin main && cd mlm_backend && npm install && cd .. && pm2 restart all
```

