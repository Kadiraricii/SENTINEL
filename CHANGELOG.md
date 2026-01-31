# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-01-31

### Added
- **Fallback Extraction Engine:** New regex-based fallback mechanism ensures 100% file coverage, even for unsupported languages.
- **Enhanced Language Support:** Frontend now correctly displays all 15 supported languages (was partial).
- **Processing Statistics:** Real-time toast notifications showing AST vs. Fallback extraction counts.
- **Neon Background Integration:** Dynamic neon tubes background with sidebar offset support.
- **Search Enhancements:** Expandable code blocks for search results.

### Changed
- **Port Migration:** API server migrated from port `8000` to `8002` to avoid conflicts.
- **Sidebar UI:** Refactored to permanent icon-only mode with tooltips for cleaner UX.
- **Upload Page:** Improved layout centering and component sizing.
- **Gitignore:** Added `frontend/dist/` and `frontend/.env` variables for better security and hygiene.

### Fixed
- Fixed issue where unsupported files were skipped without user feedback.
- Fixed sidebar overlapping content on smaller screens.

## [2.0.0] - 2026-01-28

### Added
- **Git Repository Analysis:** Clone and analyze public repositories.
- **Analytics Dashboard:** Visual trends and confidence score distribution.
- **Advanced Search:** Full-text search with filters.
- **Command Palette:** Global `Cmd+K` navigation.

### Security
- **SSRF Prevention:** Strict URL validation and local network blocking.
- **Command Injection Shield:** Input sanitization for all shell commands.
- **No-Exec Policy:** Automatic `chmod 644` for all extracted files.

## [1.0.0] - 2026-01-15

### Added
- Core Extraction Engine (Hybrid Segmentation).
- Tree-sitter AST validation for 10+ languages.
- Basic File Upload (PDF, DOCX, TXT).
- Monaco Editor integration.
