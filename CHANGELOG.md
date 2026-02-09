# Changelog

All notable changes to the Quarto Helpers extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - YYYY-MM-DD

### Added

- Initial release
- **Fragment autocomplete:**
  - Autocomplete for reveal.js fragment animation types inside `{.fragment }` spans
  - Dynamically discovers available fragment classes from rendered HTML's CSS files
  - Supports standard reveal.js fragments (`fade-out`, `fade-up`, `highlight-red`, etc.)
  - Supports custom JavaScript-defined fragment types via `classList.contains()` detection
  - Multi-line brace support for complex span definitions
  - Limits to one fragment animation class per element
- **Sass variable autocomplete:**
  - Autocomplete for Quarto Sass variables in `.scss` files
  - Format-aware completions: automatically detects RevealJS, HTML, or Dashboard format
  - Scans workspace for `.qmd` and `_quarto.yml` files to determine format
  - Supports multi-format SCSS files (combines variables from all detected formats)
  - Variables organized by category (colors, fonts, headings, code, layout, callouts, etc.)
  - Includes default values in completion documentation
  - RevealJS variables: 59 variables including presentation-specific settings
  - HTML variables: 26 variables for standard HTML documents
  - Dashboard variables: 55 variables including value boxes, cards, and sidebar
- **Include shortcode autocomplete:**
  - Autocomplete for file paths inside `{{< include >}}` shortcodes
  - Lists all files in the workspace with relative paths from the current document
  - Prioritizes underscore-prefixed files (Quarto convention for include files)
  - Excludes common non-content directories (`.git`, `node_modules`, `_site`, etc.)
- **Var shortcode autocomplete:**
  - Autocomplete for `{{< var >}}` shortcode with variables from `_variables.yml` files
  - Supports dot notation for nested values (e.g., `author.name`, `urls.docs`)
  - Scans all `_variables.yml` files in the workspace
- **Meta shortcode autocomplete:**
  - Autocomplete for `{{< meta >}}` shortcode with fields from YAML front matter and `_quarto.yml`
  - Supports dot notation for nested values (e.g., `author.name`, `custom.setting`)
  - Parses front matter and `_quarto.yml` hierarchy
- **Shortcode name autocomplete:**
  - Autocomplete for shortcode names inside `{{< >}}` syntax
  - Includes all 12 built-in Quarto shortcodes (`include`, `var`, `meta`, `env`, `pagebreak`, `kbd`, `video`, `embed`, `placeholder`, `lipsum`, `version`, `contents`)
  - Discovers custom shortcodes from extensions in `_extensions/` directory
  - Parses `_extension.yml` files to find shortcode definitions
  - Supports nested extension directories (e.g., `_extensions/quarto-ext/lightbox`)
- **Absolute position autocomplete:**
  - Autocomplete for RevealJS absolute position attributes inside `{.absolute }` blocks
  - Suggests positioning attributes: `top`, `bottom`, `left`, `right`, `width`, `height`
  - Filters out attributes already present in the block
  - Includes snippet support with placeholder values
