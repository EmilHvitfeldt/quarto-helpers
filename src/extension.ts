import * as vscode from 'vscode';
import { FragmentCompletionProvider } from './fragmentCompletionProvider';
import { SassVariableCompletionProvider } from './sassVariableCompletionProvider';
import { IncludeShortcodeCompletionProvider } from './includeShortcodeCompletionProvider';

export function activate(context: vscode.ExtensionContext): void {
  // Register fragment completion provider for quarto files
  const fragmentCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new FragmentCompletionProvider(),
    ' ', '.'  // Trigger on space and dot
  );

  // Register Sass variable completion provider for scss files
  const sassCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'scss', scheme: 'file' },
    new SassVariableCompletionProvider(),
    '$'  // Trigger on $ character
  );

  // Register include shortcode completion provider for quarto files
  const includeCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new IncludeShortcodeCompletionProvider(),
    ' '  // Trigger on space (after "include ")
  );

  context.subscriptions.push(fragmentCompletionProvider, sassCompletionProvider, includeCompletionProvider);
}

export function deactivate(): void {
  // Extension deactivated
}
