import * as vscode from 'vscode';
import { FragmentCompletionProvider } from './fragmentCompletionProvider';
import { SassVariableCompletionProvider } from './sassVariableCompletionProvider';
import { IncludeShortcodeCompletionProvider } from './includeShortcodeCompletionProvider';
import { VarShortcodeCompletionProvider } from './varShortcodeCompletionProvider';
import { MetaShortcodeCompletionProvider } from './metaShortcodeCompletionProvider';
import { ShortcodeCompletionProvider } from './shortcodeCompletionProvider';
import { AbsolutePositionCompletionProvider } from './absolutePositionCompletionProvider';

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

  // Register shortcode name completion provider for quarto files
  const shortcodeCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new ShortcodeCompletionProvider(),
    '<'  // Trigger on < (after "{{<")
  );

  // Register include shortcode completion provider for quarto files
  const includeCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new IncludeShortcodeCompletionProvider(),
    ' '  // Trigger on space (after "include ")
  );

  // Register var shortcode completion provider for quarto files
  const varCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new VarShortcodeCompletionProvider(),
    ' '  // Trigger on space (after "var ")
  );

  // Register meta shortcode completion provider for quarto files
  const metaCompletionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new MetaShortcodeCompletionProvider(),
    ' '  // Trigger on space (after "meta ")
  );

  // Register absolute position completion provider for quarto files
  const absolutePositionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'quarto', scheme: 'file' },
    new AbsolutePositionCompletionProvider(),
    ' '  // Trigger on space (after ".absolute ")
  );

  context.subscriptions.push(
    fragmentCompletionProvider,
    sassCompletionProvider,
    shortcodeCompletionProvider,
    includeCompletionProvider,
    varCompletionProvider,
    metaCompletionProvider,
    absolutePositionProvider
  );
}

export function deactivate(): void {
  // Extension deactivated
}
