# Changelog

All notable changes to OnboardKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-07

### Added

**Core Features:**
- Initial release of OnboardKit CLI
- Zero-cost AI integration via OAuth 2.0 + PKCE authentication
- Anthropic Claude provider support with secure credential storage
- Markdown-based spec parser and validator using unified + remark + Zod
- Template-based code generation system with Handlebars
- 7-phase onboarding workflow with checkpoint/resume capability
- Cross-platform support (macOS, Linux, Windows)

**Commands:**
- `init` - Create new onboarding spec from interactive template
- `auth` - Manage AI provider authentication (login, status, revoke)
- `validate` - Validate spec files against schema
- `generate` - Template-only code generation (works offline)
- `onboard` - Full AI-powered workflow with all 7 phases
- `reset` - Clear workflow checkpoints and state

**Templates:**
- Welcome screen with hero image and CTA
- Dynamic onboarding steps with progress indicators
- Login screen with multiple authentication methods (email, Google, Apple)
- Name capture screen with dynamic field generation
- Home screen placeholder
- React Navigation stack setup with type-safe routing
- Complete theme system (colors, typography, spacing)
- Shared component library (Button, Input, Card)

**Generated Output:**
- TypeScript strict mode compliant code
- React Native/Expo compatible components
- Proper StyleSheet patterns (no external CSS)
- Type-safe React Navigation integration
- Prettier-formatted output
- Accessibility support in components

**Developer Experience:**
- npx execution model (no installation required)
- Interactive CLI with @clack/prompts
- Colored terminal output with picocolors
- Verbose mode for debugging
- Comprehensive error messages
- Dry-run mode for preview
- Automatic checkpoint creation for resume capability

**Security:**
- OS-native credential storage (Keychain, Credential Manager, Secret Service)
- AES-256-GCM encrypted file fallback for credentials
- OAuth 2.0 + PKCE implementation (RFC 6749, RFC 7636 compliant)
- Automatic token refresh with 5-minute expiration buffer
- Secure localhost callback server for OAuth flows

**Documentation:**
- Comprehensive README with quick start guide
- Complete spec format documentation
- CLI command reference
- Example specifications (fitness app, finance app, SaaS app)
- Troubleshooting guide
- Architecture overview
- Contributing guidelines

**Testing:**
- Unit tests for core parser, validator, and OAuth logic
- Template rendering tests
- Integration tests for command workflows
- Cross-platform test coverage
- >80% code coverage for core logic

### Technical Details

**Dependencies:**
- Node.js >= 22 requirement
- Commander.js for CLI framework
- @clack/prompts for interactive terminal UI
- unified + remark-parse for markdown processing
- Zod for schema validation with TypeScript inference
- Handlebars for template rendering
- Prettier for code formatting
- @anthropic-ai/sdk for Claude integration
- keytar for secure credential storage
- picocolors for terminal colors

**Build System:**
- tsup for fast TypeScript bundling
- ESM-only output format
- Source maps enabled
- TypeScript declaration files generated
- Shebang banner for CLI execution

**Architecture:**
- Modular design with clear separation of concerns
- Provider abstraction layer for AI clients
- Template engine with custom Handlebars helpers
- Checkpoint/resume system with spec hash validation
- Atomic file writing for reliability

### Known Limitations

- Single AI provider (Anthropic Claude) - more coming in v1.1+
- 3 core templates (Welcome, Login, Signup) - expanded library in v1.1+
- Soft paywall and hard paywall templates deferred to v1.1
- No interactive chat refinement yet (planned for v1.4)
- No template ejection/customization yet (planned for v1.3)
- Expo-only support (Next.js, Flutter support TBD based on community interest)

### Migration Notes

This is the initial release - no migration needed.

---

## [Unreleased]

### Planned for v1.1
- Google Gemini OAuth support
- Soft paywall screen template
- Hard paywall screen template
- 5 additional screen templates
- Enhanced error recovery
- Improved validation error messages

### Planned for v1.2
- GitHub Models provider support
- Ollama (local AI) support
- Provider selection in CLI
- 10+ templates total
- Template versioning system

### Planned for v1.3
- Community template contributions
- Template marketplace
- `eject` command for template customization
- Template versioning and compatibility checks

### Planned for v1.4
- Interactive chat refinement mode
- Multi-turn AI conversations
- Context-aware code suggestions
- Real-time diff preview

---

## Release Process

Releases follow semantic versioning:
- **Major** (x.0.0) - Breaking changes
- **Minor** (1.x.0) - New features, backward compatible
- **Patch** (1.0.x) - Bug fixes, backward compatible

Each release includes:
1. Updated CHANGELOG.md
2. Version bump in package.json
3. Git tag (e.g., v1.0.0)
4. npm publish with provenance
5. GitHub release with notes

---

[1.0.0]: https://github.com/alifa20/onboarding-kit/releases/tag/v1.0.0
[Unreleased]: https://github.com/alifa20/onboarding-kit/compare/v1.0.0...HEAD
