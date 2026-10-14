---
description: "Guidelines for providing VPS instructions and credentials to the user"
---
# VPS Instructions Guidelines

Whenever asking the user to run commands on their VPS:
1. ALWAYS provide the VPS connection details and password first:
   - **SSH Command**: `ssh root@66.116.252.191`
   - **Password**: `Rajesh@1996`
2. DO NOT provide commands in multiple separate code blocks.
3. ALWAYS combine all required commands into a single, copy-pasteable code block connected by `&&` so the user can execute everything at once:
```bash
cd ~/royal_kuberaa && git pull origin main && pm2 restart all
```
