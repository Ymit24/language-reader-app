#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");

const commands = [
  { name: "convex", cmd: "npx", args: ["convex", "dev"] },
  { name: "expo", cmd: "npm", args: ["run", "start"] },
];

const children = new Map();
let shuttingDown = false;

function spawnCommand({ name, cmd, args }) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  children.set(name, child);

  child.on("exit", (code, signal) => {
    children.delete(name);
    if (shuttingDown) return;

    shuttingDown = true;
    for (const other of children.values()) {
      try {
        other.kill("SIGINT");
      } catch {}
    }

    const exitCode = code ?? (signal ? 1 : 0);
    process.exit(exitCode);
  });

  child.on("error", () => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const other of children.values()) {
      try {
        other.kill("SIGINT");
      } catch {}
    }
    process.exit(1);
  });
}

for (const command of commands) {
  spawnCommand(command);
}

process.on("SIGINT", () => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children.values()) {
    try {
      child.kill("SIGINT");
    } catch {}
  }
  process.exit(0);
});
