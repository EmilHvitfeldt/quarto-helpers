# Quarto Helpers

VS Code extension providing autocomplete and editor support for Quarto documents.

## Features

### Sass Variable Autocomplete

Provides intelligent autocomplete for Quarto Sass variables in `.scss` files. The extension automatically detects which Quarto format (RevealJS, HTML, or Dashboard) your SCSS file is used with and provides format-specific variable suggestions.

#### How It Works

Type `$` in any `.scss` file within a Quarto project to get suggestions for available Sass variables:

<!-- TODO: Add gif showing sass autocomplete -->

#### Format-Aware Completions

The extension scans your workspace for `.qmd` files and `_quarto.yml` to detect which format references your SCSS file:

- **RevealJS presentations**: Get variables like `$presentation-font-size-root`, `$presentation-h1-font-size`, `$body-bg`
- **HTML documents**: Get variables like `$h1-font-size`, `$body-color`, `$link-color`
- **Dashboards**: Get variables like `$valuebox-bg-primary`, `$card-border-radius`, `$bslib-sidebar-width`

If an SCSS file is used by multiple formats, variables from all formats are combined.

#### Variable Categories

Variables are organized by category:
- **colors**: Background, text, and link colors
- **fonts**: Font families and sizes
- **headings**: Heading sizes and styles
- **code**: Code block styling
- **layout**: Borders, spacing, and alignment
- **callouts**: Callout box colors
- **value-box**: Dashboard value box colors (dashboard only)
- **cards**: Card styling (dashboard only)
- **sidebar**: Sidebar styling (dashboard only)

**Examples:**

RevealJS (`examples/sass-revealjs/custom.scss`):
```scss
/*-- scss:defaults --*/

$body-bg: #1a1a2e;
$body-color: #eaeaea;
$presentation-font-size-root: 42px;
$presentation-heading-color: #ffffff;
```

Dashboard (`examples/sass-dashboard/custom.scss`):
```scss
/*-- scss:defaults --*/

$primary: #4a90d9;
$valuebox-bg-primary: $primary;
$card-border-radius: 0.5rem;
$bslib-sidebar-width: 300px;
```

HTML (`examples/sass-html/custom.scss`):
```scss
/*-- scss:defaults --*/

$body-bg: #fafafa;
$link-color: #0066cc;
$h1-font-size: 2.75rem;
```

---

### Fragment Autocomplete

Provides intelligent autocomplete for reveal.js fragment animation types inside `{.fragment }` spans.

#### How It Works

Type inside a `{.fragment }` span and press space to get suggestions for available fragment animation types:

<!-- TODO: Add gif showing fragment autocomplete -->

#### Dynamic Discovery

Fragment classes are automatically discovered from your presentation's CSS files. This means:

- Standard reveal.js fragments are always available
- Theme-specific fragments are included
- Custom fragment classes defined in your CSS are detected

#### Custom JavaScript Fragments

The extension also detects custom fragment types defined via JavaScript. If your presentation includes code like:

```javascript
Reveal.on("fragmentshown", (event) => {
  if (event.fragment.classList.contains("my-custom-fragment")) {
    // custom behavior
  }
});
```

The `my-custom-fragment` class will appear in autocomplete suggestions.

#### Smart Filtering

- Only triggers inside `{.fragment }` spans
- Only suggests one fragment animation class per element
- Excludes internal classes (`visible`, `current-visible`, `disabled`)

**Examples:**
```markdown
::: {.fragment .fade-out}
This will fade out
:::

[highlighted text]{.fragment .highlight-red}

::: {.fragment .grow}
This will grow
:::
```

## Requirements

- VS Code 1.85.0 or higher

## Installation

<!-- TODO: Add marketplace link once published -->

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Quarto Helpers"
4. Click Install

## How It Works

The extension reads the rendered HTML file corresponding to your `.qmd` file to discover available fragment classes:

1. Parses `<link rel="stylesheet">` tags from the HTML
2. Scans CSS files for `.reveal ... .fragment.classname` patterns
3. Scans inline `<script>` tags for `classList.contains("classname")` patterns
4. Caches results for 5 seconds to improve performance

**Note:** You need to render your Quarto document at least once (`quarto render`) for autocomplete to work, as it reads from the generated HTML file.

## Development

### Setup

```bash
git clone https://github.com/EmilHvitfeldt/quarto-helpers.git
cd quarto-helpers
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile TypeScript to JavaScript |
| `npm run watch` | Compile and watch for changes |
| `npm run package` | Create `.vsix` package for local testing |
| `npm run publish` | Publish to VS Code Marketplace |
| `npm run publish:ovsx` | Publish to Open VSX Marketplace |

### Testing Locally

1. Run `npm run package` to create a `.vsix` file
2. In VS Code, open the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Click the `...` menu → "Install from VSIX..."
4. Select the generated `.vsix` file

Or press F5 to launch the Extension Development Host with the example files.

### Publishing

#### VS Code Marketplace

1. Install vsce if needed: `npm install -g @vscode/vsce`
2. Login to your publisher account: `vsce login EmilHvitfeldt`
3. Run `npm run publish`

See the [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) for more details.

#### Open VSX Marketplace

1. Install ovsx if needed: `npm install -g ovsx`
2. Get an access token from [Open VSX](https://open-vsx.org/)
3. Run `npm run package` to create the `.vsix` file
4. Publish: `ovsx publish quarto-helpers-0.1.0.vsix -p <token>`

See the [Open VSX Wiki](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions) for more details.

## Contributing

Contributions are welcome! Ideas for future features:

- Autocomplete for other reveal.js attributes
- Preview fragments in editor
- Slide navigation support
- Speaker notes integration

## License

MIT - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Quarto](https://quarto.org/) - Open-source scientific and technical publishing
- [reveal.js](https://revealjs.com/) - HTML presentation framework
