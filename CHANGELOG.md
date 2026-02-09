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
  - Caches fragment classes for 5 seconds to improve performance
  - Multi-line brace support for complex span definitions
  - Limits to one fragment animation class per element
