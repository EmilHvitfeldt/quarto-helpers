import * as fs from 'fs';
import * as path from 'path';

/**
 * Extract CSS file paths from an HTML document's <link rel="stylesheet"> tags.
 * @param htmlFilePath Absolute path to the HTML file
 * @returns Array of absolute paths to CSS files
 */
export function parseCssLinks(htmlFilePath: string): string[] {
  try {
    if (!fs.existsSync(htmlFilePath)) {
      return [];
    }

    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const htmlDir = path.dirname(htmlFilePath);

    // Match <link rel="stylesheet" href="..."> tags
    const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
    const hrefFirstRegex = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*>/gi;

    const cssFiles: string[] = [];
    let match: RegExpExecArray | null;

    // Try both attribute orderings
    while ((match = linkRegex.exec(htmlContent)) !== null) {
      const href = match[1];
      if (href.endsWith('.css')) {
        const absolutePath = path.resolve(htmlDir, href);
        cssFiles.push(absolutePath);
      }
    }

    while ((match = hrefFirstRegex.exec(htmlContent)) !== null) {
      const href = match[1];
      if (href.endsWith('.css') && !cssFiles.includes(path.resolve(htmlDir, href))) {
        const absolutePath = path.resolve(htmlDir, href);
        cssFiles.push(absolutePath);
      }
    }

    return cssFiles;
  } catch {
    return [];
  }
}
