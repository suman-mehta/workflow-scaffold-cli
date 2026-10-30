#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function printHelp() {
  console.log(`workflow-scaffold – Zero‑dependency workflow automation CLI

Usage:
  workflow-scaffold init               Create a default workflow config
  workflow-scaffold generate <name>   Scaffold a new component
  workflow-scaffold run               Execute defined scripts
  workflow-scaffold -h | --help       Show help`);
}

function initConfig() {
  const configPath = resolve(process.cwd(), ".workflow-config.json");
  if (existsSync(configPath)) {
    console.error("Config already exists at", configPath);
    process.exit(1);
  }
  const defaultConfig = {
    scripts: {
      build: "echo Building...",
      test: "echo Running tests..."
    },
    templates: {
      component: "export const {{name}} = () => {
  // TODO
};
"
    }
  };
  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log("Created .workflow-config.json");
}

function generateComponent(name) {
  const configPath = resolve(process.cwd(), ".workflow-config.json");
  if (!existsSync(configPath)) {
    console.error("Missing .workflow-config.json – run init first");
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const template = config.templates?.component;
  if (!template) {
    console.error("No component template defined");
    process.exit(1);
  }
  const content = template.replace(/{{name}}/g, name);
  const outDir = resolve(process.cwd(), "src", name);
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `${name}.js`);
  writeFileSync(outFile, content);
  console.log(`Component scaffolded at ${outFile}`);
}

function runScripts() {
  const configPath = resolve(process.cwd(), ".workflow-config.json");
  if (!existsSync(configPath)) {
    console.error("Missing .workflow-config.json – run init first");
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const scripts = config.scripts || {};
  for (const [name, cmd] of Object.entries(scripts)) {
    console.log(`▶️  Running "${name}"`);
    const result = spawnSync(cmd, { shell: true, stdio: "inherit" });
    if (result.status !== 0) {
      console.error(`Script "${name}" failed`);
      process.exit(result.status ?? 1);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || ["-h", "--help"].includes(args[0])) {
    printHelp();
    process.exit(0);
  }
  const command = args[0];
  switch (command) {
    case "init":
      initConfig();
      break;
    case "generate":
      if (!args[1]) {
        console.error("Missing component name");
        process.exit(1);
      }
      generateComponent(args[1]);
      break;
    case "run":
      runScripts();
      break;
    default:
      console.error(`Unknown command "${command}"`);
      printHelp();
      process.exit(1);
  }
  process.exit(0);
}

if (import.meta.url === `file://${__filename}`) {
  main();
}
