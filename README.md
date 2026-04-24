# copilot-skills

[![npm version](https://img.shields.io/npm/v/copilot-skills.svg)](https://www.npmjs.com/package/copilot-skills)
[![npm downloads](https://img.shields.io/npm/dm/copilot-skills.svg)](https://www.npmjs.com/package/copilot-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js ≥18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![CI](https://github.com/phlx0/copilot-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/phlx0/copilot-skills/actions/workflows/ci.yml)

**Install and manage AI agent skills for GitHub Copilot — and any AI coding tool.**

[antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) (34k+ ⭐) indexes skills for every major AI coding tool. GitHub Copilot was the one tool with no installer. `copilot-skills` fills that gap.

```sh
npx copilot-skills add brainstorming
npx copilot-skills add openai:gh-address-comments
npx copilot-skills add https://github.com/google-labs-code/stitch-skills/tree/main/skills/stitch-design
npx copilot-skills info brainstorming
npx copilot-skills search design --all
```

Skills are installed to `~/.copilot/skills/<name>/SKILL.md` — exactly where VS Code Copilot picks them up.

---

## Installation

**No install required** — use `npx`:

```sh
npx copilot-skills <command>
```

Or install globally:

```sh
npm install -g copilot-skills
```

---

## Commands

### `add <source>`

Install a skill from a registry, GitHub URL, or local path.

```sh
# From the default registry (antigravity-awesome-skills)
npx copilot-skills add brainstorming
npx copilot-skills add code-review

# From a named registry (registry:skill)
npx copilot-skills add openai:gh-address-comments
npx copilot-skills add openai:pr-description

# From a GitHub URL (tree or blob link)
npx copilot-skills add https://github.com/google-labs-code/stitch-skills/tree/main/skills/stitch-design

# From a GitHub repo path (owner/repo/path)
npx copilot-skills add sickn33/antigravity-awesome-skills/skills/brainstorming

# From a local directory
npx copilot-skills add ./my-skill
```

### `list`

Show all installed skills with descriptions and sources.

```sh
npx copilot-skills list
```

### `search <query>`

Search the registry index for available skills.

```sh
# Search default registry
npx copilot-skills search brainstorming

# Search a specific registry
npx copilot-skills search refactor --registry openai

# Search all registries at once
npx copilot-skills search design --all
```

### `info <source>`

Preview a skill — description, file list, and install command — without installing it.

```sh
npx copilot-skills info brainstorming
npx copilot-skills info openai:gh-address-comments
npx copilot-skills info https://github.com/google-labs-code/stitch-skills/tree/main/skills/stitch-design
```

### `update [name]`

Update a specific skill or all installed skills.

```sh
npx copilot-skills update brainstorming
npx copilot-skills update --all
```

### `registries`

List all available registry keys and their sources.

```sh
npx copilot-skills registries
```

### `remove <name>`

Uninstall a skill.

```sh
npx copilot-skills remove brainstorming
```

### Global options

All commands accept `--path` / `-p` to use a custom skills directory:

```sh
npx copilot-skills list --path ./project/.copilot/skills
```

---

## Registries

| Key | Source | Notes |
| --- | --- | --- |
| *(default)* | [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | 34k+ ⭐ · has index for fast search |
| `openai` | [openai/skills](https://github.com/openai/skills) | Codex / ChatGPT skills |
| `google` | [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | Stitch / Gemini design skills |
| `anthropic` | [anthropics/skills](https://github.com/anthropics/skills) | Claude skills |

---

## How it works

Skills are `SKILL.md` files (with optional supporting assets) that instruct an AI coding agent how to perform a specialized task. GitHub Copilot in VS Code automatically picks up any `.md` file under `~/.copilot/skills/`.

`copilot-skills` handles:

- **Discovery** — searching indexed registries by keyword
- **Install** — downloading skill files from GitHub via the Contents API
- **Manifest** — tracking installed skills in `~/.copilot/skills/.manifest.json`
- **Updates** — re-fetching skills from their original sources
- **Security** — sanitizing skill names and file paths to prevent directory traversal

---

## Environment variables

| Variable | Description |
| --- | --- |
| `GITHUB_TOKEN` | Optional. Increases GitHub API rate limit from 60 to 5000 req/h |

---

## Contributing

PRs welcome! To add a new registry, open an issue or PR editing `src/lib/registry.js`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

[MIT](LICENSE) © 2025 phlx0
