import chalk from 'chalk';
import { REGISTRIES } from '../lib/registry.js';

export function registriesCommand() {
  const entries = Object.entries(REGISTRIES);

  console.log(chalk.bold('\nAvailable registries\n'));

  const keyWidth = Math.max(...entries.map(([k]) => k.length)) + 2;

  for (const [key, reg] of entries) {
    const label = key === 'default' ? chalk.cyan('(default)') : chalk.cyan(key);
    const paddedKey = label.padEnd(keyWidth + 9); // account for chalk escape codes
    const source = `${reg.owner}/${reg.repo}`;
    console.log(`  ${paddedKey}  ${reg.label}`);
    console.log(`  ${''.padEnd(keyWidth)}  ${chalk.dim(source)}`);
    console.log('');
  }

  console.log(chalk.dim('Usage: copilot-skills add <registry>:<skill-name>'));
  console.log(
    chalk.dim('       copilot-skills search <query> --registry <key>')
  );
  console.log('');
}
