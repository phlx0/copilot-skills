import chalk from 'chalk';
import { listInstalledSkills, readManifest } from '../lib/skills.js';
import { resolveSkillsPath, displayPath } from '../lib/paths.js';
import { existsSync } from 'node:fs';

export async function listCommand(options) {
  const skillsDir = resolveSkillsPath(options.path);

  if (!existsSync(skillsDir)) {
    console.log(chalk.yellow('No skills directory found.'));
    console.log(chalk.dim(`  Expected: ${displayPath(skillsDir)}`));
    console.log(
      chalk.dim(`  Install your first skill: copilot-skills add <skill-name>`)
    );
    return;
  }

  const [skills, manifest] = await Promise.all([
    listInstalledSkills(skillsDir),
    readManifest(skillsDir)
  ]);

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills installed.'));
    console.log(chalk.dim(`  Directory: ${displayPath(skillsDir)}`));
    console.log(
      chalk.dim(`  Install a skill: copilot-skills add <skill-name>`)
    );
    return;
  }

  console.log(
    `\n${chalk.bold(skills.length)} skill${skills.length === 1 ? '' : 's'} ` +
      `installed at ${chalk.dim(displayPath(skillsDir))}\n`
  );

  const colWidth = Math.min(
    Math.max(...skills.map((s) => s.name.length)) + 2,
    32
  );

  for (const skill of skills) {
    const entry = manifest.skills[skill.name];
    const namePart = chalk.cyan(skill.name.padEnd(colWidth));
    const desc = trunc(skill.description || '', 55);
    const source = entry?.source?.owner
      ? chalk.dim(` [${entry.source.owner}/${entry.source.repo}]`)
      : '';
    console.log(`  ${namePart}${chalk.dim(desc)}${source}`);
  }

  console.log('');
  console.log(
    chalk.dim('  copilot-skills update --all   # pull latest versions')
  );
  console.log(chalk.dim('  copilot-skills remove <name>  # uninstall a skill'));
}

function trunc(str, len) {
  if (typeof str !== 'string') return '';
  const flat = str.replace(/\n/g, ' ');
  return flat.length <= len ? flat : flat.slice(0, len - 1) + '…';
}
