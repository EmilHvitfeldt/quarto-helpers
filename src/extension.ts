import * as vscode from 'vscode';
import { FragmentCompletionProvider } from './fragmentCompletionProvider';
import { SassVariableCompletionProvider } from './sassVariableCompletionProvider';
import { IncludeShortcodeCompletionProvider } from './includeShortcodeCompletionProvider';
import { VarShortcodeCompletionProvider } from './varShortcodeCompletionProvider';
import { MetaShortcodeCompletionProvider } from './metaShortcodeCompletionProvider';
import { ShortcodeCompletionProvider } from './shortcodeCompletionProvider';
import { AbsolutePositionCompletionProvider } from './absolutePositionCompletionProvider';

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('quartoHelpers');

  // Register fragment completion provider for quarto files
  if (config.get<boolean>('enableFragmentCompletion', true)) {
    const fragmentCompletionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'quarto', scheme: 'file' },
      new FragmentCompletionProvider(),
      ' ', '.'  // Trigger on space and dot
    );
    context.subscriptions.push(fragmentCompletionProvider);
  }

  // Register Sass variable completion provider for scss files
  if (config.get<boolean>('enableSassVariableCompletion', true)) {
    const sassCompletionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'scss', scheme: 'file' },
      new SassVariableCompletionProvider(),
      '$'  // Trigger on $ character
    );
    context.subscriptions.push(sassCompletionProvider);
  }

  // Register shortcode name completion provider for quarto files
  if (config.get<boolean>('enableShortcodeCompletion', true)) {
    const shortcodeCompletionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'quarto', scheme: 'file' },
      new ShortcodeCompletionProvider(),
      '<'  // Trigger on < (after "{{<")
    );
    context.subscriptions.push(shortcodeCompletionProvider);
  }

  // Register include shortcode completion provider for quarto files
  if (config.get<boolean>('enableIncludeShortcodeCompletion', true)) {
    const includeCompletionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'quarto', scheme: 'file' },
      new IncludeShortcodeCompletionProvider(),
      ' '  // Trigger on space (after "include ")
    );
    context.subscriptions.push(includeCompletionProvider);
  }

  // Register var shortcode completion provider for quarto files
  if (config.get<boolean>('enableVarShortcodeCompletion', true)) {
    const varCompletionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'quarto', scheme: 'file' },
      new VarShortcodeCompletionProvider(),
      ' '  // Trigger on space (after "var ")
    );
    context.subscriptions.push(varCompletionProvider);
  }

  // Register meta shortcode completion provider for quarto files
  if (config.get<boolean>('enableMetaShortcodeCompletion', true)) {
    const metaCompletionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'quarto', scheme: 'file' },
      new MetaShortcodeCompletionProvider(),
      ' '  // Trigger on space (after "meta ")
    );
    context.subscriptions.push(metaCompletionProvider);
  }

  // Register absolute position completion provider for quarto files
  if (config.get<boolean>('enableAbsolutePositionCompletion', true)) {
    const absolutePositionProvider = vscode.languages.registerCompletionItemProvider(
      { language: 'quarto', scheme: 'file' },
      new AbsolutePositionCompletionProvider(),
      ' '  // Trigger on space (after ".absolute ")
    );
    context.subscriptions.push(absolutePositionProvider);
  }
}

export function deactivate(): void {
  // Extension deactivated
}
