import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { getManifestPath, getSkillDir, sanitizeFilePath } from './paths.js';
import { writeFile, mkdir, rm } from 'node:fs/promises';

export async function readManifest(skillsDir) {
  const p = getManifestPath(skillsDir);
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { version: '1', skills: {} };
  }
}

export async function writeManifest(skillsDir, manifest) {
  await mkdir(skillsDir, { recursive: true });
  await writeFile(
    getManifestPath(skillsDir),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

export async function writeSkillFile(
  skillsDir,
  skillName,
  relativePath,
  content
) {
  const safe = sanitizeFilePath(relativePath);
  const skillDir = getSkillDir(skillsDir, skillName);
  const dest = join(skillDir, safe);

  const parentDir = dest.substring(0, dest.lastIndexOf('/'));
  await mkdir(parentDir || skillDir, { recursive: true });
  await writeFile(dest, content, 'utf8');
}

export async function removeSkill(skillsDir, skillName) {
  const skillDir = getSkillDir(skillsDir, skillName);
  await rm(skillDir, { recursive: true, force: true });
}

export async function listInstalledSkills(skillsDir) {
  if (!existsSync(skillsDir)) return [];

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const skillMdPath = join(skillsDir, entry.name, 'SKILL.md');
    if (!existsSync(skillMdPath)) continue;

    try {
      const content = await readFile(skillMdPath, 'utf8');
      const meta = parseSkillFrontmatter(content);
      skills.push({
        name: entry.name,
        description: meta.description || '',
        ...meta
      });
    } catch {
      skills.push({
        name: entry.name,
        description: '(could not parse SKILL.md)'
      });
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseSkillFrontmatter(content) {
  if (typeof content !== 'string') return {};
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return yaml.load(match[1]) || {};
  } catch {
    return {};
  }
}

export function validateSkillMd(content) {
  const warnings = [];

  if (!content.trimStart().startsWith('---')) {
    warnings.push('Missing YAML frontmatter (file should start with ---)');
    return warnings;
  }

  const meta = parseSkillFrontmatter(content);

  if (!meta.name) {
    warnings.push('Missing required frontmatter field: name');
  } else if (!/^[a-z0-9][a-z0-9-]*$/.test(meta.name)) {
    warnings.push(
      `name "${meta.name}" should be lowercase alphanumeric + hyphens`
    );
  }

  if (!meta.description) {
    warnings.push('Missing recommended frontmatter field: description');
  } else if (meta.description.length > 1024) {
    warnings.push(
      `description is ${meta.description.length} chars (max 1024 recommended)`
    );
  }

  return warnings;
}
