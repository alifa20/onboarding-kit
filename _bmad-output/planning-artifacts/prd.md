---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - '_bmad-output/planning-artifacts/research/technical-CLI-Development-OnboardKit-research-2026-02-07.md'
  - '_bmad-output/planning-artifacts/research/QUICK-REFERENCE.md'
  - '_bmad-output/planning-artifacts/research/IMPLEMENTATION-CHECKLIST.md'
  - 'docs/spec1.md'
  - 'docs/plan1.md'
  - 'docs/plan2.md'
workflowType: 'prd'
briefCount: 0
researchCount: 3
brainstormingCount: 0
projectDocsCount: 3
projectType: 'greenfield'
classification:
  projectType: 'CLI Tool / Developer Productivity Tool / Code Generator'
  domain: 'Mobile Development (React Native/Expo ecosystem)'
  complexity: 'Medium-High'
  projectContext: 'Greenfield'
  coreValueProposition: 'Zero-cost AI-powered onboarding screen generation via OAuth'
  successMetric: 'Users can run the CLI and get working onboarding pages'
  technicalApproach: 'Hybrid - OAuth from day 1 (non-negotiable), MVP scope (1 provider, 3 templates initially)'
---

# Product Requirements Document - onboarding-kit

**Author:** Ali
**Date:** 2026-02-07

## Success Criteria

### User Success
Users can run `npx onboardkit onboard`, see generated output files, and the code looks good (matches their markdown spec). Time to success: under 1 hour from zero to generated screens.

### Business Success
Community validation - people actually use OnboardKit and report success. No specific metrics, just proof it's useful.

### Technical Success
The tool works reliably for the creator. Generates nice onboarding screens. OAuth flow works, AI integration works, generated code compiles and looks professional.

### Measurable Outcomes
- User runs CLI → sees output → code matches spec (under 1 hour)
- Community members report successful usage
- Generated TypeScript code compiles without errors
- OAuth authentication succeeds consistently

## Product Scope

### MVP - Minimum Viable Product
- 1 AI provider (Anthropic Claude) with OAuth 2.0 + PKCE
- 3 core templates (Welcome, Login, Signup screens)
- Markdown spec parsing and validation
- Working code generation (TypeScript/React Native/Expo)
- Basic CLI commands (init, auth, validate, generate, onboard)
- Checkpoint/resume system for reliability

### Growth Features (Post-MVP)
- Additional AI providers (Google Gemini, GitHub Models, Ollama)
- Extended template library (10-20+ screen types)
- Interactive chat refinement
- Template customization (eject command)

### Vision (Future)
- Community-contributed templates
- Visual spec builder
- Design system integration
- Multi-platform support (Next.js, Flutter)

## User Journeys

### Primary User: React Native Developer with Expo

**Meet Sarah - Mobile Developer at a Startup**

Sarah is building a fitness app in Expo. She's done the hard work (backend, core features, data models) but dreads the "mobile polish" work - onboarding screens, auth flows, paywalls. She's seen beautiful onboarding in other apps but building it from scratch means hours writing boilerplate React Native components, fighting with StyleSheet patterns, manually wiring up React Navigation, and copy-pasting theme colors everywhere. She still ends up with "good enough" instead of "polished."

**The Journey:**

**Opening Scene:**
Sarah has a PRD for her fitness app. She knows she needs: Welcome screen → 3 onboarding steps → Login → Name capture. She's dreading the 2-3 days this usually takes.

**Discovery:**
She finds OnboardKit on GitHub. "Generate onboarding screens from markdown? With free AI? Let's try it."

**Execution:**
1. Runs `npx onboardkit init` - gets a template spec file (2 minutes)
2. Fills in her app details in markdown (20 minutes)
3. Runs `npx onboardkit auth` - OAuth with Claude via her existing Pro subscription (2 minutes)
4. Runs `npx onboardkit onboard` - watches the 7 phases execute (5-10 minutes)
5. Opens `onboardkit-output/` folder - sees all her screens, navigation, theme files

**Climax:**
She copies the generated code into her Expo project. Runs `npx expo start`. **The screens work.** They look professional. The navigation flows correctly. The theme matches her brand colors. The TypeScript compiles clean.

**Resolution:**
What would have taken 2-3 days took under an hour. She tweaks a few colors in `theme/colors.ts`, adjusts some copy, and ships. She tweets: "Just saved 2 days with @onboardkit - generated my entire onboarding flow from markdown in 45 minutes."

### Secondary User (Post-MVP): Design-Focused Developer

Design-focused developers who want pixel-perfect screens will use Google Stitch integration to refine generated designs. This is out of scope for MVP but represents future enhancement opportunity.

### Journey Requirements Summary

**Core Capabilities Revealed:**
- Simple markdown spec format (easy to write)
- Reliable OAuth authentication (works on first try)
- Code generation that produces compilable TypeScript
- Professional-looking output (matches brand)
- Easy customization after generation (theme files, copy edits)

## Innovation & Novel Patterns

### Detected Innovation Areas

**Zero-Cost AI via OAuth:**
OnboardKit eliminates API costs by using OAuth 2.0 + PKCE to tap into users' existing AI subscriptions (Claude Pro/Max, Gemini). Instead of paying per API call, users leverage subscriptions they already own. This is novel in the developer tools space where most AI-powered tools require separate API billing.

**Markdown-First Spec for UI Generation:**
Simple markdown syntax combined with AI enhancement creates a unique workflow: developers write human-readable specs, AI validates and enhances them, then generates production-ready TypeScript components. This bridges the gap between design intent and code implementation without visual builders or complex configuration.

**OAuth for AI Providers in CLI Context:**
Implementing OAuth flows (including PKCE) for AI provider authentication in a CLI tool is uncommon. Most CLI tools use API keys. OnboardKit's approach of browser-based OAuth with localhost callback servers for AI access specifically is a fresh technical pattern.

### Market Context & Competitive Landscape

Existing solutions require either:
- Visual drag-and-drop builders (high friction, vendor lock-in)
- Manual coding (time-consuming, repetitive)
- AI code generation with API costs (monthly bills scale with usage)

OnboardKit combines the simplicity of markdown with AI enhancement while eliminating ongoing costs through OAuth subscription access.

### Validation Approach

Success validation:
- OAuth flow works reliably across providers (Anthropic, Google)
- Generated code compiles and runs without errors
- Users report time savings (hours → minutes)
- Community adoption shows cost-free AI is valued

### Risk Mitigation

**Risk:** OAuth complexity deters users
**Mitigation:** Provide clear setup documentation, handle errors gracefully, offer API key fallback

**Risk:** AI providers change OAuth policies
**Mitigation:** Support multiple providers, maintain API key authentication as backup

**Risk:** Generated code quality varies
**Mitigation:** Template-based generation with AI enhancement (not pure AI generation)

## CLI Tool Specific Requirements

### Project-Type Overview
OnboardKit is a CLI tool for generating React Native/Expo onboarding screens. Distributed via npm (`npx onboardkit`). Target users are React Native developers who want to skip onboarding boilerplate.

### Technical Architecture Considerations

**CLI Framework & Distribution:**
- Commander.js for command parsing
- @clack/prompts for interactive terminal UI
- tsup for bundling (ESM output with shebang)
- npm distribution (`npx` execution model)
- Node.js >= 22 requirement

**Core Processing Pipeline:**
- Markdown parsing (unified + remark-parse)
- Schema validation (Zod with TypeScript inference)
- Template rendering (Handlebars)
- Code formatting (Prettier for generated output)
- File output (atomic writes to project directory)

**OAuth Implementation:**
- OAuth 2.0 + PKCE for Anthropic Claude
- Localhost callback server (Node.js http module)
- Credential storage via keyring-node (OS keychains)
- Encrypted file fallback (~/.onboardkit/credentials.json)
- Token refresh logic with auto-renewal

**AI Integration:**
- Provider abstraction layer (single interface, multiple adapters)
- MVP: Anthropic Claude SDK only
- Post-MVP: Google Gemini, GitHub Models, Ollama
- Middleware pattern for retry/fallback
- Context management for AI conversations

**State Management:**
- Checkpoint system (.onboardkit/checkpoint.json)
- Resume capability after interruption
- Spec hash validation (detect external modifications)
- Chat history preservation for context continuity

### Code Generation Requirements

**Template System:**
- 3 core templates for MVP (Welcome, Login, Signup screens)
- Handlebars-based with TypeScript/React Native output
- Theme system (colors, typography, spacing)
- Navigation setup (React Navigation)
- Component library (shared UI components)

**Generated Code Quality:**
- TypeScript strict mode compilation
- React Native/Expo compatibility
- StyleSheet.create patterns (no external CSS)
- Prettier-formatted output
- Proper imports and type definitions

### Developer Experience Requirements

**Installation & Setup:**
- Zero-install via npx (friction-free first run)
- OAuth setup under 5 minutes
- Clear error messages with actionable guidance
- Verbose mode for debugging

**Documentation:**
- Comprehensive README with terminal GIF demo
- Example specs (3 complete examples)
- Help text for every command
- Troubleshooting guide

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Hybrid - OAuth from day 1 (non-negotiable core value), but MVP scope (1 provider, 3 templates initially)

**Core Philosophy:** Ship the smallest version that delivers the value proposition: "Run CLI, get working onboarding screens with zero AI costs." Focus on reliability over feature breadth.

**Resource Requirements:** Solo developer with day job, 10-15 hours/week, 6-8 week timeline

**Strategic Decision:** Prioritize OAuth + working code generation over template quantity and provider variety. Template-only generation (no AI) is still useful, but OAuth differentiates the product.

### MVP Feature Set (Phase 1 - v1.0)

**Timeline:** 6-8 weeks

**Core User Journey Supported:**
- React Native developer runs CLI
- Fills markdown spec (under 20 minutes)
- Completes OAuth (under 5 minutes)
- Gets working screens (under 1 hour total)

**Must-Have Capabilities:**
1. **OAuth 2.0 + PKCE:** Anthropic Claude only (not 4 providers)
2. **Markdown Parser:** unified + remark with Zod validation
3. **3 Core Templates:** Welcome, Login, Signup screens (not 20 templates)
4. **Code Generation:** Handlebars → TypeScript/React Native/Expo
5. **Checkpoint System:** Resume from interruption
6. **CLI Commands:**
   - `init` - Create spec template
   - `auth` - OAuth setup
   - `validate` - Spec validation
   - `generate` - Template-only (offline mode)
   - `onboard` - Full 7-phase workflow
   - `reset` - Clear checkpoints

**Explicitly Deferred from v1.0:**
- Additional AI providers (Gemini, GitHub Models, Ollama)
- Extended templates (17+ additional screen types)
- Interactive chat refinement
- Stitch MCP integration
- Template ejection/customization

### Post-MVP Features

**Phase 2 - v1.1 (Week 9-10):**
- Google Gemini OAuth support
- 5 additional templates (Settings, Profile, etc.)
- Enhanced error handling and recovery

**Phase 3 - v1.2 (Week 11-13):**
- GitHub Models (Device Flow)
- Ollama (local) support
- Provider selection in CLI
- 10+ templates total

**Phase 4 - v1.3 (Week 14-16):**
- Community template contributions
- Template versioning
- `eject` command for customization

**Phase 5 - v1.4 (Week 17-18):**
- Interactive chat refinement
- Multi-turn conversations
- Context-aware suggestions

### Risk Mitigation Strategy

**Technical Risks:**

**Risk:** OAuth complexity deters adoption
**Mitigation:**
- Clear documentation with screenshots
- Graceful error messages
- API key fallback for power users
- Test on all platforms (macOS, Linux, Windows)

**Risk:** Generated code doesn't compile
**Mitigation:**
- Template-based generation (not pure AI)
- TypeScript compilation check in tests
- Prettier formatting catches syntax errors
- 3 validated example specs

**Risk:** AI API costs during development
**Mitigation:**
- Aggressive caching of responses
- Limit API calls to validation/repair only
- Set hard budget: $50 dev budget, stop if exceeded

**Market Risks:**

**Risk:** Low adoption / No community validation
**Mitigation:**
- Strong launch strategy (Product Hunt, Reddit, HN)
- Excellent documentation with terminal GIF
- Solve real pain point (2-3 days → 1 hour)
- Focus on quality over metrics

**Risk:** Template rot (Expo SDK updates)
**Mitigation:**
- Start with only 3 templates (manageable)
- Pin Expo SDK version in generated code
- Version templates alongside CLI
- Community maintenance model post-launch

**Resource Risks:**

**Risk:** Timeline slippage / Burnout
**Mitigation:**
- 6-8 week timeline includes 2-week buffer
- Ship incomplete features as "coming soon"
- Take breaks between implementation phases
- Celebrate small wins

**Risk:** Scope creep during development
**Mitigation:**
- Strict feature freeze after each phase
- "No" is default answer to new features during MVP
- User feedback decides next features
- Document deferred features for post-launch

## Functional Requirements

### Authentication & Provider Management

- FR1: Users can authenticate with Anthropic Claude using OAuth 2.0 + PKCE
- FR2: CLI can store authentication credentials securely in OS keychain
- FR3: CLI can fall back to encrypted file storage when keychain unavailable
- FR4: System can refresh expired OAuth tokens automatically
- FR5: Users can view their current authentication status

### Specification Management

- FR6: Users can initialize a new onboarding spec from template
- FR7: CLI can parse markdown specification files
- FR8: CLI can validate spec files against schema
- FR9: CLI can detect spec modifications via hash comparison
- FR10: Users can validate their spec without generating code

### Code Generation

- FR11: CLI can generate TypeScript React Native components from specs
- FR12: System can render Welcome screen templates
- FR13: System can render Login screen templates
- FR14: System can render Signup screen templates
- FR15: CLI can generate navigation configuration
- FR16: CLI can generate theme files (colors, typography, spacing)
- FR17: CLI can generate shared component library
- FR18: System can format generated code with Prettier

### Workflow Management

- FR19: CLI can execute 7-phase onboard workflow
- FR20: System can create checkpoints after each phase
- FR21: Users can resume interrupted workflows from last checkpoint
- FR22: Users can reset workflow state and checkpoints
- FR23: System can track workflow progress and phase completion

### AI Enhancement

- FR24: CLI can send specs to AI provider for validation
- FR25: CLI can receive and apply AI-suggested spec repairs
- FR26: CLI can request AI enhancement of spec details
- FR27: System can maintain conversation context across AI interactions

### Output Management

- FR28: CLI can create output directory structure
- FR29: CLI can write generated files to disk atomically
- FR30: Users can specify custom output directory
- FR31: CLI can generate example spec files

### CLI Interface

- FR32: Users can invoke CLI via npx without installation
- FR33: Users can run init command to create spec template
- FR34: Users can run auth command for OAuth setup
- FR35: Users can run validate command for spec checking
- FR36: Users can run generate command for template-only generation
- FR37: Users can run onboard command for full AI workflow
- FR38: Users can run reset command to clear state
- FR39: CLI can display help text for all commands
- FR40: CLI can display progress indicators during execution

### Error Handling & Recovery

- FR41: CLI can display actionable error messages
- FR42: CLI can handle network failures gracefully
- FR43: CLI can retry failed operations with backoff
- FR44: CLI can operate in verbose mode for debugging
- FR45: System can validate generated code compilability

## Non-Functional Requirements

### Performance

**NFR-P1: CLI Startup Time**
- CLI must initialize and display first prompt within 500ms on standard hardware

**NFR-P2: Workflow Completion**
- Full onboard workflow (all 7 phases) must complete within 1 hour including OAuth setup time

**NFR-P3: Build Performance**
- TypeScript compilation and bundling must complete within 5 seconds

**NFR-P4: Bundle Size**
- Final npm package must be under 2MB to ensure fast npx execution

### Security

**NFR-S1: Credential Storage**
- OAuth credentials must be stored in OS-native secure storage (macOS Keychain, Windows Credential Manager, Linux Secret Service)

**NFR-S2: Encryption at Rest**
- Fallback credential files must use AES-256 encryption

**NFR-S3: Token Transmission**
- All OAuth token exchanges must occur over HTTPS with certificate validation

**NFR-S4: No Hardcoded Secrets**
- No API keys, client secrets, or credentials may be committed to source code

**NFR-S5: Token Expiration**
- System must validate token expiration before API calls and refresh automatically

### Reliability

**NFR-R1: Checkpoint Recovery**
- System must create checkpoint after each workflow phase, enabling resume from failure within 5 seconds

**NFR-R2: Network Resilience**
- API calls must retry up to 3 times with exponential backoff (1s, 2s, 4s) before failing

**NFR-R3: Error Messages**
- All error messages must include actionable guidance (what went wrong, how to fix it)

**NFR-R4: OAuth Success Rate**
- OAuth authentication flow must succeed >95% of the time on supported platforms (macOS, Linux, Windows)

**NFR-R5: Generated Code Quality**
- 100% of generated TypeScript code must compile without errors using strict mode

### Integration

**NFR-I1: AI Provider API**
- System must support Anthropic Claude API v1 with graceful handling of rate limits and errors

**NFR-I2: OAuth Compatibility**
- OAuth implementation must conform to RFC 6749 (OAuth 2.0) and RFC 7636 (PKCE)

**NFR-I3: Platform Compatibility**
- CLI must run on Node.js >=22 on macOS, Linux, and Windows without platform-specific code changes

**NFR-I4: Generated Code Compatibility**
- Generated code must compile and run with Expo SDK (latest stable) and React Native (latest stable)

### Maintainability

**NFR-M1: Code Quality**
- TypeScript strict mode must be enabled with zero `any` types in production code

**NFR-M2: Test Coverage**
- Core logic (parser, validator, generator) must maintain >80% unit test coverage

**NFR-M3: Cross-Platform Testing**
- Integration tests must pass on macOS, Linux, and Windows before release

**NFR-M4: Template Versioning**
- Templates must be versioned alongside CLI releases to prevent template rot
