import execa from 'execa';

import {parallel} from './infra/taskts/src/lib/parallel';

export async function lint_js() {
  await execa(
    'eslint',
    [
      '**/*.{js,mjs}',
      '--config',
      'javascript.eslintrc.js',
      '--ignore-path',
      '.gitignore',
    ],
    {preferLocal: true},
  );
}

export async function lint_ts() {
  await execa(
    'eslint',
    [
      '**/*.ts',
      '--config',
      'typescript.eslintrc.js',
      '--ignore-path',
      '.gitignore',
    ],
    {preferLocal: true},
  );
}

export function log({message}: {message: string}) {
  console.log(`Message is ${message}`);
}

export default function cwd() {
  console.log(`cwd is ${process.cwd()}`);
}

export const lint = parallel(lint_js, lint_ts);
