---
description: "Do not execute background commands; provide them for the user to run manually"
---
# Strict Execution Policy

1. **NEVER execute terminal/shell commands in the background or foreground via `run_command`.**
2. Specifically when the user says **"git ki send cheyu"**, "push to git", "deploy", "build", etc., **DO NOT run git commands or background tasks yourself.**
3. **Always output the exact terminal commands in a clean, copyable code block** so the user can manually copy and run them in their terminal.
4. If a VPS action is required, explicitly state the VPS details (e.g., `ssh root@66.116.252.191`) and the exact commands to run.
