import chalk from 'chalk';
import ora from 'ora';
import { removeSkill, readManifest, writeManifest } from '../lib/skills.js';
import { resolveSkillsPath, sanitizeSkillName } from '../lib/paths.js';

export async function removeCommand(name, options) {
  const skillsDir = resolveSkillsPath(options.path);
  let safeSkillName;
  try {
    safeSkillName = sanitizeSkillName(name);
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  const manifest = await readManifest(skillsDir);
  if (!manifest.skills[safeSkillName]) {
    console.error(chalk.red(`Skill "${safeSkillName}" is not installed`));
    console.log(chalk.dim(`  Run copilot-skills list to see installed skills`));
    process.exit(1);
  }

  const spinner = ora(`Removing ${chalk.cyan(safeSkillName)}…`).start();

  try {
    await removeSkill(skillsDir, safeSkillName);

    delete manifest.skills[safeSkillName];
    await writeManifest(skillsDir, manifest);

    spinner.succeed(`Removed ${chalk.green(safeSkillName)}`);
  } catch (err) {
    spinner.fail(err.message);
    process.exit(1);
  }
}
