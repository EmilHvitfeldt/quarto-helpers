/**
 * Parse YAML content and extract all keys with dot notation for nested values.
 */
export function parseYamlKeys(content: string): string[] {
  const keys: string[] = [];
  const lines = content.split('\n');
  const pathStack: { indent: number; key: string }[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }

    // Match key: value or key: patterns
    const match = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const indent = match[1].length;
    const key = match[2];
    const value = match[3].trim();

    // Pop items from stack that have >= indent (sibling or parent level)
    while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent) {
      pathStack.pop();
    }

    // Build the full path
    const fullPath = pathStack.length > 0
      ? pathStack.map(p => p.key).join('.') + '.' + key
      : key;

    keys.push(fullPath);

    // If this key has nested content (no value or value is empty/object indicator)
    if (value === '' || value === '|' || value === '>') {
      pathStack.push({ indent, key });
    }
  }

  return keys;
}

/**
 * Parse YAML front matter from a document and extract keys.
 */
export function parseFrontMatter(content: string): string[] {
  const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatterMatch) {
    return [];
  }

  return parseYamlKeys(frontMatterMatch[1]);
}
