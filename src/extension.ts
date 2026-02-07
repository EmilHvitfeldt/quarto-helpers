import * as vscode from 'vscode';
import { FragmentCompletionProvider } from './fragmentCompletionProvider';

export function activate(context: vscode.ExtensionContext): void {
  // Register fragment completion provider for quarto files
  const fragmentCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new FragmentCompletionProvider(),
    ' ', '.'  // Trigger on space and dot
  );

  context.subscriptions.push(fragmentCompletionProvider);
}

export function deactivate(): void {
  // Extension deactivated
}
