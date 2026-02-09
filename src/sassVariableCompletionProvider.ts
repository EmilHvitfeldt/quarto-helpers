import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Sass variable definitions by format type
interface SassVariable {
    name: string;
    defaultValue: string;
    category: string;
}

const REVEALJS_VARIABLES: SassVariable[] = [
    // Colors
    { name: '$body-bg', defaultValue: '#fff', category: 'colors' },
    { name: '$body-color', defaultValue: '#222', category: 'colors' },
    { name: '$text-muted', defaultValue: 'lighten($body-color, 50%)', category: 'colors' },
    { name: '$link-color', defaultValue: '#2a76dd', category: 'colors' },
    { name: '$link-color-hover', defaultValue: 'lighten($link-color, 15%)', category: 'colors' },
    { name: '$selection-bg', defaultValue: 'lighten($link-color, 25%)', category: 'colors' },
    { name: '$selection-color', defaultValue: '$body-bg', category: 'colors' },
    { name: '$light-bg-text-color', defaultValue: '#222', category: 'colors' },
    { name: '$light-bg-link-color', defaultValue: '#2a76dd', category: 'colors' },
    { name: '$light-bg-code-color', defaultValue: '#4758ab', category: 'colors' },
    { name: '$dark-bg-text-color', defaultValue: '#fff', category: 'colors' },
    { name: '$dark-bg-link-color', defaultValue: '#42affa', category: 'colors' },
    { name: '$dark-bg-code-color', defaultValue: '#ffa07a', category: 'colors' },
    // Fonts
    { name: '$font-family-sans-serif', defaultValue: "'Source Sans Pro', Helvetica, sans-serif", category: 'fonts' },
    { name: '$font-family-monospace', defaultValue: 'monospace', category: 'fonts' },
    { name: '$presentation-font-size-root', defaultValue: '40px', category: 'fonts' },
    { name: '$presentation-font-smaller', defaultValue: '0.7', category: 'fonts' },
    { name: '$presentation-line-height', defaultValue: '1.3', category: 'fonts' },
    // Headings
    { name: '$presentation-h1-font-size', defaultValue: '2.5em', category: 'headings' },
    { name: '$presentation-h2-font-size', defaultValue: '1.6em', category: 'headings' },
    { name: '$presentation-h3-font-size', defaultValue: '1.3em', category: 'headings' },
    { name: '$presentation-h4-font-size', defaultValue: '1em', category: 'headings' },
    { name: '$presentation-heading-font', defaultValue: '$font-family-sans-serif', category: 'headings' },
    { name: '$presentation-heading-color', defaultValue: '$body-color', category: 'headings' },
    { name: '$presentation-heading-line-height', defaultValue: '1.2', category: 'headings' },
    { name: '$presentation-heading-letter-spacing', defaultValue: 'normal', category: 'headings' },
    { name: '$presentation-heading-text-transform', defaultValue: 'none', category: 'headings' },
    { name: '$presentation-heading-text-shadow', defaultValue: 'none', category: 'headings' },
    { name: '$presentation-heading-font-weight', defaultValue: '600', category: 'headings' },
    { name: '$presentation-h1-text-shadow', defaultValue: 'none', category: 'headings' },
    // Code blocks
    { name: '$code-block-bg', defaultValue: '$body-bg', category: 'code' },
    { name: '$code-block-border-color', defaultValue: 'lighten($body-color, 60%)', category: 'code' },
    { name: '$code-block-font-size', defaultValue: '0.55em', category: 'code' },
    { name: '$code-color', defaultValue: 'var(--quarto-hl-fu-color)', category: 'code' },
    { name: '$code-bg', defaultValue: 'transparent', category: 'code' },
    // Layout
    { name: '$border-color', defaultValue: 'lighten($body-color, 30%)', category: 'layout' },
    { name: '$border-width', defaultValue: '1px', category: 'layout' },
    { name: '$border-radius', defaultValue: '3px', category: 'layout' },
    { name: '$presentation-block-margin', defaultValue: '12px', category: 'layout' },
    { name: '$presentation-slide-text-align', defaultValue: 'left', category: 'layout' },
    { name: '$presentation-title-slide-text-align', defaultValue: 'center', category: 'layout' },
    { name: '$tabset-border-color', defaultValue: '$code-block-border-color', category: 'layout' },
    // Callouts
    { name: '$callout-border-width', defaultValue: '0.3rem', category: 'callouts' },
    { name: '$callout-border-scale', defaultValue: '10%', category: 'callouts' },
    { name: '$callout-margin-top', defaultValue: '1rem', category: 'callouts' },
    { name: '$callout-margin-bottom', defaultValue: '1rem', category: 'callouts' },
    { name: '$callout-color-note', defaultValue: '#0d6efd', category: 'callouts' },
    { name: '$callout-color-tip', defaultValue: '#198754', category: 'callouts' },
    { name: '$callout-color-caution', defaultValue: '#fd7e14', category: 'callouts' },
    { name: '$callout-color-warning', defaultValue: '#ffc107', category: 'callouts' },
    { name: '$callout-color-important', defaultValue: '#dc3545', category: 'callouts' },
];

const HTML_VARIABLES: SassVariable[] = [
    // Colors
    { name: '$body-bg', defaultValue: '#fff', category: 'colors' },
    { name: '$body-color', defaultValue: '#212529', category: 'colors' },
    { name: '$link-color', defaultValue: '#0d6efd', category: 'colors' },
    { name: '$link-hover-color', defaultValue: 'darken($link-color, 15%)', category: 'colors' },
    // Fonts
    { name: '$font-family-sans-serif', defaultValue: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif', category: 'fonts' },
    { name: '$font-family-monospace', defaultValue: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace', category: 'fonts' },
    { name: '$font-size-base', defaultValue: '1rem', category: 'fonts' },
    { name: '$font-size-sm', defaultValue: '0.875rem', category: 'fonts' },
    { name: '$font-size-lg', defaultValue: '1.25rem', category: 'fonts' },
    { name: '$line-height-base', defaultValue: '1.5', category: 'fonts' },
    // Headings
    { name: '$h1-font-size', defaultValue: '2.5rem', category: 'headings' },
    { name: '$h2-font-size', defaultValue: '2rem', category: 'headings' },
    { name: '$h3-font-size', defaultValue: '1.75rem', category: 'headings' },
    { name: '$h4-font-size', defaultValue: '1.5rem', category: 'headings' },
    { name: '$h5-font-size', defaultValue: '1.25rem', category: 'headings' },
    { name: '$h6-font-size', defaultValue: '1rem', category: 'headings' },
    { name: '$headings-font-weight', defaultValue: '500', category: 'headings' },
    { name: '$headings-line-height', defaultValue: '1.2', category: 'headings' },
    // Code
    { name: '$code-font-size', defaultValue: '0.875em', category: 'code' },
    { name: '$code-color', defaultValue: '#d63384', category: 'code' },
    { name: '$code-bg', defaultValue: '$gray-100', category: 'code' },
    // Layout
    { name: '$border-radius', defaultValue: '0.375rem', category: 'layout' },
    { name: '$border-color', defaultValue: '$gray-300', category: 'layout' },
    // Callouts
    { name: '$callout-border-width', defaultValue: '0.3rem', category: 'callouts' },
    { name: '$callout-color-note', defaultValue: '#0d6efd', category: 'callouts' },
    { name: '$callout-color-tip', defaultValue: '#198754', category: 'callouts' },
    { name: '$callout-color-caution', defaultValue: '#fd7e14', category: 'callouts' },
    { name: '$callout-color-warning', defaultValue: '#ffc107', category: 'callouts' },
    { name: '$callout-color-important', defaultValue: '#dc3545', category: 'callouts' },
];

const DASHBOARD_VARIABLES: SassVariable[] = [
    // Colors (inherit from HTML/Bootstrap)
    { name: '$body-bg', defaultValue: '#fff', category: 'colors' },
    { name: '$body-color', defaultValue: '#212529', category: 'colors' },
    { name: '$link-color', defaultValue: '#0d6efd', category: 'colors' },
    { name: '$primary', defaultValue: '#0d6efd', category: 'colors' },
    { name: '$secondary', defaultValue: '#6c757d', category: 'colors' },
    { name: '$success', defaultValue: '#198754', category: 'colors' },
    { name: '$info', defaultValue: '#0dcaf0', category: 'colors' },
    { name: '$warning', defaultValue: '#ffc107', category: 'colors' },
    { name: '$danger', defaultValue: '#dc3545', category: 'colors' },
    { name: '$light', defaultValue: '#f8f9fa', category: 'colors' },
    { name: '$dark', defaultValue: '#212529', category: 'colors' },
    // Value Box
    { name: '$valuebox-bg-primary', defaultValue: '$primary', category: 'value-box' },
    { name: '$valuebox-bg-secondary', defaultValue: '$secondary', category: 'value-box' },
    { name: '$valuebox-bg-success', defaultValue: '$success', category: 'value-box' },
    { name: '$valuebox-bg-info', defaultValue: '$info', category: 'value-box' },
    { name: '$valuebox-bg-warning', defaultValue: '$warning', category: 'value-box' },
    { name: '$valuebox-bg-danger', defaultValue: '$danger', category: 'value-box' },
    { name: '$valuebox-bg-light', defaultValue: '$light', category: 'value-box' },
    { name: '$valuebox-bg-dark', defaultValue: '$dark', category: 'value-box' },
    // Cards
    { name: '$card-spacer-y', defaultValue: '$spacer', category: 'cards' },
    { name: '$card-spacer-x', defaultValue: '$spacer', category: 'cards' },
    { name: '$card-title-spacer-y', defaultValue: '$spacer * .5', category: 'cards' },
    { name: '$card-title-color', defaultValue: 'null', category: 'cards' },
    { name: '$card-subtitle-color', defaultValue: 'null', category: 'cards' },
    { name: '$card-border-width', defaultValue: '$border-width', category: 'cards' },
    { name: '$card-border-color', defaultValue: '$border-color-translucent', category: 'cards' },
    { name: '$card-border-radius', defaultValue: '$border-radius', category: 'cards' },
    { name: '$card-box-shadow', defaultValue: 'null', category: 'cards' },
    { name: '$card-cap-padding-y', defaultValue: '$card-spacer-y * .5', category: 'cards' },
    { name: '$card-cap-padding-x', defaultValue: '$card-spacer-x', category: 'cards' },
    { name: '$card-cap-bg', defaultValue: 'rgba($body-color, .03)', category: 'cards' },
    { name: '$card-cap-color', defaultValue: 'null', category: 'cards' },
    { name: '$card-height', defaultValue: 'null', category: 'cards' },
    { name: '$card-color', defaultValue: 'null', category: 'cards' },
    { name: '$card-bg', defaultValue: '$body-bg', category: 'cards' },
    // Sidebar
    { name: '$bslib-sidebar-bg', defaultValue: 'rgba(var(--bs-emphasis-color-rgb, 0,0,0), 0.05)', category: 'sidebar' },
    { name: '$bslib-sidebar-fg', defaultValue: 'var(--bs-emphasis-color, black)', category: 'sidebar' },
    { name: '$bslib-sidebar-toggle-bg', defaultValue: 'rgba(var(--bs-emphasis-color-rgb, 0,0,0), 0.1)', category: 'sidebar' },
    { name: '$bslib-sidebar-width', defaultValue: '250px', category: 'sidebar' },
    // Dashboard specific
    { name: '$dashboard-card-toolbar-top-margin', defaultValue: '6px', category: 'dashboard' },
    // Fonts
    { name: '$font-family-sans-serif', defaultValue: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif', category: 'fonts' },
    { name: '$font-family-monospace', defaultValue: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace', category: 'fonts' },
    { name: '$font-size-base', defaultValue: '1rem', category: 'fonts' },
    // Layout
    { name: '$border-radius', defaultValue: '0.375rem', category: 'layout' },
    { name: '$border-width', defaultValue: '1px', category: 'layout' },
    { name: '$border-color', defaultValue: '$gray-300', category: 'layout' },
    { name: '$spacer', defaultValue: '1rem', category: 'layout' },
];

// Get variables for a specific format
function getVariablesForFormat(format: string): SassVariable[] {
    switch (format.toLowerCase()) {
        case 'revealjs':
            return REVEALJS_VARIABLES;
        case 'dashboard':
            return DASHBOARD_VARIABLES;
        case 'html':
        case 'pdf':
        case 'docx':
            return HTML_VARIABLES;
        default:
            return [];
    }
}

// Check if content contains a reference to the scss file
function contentReferencesScss(content: string, scssBaseName: string): boolean {
    // Simple check: does the content contain the scss filename?
    return content.includes(scssBaseName);
}

// Parse format from file content (works for both .qmd frontmatter and _quarto.yml)
function parseFormat(content: string): string | null {
    // Match format: value (simple format on same line)
    const simpleMatch = content.match(/format:[ \t]*(\w+)/);
    if (simpleMatch) {
        return simpleMatch[1];
    }

    // Match nested format like format:\n  revealjs: or format:\n  html:
    const nestedMatch = content.match(/format:[ \t]*[\r\n]+[ \t]+(\w+):/);
    if (nestedMatch) {
        return nestedMatch[1];
    }

    return null;
}

// Recursively find all .qmd and _quarto.yml files in a directory
function findQuartoFiles(dir: string): { qmdFiles: string[], quartoYmlFiles: string[] } {
    const qmdFiles: string[] = [];
    const quartoYmlFiles: string[] = [];
    const ignoreDirs = ['.git', 'node_modules', '_site', '_freeze', '.quarto', 'out'];

    function scan(currentDir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!ignoreDirs.includes(entry.name)) {
                    scan(path.join(currentDir, entry.name));
                }
            } else if (entry.isFile()) {
                if (entry.name.endsWith('.qmd')) {
                    qmdFiles.push(path.join(currentDir, entry.name));
                } else if (entry.name === '_quarto.yml') {
                    quartoYmlFiles.push(path.join(currentDir, entry.name));
                }
            }
        }
    }

    scan(dir);
    return { qmdFiles, quartoYmlFiles };
}

// Detect formats for a given .scss file by checking .qmd files in the workspace
function detectFormatsForScss(scssFilePath: string, workspaceFolder: string): string[] {
    const scssBaseName = path.basename(scssFilePath);
    const formats: Set<string> = new Set();

    const { qmdFiles, quartoYmlFiles } = findQuartoFiles(workspaceFolder);

    // Check each .qmd file
    for (const qmdPath of qmdFiles) {
        try {
            const content = fs.readFileSync(qmdPath, 'utf-8');
            if (contentReferencesScss(content, scssBaseName)) {
                const format = parseFormat(content);
                if (format) {
                    formats.add(format.toLowerCase());
                }
            }
        } catch {
            continue;
        }
    }

    // Check each _quarto.yml file
    for (const ymlPath of quartoYmlFiles) {
        try {
            const content = fs.readFileSync(ymlPath, 'utf-8');
            if (contentReferencesScss(content, scssBaseName)) {
                const format = parseFormat(content);
                if (format) {
                    formats.add(format.toLowerCase());
                }
            }
        } catch {
            continue;
        }
    }

    return Array.from(formats);
}

// Get combined variables for multiple formats (deduplicated by name)
function getVariablesForFormats(formats: string[]): SassVariable[] {
    const variableMap = new Map<string, SassVariable>();

    for (const format of formats) {
        const vars = getVariablesForFormat(format);
        for (const v of vars) {
            // First format wins for duplicates
            if (!variableMap.has(v.name)) {
                variableMap.set(v.name, v);
            }
        }
    }

    return Array.from(variableMap.values());
}

export class SassVariableCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.CompletionItem[] | undefined {
        // Only provide completions for .scss files
        if (!document.fileName.endsWith('.scss')) {
            return undefined;
        }

        // Get the workspace folder
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return undefined;
        }

        // Detect formats from .qmd files in the workspace
        const formats = detectFormatsForScss(document.uri.fsPath, workspaceFolder.uri.fsPath);

        // If no formats detected, default to html
        const effectiveFormats = formats.length > 0 ? formats : ['html'];

        // Get combined variables for all detected formats
        const variables = getVariablesForFormats(effectiveFormats);

        if (variables.length === 0) {
            return undefined;
        }

        // Assume variables are typed at the start of a line
        const lineText = document.lineAt(position).text;
        const leadingWhitespace = lineText.match(/^(\s*)/)?.[1] || '';
        const startCol = leadingWhitespace.length;

        // Replace from start of content to cursor
        const replaceRange = new vscode.Range(
            new vscode.Position(position.line, startCol),
            position
        );

        // Create completion items
        return variables.map(variable => {
            const item = new vscode.CompletionItem(
                variable.name,
                vscode.CompletionItemKind.Variable
            );

            // Use textEdit for explicit control over replacement
            item.textEdit = new vscode.TextEdit(
                replaceRange,
                `${variable.name}: ${variable.defaultValue};`
            );

            item.detail = `${variable.category}`;
            item.documentation = new vscode.MarkdownString(
                `**Default:** \`${variable.defaultValue}\``
            );

            return item;
        });
    }
}
