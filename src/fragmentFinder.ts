import * as fs from 'fs';

/**
 * Find fragment class names from a CSS file.
 * Looks for patterns like `.reveal .fragment.fade-out` or `.reveal .slides section .fragment.highlight-red`
 * @param cssFilePath Absolute path to the CSS file
 * @returns Sorted, deduplicated array of fragment class names (without the leading dot)
 */
export function findFragmentClasses(cssFilePath: string): string[] {
  try {
    if (!fs.existsSync(cssFilePath)) {
      return [];
    }

    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    // Match patterns like:
    // .reveal .fragment.fade-out
    // .reveal .slides section .fragment.highlight-red
    const fragmentRegex = /\.reveal\s+(?:\.slides\s+section\s+)?\.fragment\.([a-zA-Z0-9_-]+)/g;

    const classes = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = fragmentRegex.exec(cssContent)) !== null) {
      classes.add(match[1]);
    }

    return Array.from(classes).sort();
  } catch {
    return [];
  }
}

/**
 * Find fragment classes from multiple CSS files.
 * @param cssFilePaths Array of absolute paths to CSS files
 * @returns Sorted, deduplicated array of fragment class names
 */
export function findFragmentClassesFromFiles(cssFilePaths: string[]): string[] {
  const allClasses = new Set<string>();

  for (const cssPath of cssFilePaths) {
    const classes = findFragmentClasses(cssPath);
    for (const cls of classes) {
      allClasses.add(cls);
    }
  }

  return Array.from(allClasses).sort();
}
