import { homedir } from 'node:os';
import { join, resolve, normalize } from 'node:path';

export const DEFAULT_SKILLS_PATH = join(homedir(), '.copilot', 'skills');
export const MANIFEST_FILENAME = '.manifest.json';

export function getManifestPath(skillsDir) {
  return join(skillsDir, MANIFEST_FILENAME);
}

export function sanitizeSkillName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Skill name must be a non-empty string');
  }
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    throw new Error(`Invalid skill name: "${name}"`);
  }
  return sanitized;
}

export function getSkillDir(skillsDir, skillName) {
  const safe = sanitizeSkillName(skillName);
  return join(skillsDir, safe);
}

export function sanitizeFilePath(filePath) {
  const normalized = normalize(filePath).replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.startsWith('..')) {
    throw new Error(`Unsafe file path: "${filePath}"`);
  }
  const parts = normalized.split('/').filter((p) => p !== '..' && p !== '.');
  return parts.join('/');
}

export function resolveSkillsPath(customPath) {
  if (!customPath) return DEFAULT_SKILLS_PATH;
  if (customPath.startsWith('~/')) {
    return join(homedir(), customPath.slice(2));
  }
  return resolve(customPath);
}

export function displayPath(p) {
  const home = homedir();
  return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}
