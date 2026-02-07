import * as fs from 'fs';

/**
 * Find custom fragment class names defined in JavaScript within an HTML file.
 * Looks for patterns like: event.fragment.classList.contains("classname")
 * which are typically used in Reveal.on("fragmentshown", ...) handlers.
 *
 * @param htmlFilePath Absolute path to the HTML file
 * @returns Array of custom fragment class names (without the leading dot)
 */
export function findJsFragmentClasses(htmlFilePath: string): string[] {
  try {
    if (!fs.existsSync(htmlFilePath)) {
      return [];
    }

    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // Extract all <script> tag contents
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const classes = new Set<string>();
    let scriptMatch: RegExpExecArray | null;

    while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
      const scriptContent = scriptMatch[1];

      // Look for patterns like:
      // event.fragment.classList.contains("classname")
      // event.fragment.classList.contains('classname')
      // Also handles multi-line with whitespace between parts:
      // event
      //   .fragment
      //   .classList
      //   .contains("classname")
      const fragmentClassRegex = /\.fragment\s*\.\s*classList\s*\.\s*contains\s*\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g;
      let classMatch: RegExpExecArray | null;

      while ((classMatch = fragmentClassRegex.exec(scriptContent)) !== null) {
        classes.add(classMatch[1]);
      }
    }

    return Array.from(classes).sort();
  } catch {
    return [];
  }
}
