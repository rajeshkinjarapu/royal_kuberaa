---
description: "Do not execute background commands; provide them for the user to run manually"
---
# Strict Execution Policy

1. Do NOT execute any terminal commands in the background (including git, ssh, pm2, or local commands).
2. Do NOT use the `run_command` tool.
3. Instead, whenever a command needs to be run (locally or on the VPS), provide the exact command in a markdown code block so the user can copy and execute it manually in their terminal.
4. If a VPS action is required, explicitly state the VPS details (e.g., `ssh root@66.116.252.191`) and the exact commands to run.
