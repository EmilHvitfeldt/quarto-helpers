import * as vscode from 'vscode';
import { getTextInsideBraces } from './utils';

/**
 * CSS property information for autocomplete.
 */
interface CssPropertyInfo {
  name: string;
  description: string;
  values?: string[];
}

/**
 * Provides autocompletion for inline CSS styles inside style="" attributes.
 * Triggered when typing inside `{... style="..."}` blocks.
 */
export class StyleCompletionProvider implements vscode.CompletionItemProvider {
  // Common CSS properties for inline styling
  private static readonly CSS_PROPERTIES: CssPropertyInfo[] = [
    // Colors
    { name: 'color', description: 'Text color', values: ['inherit', 'currentColor'] },
    { name: 'background-color', description: 'Background color', values: ['transparent', 'inherit'] },
    { name: 'background', description: 'Background shorthand', values: ['none', 'transparent', 'inherit'] },
    { name: 'opacity', description: 'Element opacity (0-1)', values: ['0', '0.5', '1'] },

    // Typography
    { name: 'font-size', description: 'Font size', values: ['small', 'medium', 'large', 'inherit'] },
    { name: 'font-weight', description: 'Font weight', values: ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
    { name: 'font-style', description: 'Font style', values: ['normal', 'italic', 'oblique'] },
    { name: 'font-family', description: 'Font family', values: ['inherit', 'serif', 'sans-serif', 'monospace'] },
    { name: 'text-align', description: 'Text alignment', values: ['left', 'right', 'center', 'justify'] },
    { name: 'text-decoration', description: 'Text decoration', values: ['none', 'underline', 'overline', 'line-through'] },
    { name: 'text-transform', description: 'Text transformation', values: ['none', 'uppercase', 'lowercase', 'capitalize'] },
    { name: 'line-height', description: 'Line height', values: ['normal', '1', '1.5', '2'] },
    { name: 'letter-spacing', description: 'Letter spacing', values: ['normal'] },
    { name: 'word-spacing', description: 'Word spacing', values: ['normal'] },
    { name: 'white-space', description: 'White space handling', values: ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'] },

    // Box model
    { name: 'margin', description: 'Margin shorthand', values: ['0', 'auto'] },
    { name: 'margin-top', description: 'Top margin', values: ['0', 'auto'] },
    { name: 'margin-right', description: 'Right margin', values: ['0', 'auto'] },
    { name: 'margin-bottom', description: 'Bottom margin', values: ['0', 'auto'] },
    { name: 'margin-left', description: 'Left margin', values: ['0', 'auto'] },
    { name: 'padding', description: 'Padding shorthand', values: ['0'] },
    { name: 'padding-top', description: 'Top padding', values: ['0'] },
    { name: 'padding-right', description: 'Right padding', values: ['0'] },
    { name: 'padding-bottom', description: 'Bottom padding', values: ['0'] },
    { name: 'padding-left', description: 'Left padding', values: ['0'] },

    // Borders
    { name: 'border', description: 'Border shorthand', values: ['none', '1px solid'] },
    { name: 'border-width', description: 'Border width', values: ['thin', 'medium', 'thick'] },
    { name: 'border-style', description: 'Border style', values: ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'] },
    { name: 'border-color', description: 'Border color', values: ['inherit', 'currentColor'] },
    { name: 'border-radius', description: 'Border radius', values: ['0'] },

    // Size
    { name: 'width', description: 'Element width', values: ['auto', '100%', 'fit-content', 'max-content', 'min-content'] },
    { name: 'height', description: 'Element height', values: ['auto', '100%', 'fit-content', 'max-content', 'min-content'] },
    { name: 'max-width', description: 'Maximum width', values: ['none', '100%'] },
    { name: 'max-height', description: 'Maximum height', values: ['none', '100%'] },
    { name: 'min-width', description: 'Minimum width', values: ['0', 'auto'] },
    { name: 'min-height', description: 'Minimum height', values: ['0', 'auto'] },

    // Display & Layout
    { name: 'display', description: 'Display type', values: ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'] },
    { name: 'visibility', description: 'Element visibility', values: ['visible', 'hidden', 'collapse'] },
    { name: 'overflow', description: 'Overflow behavior', values: ['visible', 'hidden', 'scroll', 'auto'] },
    { name: 'overflow-x', description: 'Horizontal overflow', values: ['visible', 'hidden', 'scroll', 'auto'] },
    { name: 'overflow-y', description: 'Vertical overflow', values: ['visible', 'hidden', 'scroll', 'auto'] },

    // Flexbox
    { name: 'flex', description: 'Flex shorthand', values: ['none', 'auto', '1'] },
    { name: 'flex-direction', description: 'Flex direction', values: ['row', 'row-reverse', 'column', 'column-reverse'] },
    { name: 'flex-wrap', description: 'Flex wrap', values: ['nowrap', 'wrap', 'wrap-reverse'] },
    { name: 'justify-content', description: 'Main axis alignment', values: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
    { name: 'align-items', description: 'Cross axis alignment', values: ['flex-start', 'flex-end', 'center', 'baseline', 'stretch'] },
    { name: 'align-self', description: 'Self alignment', values: ['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch'] },
    { name: 'gap', description: 'Gap between items', values: ['0'] },

    // Grid
    { name: 'grid-template-columns', description: 'Grid column template', values: ['none', 'auto'] },
    { name: 'grid-template-rows', description: 'Grid row template', values: ['none', 'auto'] },
    { name: 'grid-column', description: 'Grid column placement', values: ['auto'] },
    { name: 'grid-row', description: 'Grid row placement', values: ['auto'] },

    // Positioning
    { name: 'position', description: 'Positioning method', values: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
    { name: 'top', description: 'Top position', values: ['auto', '0'] },
    { name: 'right', description: 'Right position', values: ['auto', '0'] },
    { name: 'bottom', description: 'Bottom position', values: ['auto', '0'] },
    { name: 'left', description: 'Left position', values: ['auto', '0'] },
    { name: 'z-index', description: 'Stack order', values: ['auto', '0', '1', '10', '100'] },

    // Transform & Animation
    { name: 'transform', description: 'Transform function', values: ['none'] },
    { name: 'transform-origin', description: 'Transform origin', values: ['center', 'top', 'bottom', 'left', 'right'] },
    { name: 'transition', description: 'Transition shorthand', values: ['none', 'all 0.3s ease'] },
    { name: 'animation', description: 'Animation shorthand', values: ['none'] },

    // Other
    { name: 'cursor', description: 'Cursor style', values: ['auto', 'default', 'pointer', 'move', 'text', 'wait', 'help', 'not-allowed'] },
    { name: 'box-shadow', description: 'Box shadow', values: ['none'] },
    { name: 'text-shadow', description: 'Text shadow', values: ['none'] },
    { name: 'filter', description: 'Visual filter effects', values: ['none'] },
    { name: 'clip-path', description: 'Clipping path', values: ['none'] },
    { name: 'object-fit', description: 'Replaced element fit', values: ['fill', 'contain', 'cover', 'none', 'scale-down'] },
    { name: 'object-position', description: 'Replaced element position', values: ['center', 'top', 'bottom', 'left', 'right'] },
    { name: 'vertical-align', description: 'Vertical alignment', values: ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom'] },
    { name: 'float', description: 'Float direction', values: ['none', 'left', 'right'] },
    { name: 'clear', description: 'Clear floats', values: ['none', 'left', 'right', 'both'] },
  ];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    // Check if we're inside a style attribute
    const context = this.getStyleContext(document, position);
    if (!context) {
      return undefined;
    }

    const { existingProperties } = context;

    // Filter out properties that are already present
    const availableProperties = StyleCompletionProvider.CSS_PROPERTIES.filter(
      prop => !existingProperties.has(prop.name)
    );

    if (availableProperties.length === 0) {
      return undefined;
    }

    return this.createPropertyCompletionItems(availableProperties);
  }

  /**
   * Check if cursor is inside style="" and return context.
   */
  private getStyleContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ): { existingProperties: Set<string> } | null {
    // Get text inside braces
    const insideBraces = getTextInsideBraces(document, position);
    if (insideBraces === null) {
      return null;
    }

    // Check if style attribute is present
    const styleMatch = insideBraces.match(/style\s*=\s*"([^"]*)$/);
    if (!styleMatch) {
      return null;
    }

    // Find existing properties
    const existingProperties = this.findExistingProperties(styleMatch[1]);

    return { existingProperties };
  }

  /**
   * Find CSS properties already present in the style content.
   */
  private findExistingProperties(content: string): Set<string> {
    const existing = new Set<string>();

    // Match property names followed by colon
    const matches = content.matchAll(/([\w-]+)\s*:/g);
    for (const match of matches) {
      existing.add(match[1]);
    }

    return existing;
  }

  /**
   * Create completion items for CSS properties.
   */
  private createPropertyCompletionItems(properties: CssPropertyInfo[]): vscode.CompletionItem[] {
    return properties.map((prop, index) => {
      const item = new vscode.CompletionItem(prop.name, vscode.CompletionItemKind.Property);

      // Insert property with choice snippet if values are available
      if (prop.values && prop.values.length > 0) {
        // Escape pipe and comma characters in values for snippet syntax
        const escapedValues = prop.values.map(v => v.replace(/[,|\\}]/g, '\\$&'));
        item.insertText = new vscode.SnippetString(
          `${prop.name}: \${1|${escapedValues.join(',')}|};`
        );
        item.documentation = new vscode.MarkdownString(
          `**${prop.name}**\n\n${prop.description}\n\n**Common values:** ${prop.values.join(', ')}`
        );
      } else {
        item.insertText = new vscode.SnippetString(`${prop.name}: \${1};`);
        item.documentation = new vscode.MarkdownString(
          `**${prop.name}**\n\n${prop.description}`
        );
      }

      item.detail = prop.description;
      item.sortText = '!' + index.toString().padStart(3, '0');
      item.filterText = prop.name;

      return item;
    });
  }

}
