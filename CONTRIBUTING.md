# Contributing to Quarto Helpers

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/EmilHvitfeldt/quarto-helpers.git
   cd quarto-helpers
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Open in VS Code:
   ```bash
   code .
   ```

4. Press F5 to launch the Extension Development Host with the example files.

## Project Structure

```
src/
  extension.ts              # Main entry point - registers all providers
  utils/                    # Shared utilities
    cacheManager.ts         # Generic caching with TTL
    fileScanner.ts          # File system utilities
    braceParser.ts          # Brace parsing utilities
    index.ts                # Re-exports all utilities
  yamlParser.ts             # YAML parsing utilities
  *CompletionProvider.ts    # Individual completion providers
examples/
  <feature>/                # Feature-specific test files
    index.qmd               # Main demo file
```

## Adding a New Completion Provider

### 1. Create the Provider File

Create `src/[feature]CompletionProvider.ts`:

```typescript
import * as vscode from 'vscode';
import { CacheManager } from './utils';

export class MyFeatureCompletionProvider implements vscode.CompletionItemProvider {
  private cache = new CacheManager<string[]>();

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    // Implement completion logic
  }
}
```

### 2. Register the Provider

In `src/extension.ts`:

```typescript
import { MyFeatureCompletionProvider } from './myFeatureCompletionProvider';

// In activate():
const myFeatureProvider = vscode.languages.registerCompletionItemProvider(
  { language: 'quarto', scheme: 'file' },
  new MyFeatureCompletionProvider(),
  ' '  // Trigger characters
);

context.subscriptions.push(myFeatureProvider);
```

### 3. Add Example Files

Create `examples/[feature]/index.qmd` with demo content.

### 4. Update Documentation

- Add the feature to `README.md`
- Add entry to `CHANGELOG.md` under `[Unreleased]`

## Utilities

### CacheManager

Generic caching with TTL:

```typescript
import { CacheManager } from './utils';

const cache = new CacheManager<string[]>(5000); // 5 second TTL
const data = cache.getOrCompute('key', () => computeExpensiveData());
```

### File Scanning

```typescript
import { scanFiles, findFilesByName, traverseUpwards, safeReadFile } from './utils';

// Scan all files
const files = scanFiles(workspacePath);

// Find specific files
const configs = findFilesByName(workspacePath, '_quarto.yml');

// Walk up directory tree
for (const dir of traverseUpwards(documentPath, workspacePath)) {
  // Process each directory
}

// Safe file reading
const content = safeReadFile(filePath); // Returns null on error
```

### Brace Parsing

```typescript
import { getTextInsideBraces, hasClass, escapeRegex } from './utils';

const insideBraces = getTextInsideBraces(document, position);
if (hasClass(insideBraces, 'myclass')) {
  // Inside {.myclass ...}
}
```

## Testing

1. Press F5 to launch Extension Development Host
2. Open example `.qmd` files
3. Test autocomplete triggers and suggestions
4. Verify completions appear in correct contexts

## Code Style

- Use TypeScript strict mode
- Use shared utilities from `src/utils/` to avoid duplication
- Add JSDoc comments for public APIs
- Keep completion providers focused and efficient

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run `npm run compile` to check for errors
5. Test thoroughly
6. Submit a pull request

## Questions?

Open an issue if you have questions or need help!
