# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Future feature placeholder.

## [0.0.1] - 2025-08-01 

### Added

- **Initial Release of ContextCollector!** 🎉
- Feature: Add selected code to context via editor context menu.
- Feature: Group collected snippets by their file paths.
- Feature: Persist context per-workspace using `workspaceState`.
- Feature: Status bar item to display the current context status (`$(clippy) Context: X files`).
- Feature: Quick-pick menu on status bar click with three options:
    - Generate `tempFile.md` in the workspace root.
    - Preview the context in a new, unsaved Markdown tab.
    - Clear the entire context.
- Formatted output with `File Structure` and `File Content` sections for better AI comprehension.