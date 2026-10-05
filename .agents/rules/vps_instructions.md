---
description: "Guidelines for providing VPS instructions to the user"
---
# VPS Instructions Guidelines

Whenever asking the user to run commands on their VPS:
1. ALWAYS provide the VPS connection details first (e.g., `ssh root@66.116.252.191`).
2. DO NOT provide commands in multiple separate code blocks.
3. ALWAYS combine all required commands into a single, copy-pasteable code block connected by `&&` or on separate lines so they can execute everything at once.

Example:
```bash
ssh root@66.116.252.191
# Once logged in, run:
cd ~/royal_kuberaa && git pull origin main && pm2 restart all
```
