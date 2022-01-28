import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..');

function trimPrefix(str: string) {
  if (str.startsWith(projectRoot)) {
    return str.slice(projectRoot.length);
  } else {
    return str;
  }
}

export function generateIntegrationURL(baseURL: string, dirname: string) {
  const path = trimPrefix(dirname);
  return `${baseURL}/random-prefix-${Math.random()}${path}/integration.html`;
}
