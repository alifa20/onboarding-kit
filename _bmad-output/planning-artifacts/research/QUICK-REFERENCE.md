# OnboardKit - Technical Quick Reference

**Last Updated:** 2026-02-07
**Full Research:** `technical-CLI-Development-OnboardKit-research-2026-02-07.md`

---

## Technology Stack (Confirmed)

### Core Stack
| Component | Technology | Why |
|-----------|-----------|-----|
| Runtime | Node.js >= 22 | Native fetch, Web Streams |
| Language | TypeScript (strict mode) | Type safety, modern features |
| CLI Framework | Commander.js | Proven, lightweight |
| Terminal UI | @clack/prompts | Modern aesthetics |
| Build Tool | tsup | Fast, zero-config ESM |
| Dev Runtime | tsx | Direct TypeScript execution |

### Parsing & Validation
| Component | Technology | Why |
|-----------|-----------|-----|
| Markdown Parser | unified + remark-parse | Robust AST processing |
| Schema Validation | Zod | Runtime + compile-time types |
| Frontmatter | remark-frontmatter | YAML metadata extraction |

### Code Generation
| Component | Technology | Why |
|-----------|-----------|-----|
| Template Engine | Handlebars | Simple, proven |
| Code Formatting | Prettier | Consistent output |
| Alternative | Eta (future) | TypeScript-native |

### Authentication & AI
| Component | Technology | Why |
|-----------|-----------|-----|
| Credential Storage | keyring-node | keytar replacement |
| OAuth Library | oauth-callback | Modern Web Standards APIs |
| Claude SDK | @anthropic-ai/sdk | Official TypeScript SDK |
| Gemini SDK | @google/generative-ai | Official SDK |

### Testing & Quality
| Component | Technology | Why |
|-----------|-----------|-----|
| Test Framework | Vitest | Fast, native TS/ESM |
| Coverage Target | >80% | Core logic quality |
| Property Testing | fast-check | Parser validation |
| Terminal Colors | picocolors | 14x faster than chalk |

### CI/CD & Distribution
| Component | Technology | Why |
|-----------|-----------|-----|
| CI/CD | GitHub Actions | Free tier, OIDC |
| Versioning | Changesets | Explicit change docs |
| Publishing | npm (OIDC) | Trusted publishing |
| Distribution | npx | Zero installation |

---

## Architecture Patterns

### Project Structure
```
cli/                              # All CLI source code
  src/
    index.ts                      # CLI entry (commander)
    commands/                     # CLI commands
      onboard.ts                  # Main guided walkthrough
      init.ts, auth.ts, validate.ts, generate.ts, chat.ts, reset.ts, eject.ts
    phases/                       # 7 phases as isolated services
      auth-check.ts               # Phase 1
      spec-check.ts               # Phase 2
      spec-repair.ts              # Phase 3
      spec-enhance.ts             # Phase 4
      generation.ts               # Phase 5
      refinement.ts               # Phase 6
      finalize.ts                 # Phase 7
    parser/
      markdown.ts                 # MD → structured object
      schema.ts                   # Zod schemas + types
      validator.ts                # Parse + validate wrapper
    generator/
      engine.ts                   # Handlebars rendering
      writer.ts                   # Write files to disk
      prompt-builder.ts           # Stitch MCP prompts
    ai/
      client.ts                   # Unified AI interface
      providers/                  # Provider adapters
        anthropic.ts, google.ts, github.ts, ollama.ts, types.ts
      prompts/                    # Specialized prompts
        repair.ts, enrich.ts, generate.ts, refine.ts
      chat.ts                     # Interactive chat loop
    auth/
      oauth.ts                    # PKCE utilities, callback server
      store.ts                    # Credential storage
      manager.ts                  # Provider selection
    checkpoint/
      store.ts                    # Read/write checkpoint.json
      resume.ts                   # Resume logic
    utils/
      logger.ts, format.ts, constants.ts
  templates/                      # Handlebars templates (20 files)
    expo/
      screens/, navigation/, theme/, hooks/, components/
  examples/                       # Example spec files
    finance-app.md, fitness-app.md, saas-app.md
```

### State Machine (7 Phases)
```
auth-pending → auth-done
spec-missing → spec-ready
spec-invalid → spec-valid
spec-valid → spec-enhanced
spec-enhanced → generated
generated → refined
refined → complete
```

### Checkpoint Structure
```json
{
  "phase": "spec-enhanced",
  "timestamp": "2026-02-07T15:30:00Z",
  "specHash": "sha256:abc123...",
  "generatedFiles": ["screens/Welcome.tsx", "..."],
  "chatHistory": [...],
  "decisions": {
    "provider": "anthropic",
    "secondaryColor": "#A29BFE"
  },
  "phaseData": {
    "auth": { "provider": "anthropic", "authenticated": true },
    "spec": { "valid": true, "repairIterations": 2 },
    "enhance": { "suggestionsAccepted": 3, "suggestionsSkipped": 1 }
  }
}
```

---

## OAuth 2.0 + PKCE Flow

### Implementation Steps
1. Generate `code_verifier` (43-128 chars: A-Z, a-z, 0-9, -._~)
2. Generate `code_challenge` (BASE64-URL SHA256 of verifier)
3. Open browser to provider's auth URL with challenge
4. Spin up localhost callback server (random port)
5. Capture authorization code from redirect
6. Exchange code for tokens using verifier
7. Store refresh token via keyring-node
8. Cache access token in memory only

### Security Checklist
- ✅ Use `state` parameter for CSRF protection
- ✅ Whitelist redirect URIs
- ✅ Short-lived access tokens (15 min)
- ✅ Long-lived refresh tokens (7 days)
- ✅ Auto-refresh on token expiry
- ✅ Store refresh tokens securely (never access tokens)
- ✅ Implement token rotation

### Credential Storage Priority
1. **Primary:** OS keychain via keyring-node (macOS Keychain, Linux libsecret, Windows Credential Manager)
2. **Fallback:** Encrypted JSON at `~/.onboardkit/credentials.json`
3. **Session:** In-memory cache for access tokens (cleared on exit)

---

## AI Provider Integration

### Multi-Provider Abstraction Pattern
```typescript
interface IAuthProvider {
  name: string;
  isConfigured(): Promise<boolean>;
  authenticate(): Promise<void>;
  getClient(): AIClient;
  testConnection(): Promise<boolean>;
}

// Middleware pattern
const clientWithRetry = withRetry(baseClient, { maxRetries: 3 });
const clientWithFallback = withFallback(primaryClient, fallbackClient);
```

### Provider Comparison
| Provider | Auth Method | Cost | Notes |
|----------|-------------|------|-------|
| Anthropic Claude | OAuth 2.0 + PKCE | Free with Pro/Max | Best code quality |
| Google Gemini | OAuth 2.0 | Free (15 RPM) | Generous free tier |
| GitHub Models | Device Flow | Free tier | Multiple models |
| Ollama | None (local) | Free | No signup, private |

### Token Refresh Strategy
```typescript
// Check expiry before each API call
if (Date.now() >= tokenExpiresAt) {
  accessToken = await refreshAccessToken(refreshToken);
}
```

---

## Testing Strategy

### Test Types & Coverage
| Test Type | Tool | Coverage Target | Focus |
|-----------|------|-----------------|-------|
| Unit | Vitest | >80% | Parser, validator, generator |
| Integration | Vitest | >60% | Phase coordination, data flow |
| E2E | Vitest | Key paths | Full `onboard` workflow |
| Snapshot | Vitest | All | `--help` output, generated code |
| Property-Based | fast-check | Parser | Random valid/invalid inputs |

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/', 'examples/', 'templates/']
    }
  }
});
```

### Test Commands
```bash
vitest            # Watch mode
vitest run        # Run once
vitest --coverage # With coverage
vitest --ui       # Visual UI
```

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Publish to npm

on:
  release:
    types: [published]

permissions:
  id-token: write  # Required for OIDC
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Release Process
1. Make changes, commit with conventional commits
2. Run `npx changeset` to document changes
3. Create PR, merge to main
4. GitHub Actions creates release PR with version bump
5. Merge release PR → automated publish to npm

### Conventional Commit Format
```
feat: add OAuth support for Google Gemini
fix: resolve path traversal vulnerability
docs: update README with examples
chore: bump dependencies
```

---

## Configuration Management

### Hierarchical Config (Priority Order)
1. **CLI flags:** `--provider anthropic` (highest)
2. **Environment variables:** `ONBOARDKIT_PROVIDER=anthropic`
3. **Project config:** `.onboardkit/config.json`
4. **Global config:** `~/.onboardkit/config.json`
5. **Defaults:** Built-in code (lowest)

### Config Schema
```json
{
  "provider": "anthropic",
  "outputDir": "./onboardkit-output",
  "templates": {
    "source": "builtin",
    "customPath": null
  },
  "defaults": {
    "platform": "expo",
    "styling": "stylesheet",
    "navigation": "react-navigation"
  },
  "behavior": {
    "autoFormat": true,
    "skipEnhancement": false,
    "verboseLogging": false
  },
  "stitch": {
    "autoConnect": false,
    "savePromptsAlways": true
  }
}
```

---

## Error Handling

### Result Pattern
```typescript
type Result<T, E> = Ok<T> | Err<E>;

function parseSpec(path: string): Result<OnboardingSpec, ParseError> {
  try {
    const content = fs.readFileSync(path, 'utf-8');
    const spec = parseMarkdown(content);
    return Ok(spec);
  } catch (error) {
    return Err(new ParseError(error.message));
  }
}

// Usage
const result = parseSpec('spec.md');
if (result.isOk()) {
  const spec = result.value;
} else {
  console.error(result.error);
  process.exit(1);
}
```

### Exit Codes
- **0:** Success
- **1:** Validation error (user input issue)
- **2:** System error (file I/O, network, etc.)

### Best Practices
- Use Result pattern for expected failures (parsing, validation)
- Use try-catch for unexpected failures (I/O, network)
- Provide helpful error messages with context
- Include suggestions for fixing errors
- Use `--verbose` flag for stack traces

---

## Security Checklist

### Input Validation
- ✅ Validate all user inputs with Zod before processing
- ✅ Sanitize data before template rendering
- ✅ Validate output paths (prevent directory traversal)
- ✅ Never include credentials in error messages or logs

### Credential Protection
- ✅ Use OS keychain as primary storage
- ✅ Encrypt fallback credential files (AES-256-GCM)
- ✅ Never log credentials or tokens
- ✅ Clear sensitive data from memory after use
- ✅ Use constant-time comparison for secrets

### File System Security
```typescript
// Path traversal prevention
function validateOutputPath(outputDir: string, fileName: string): string {
  const resolved = path.resolve(outputDir, fileName);
  if (!resolved.startsWith(path.resolve(outputDir))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

### Template Injection Prevention
```typescript
// Sanitize before rendering
const sanitized = {
  headline: sanitizeString(spec.welcome.headline),
  subtext: sanitizeString(spec.welcome.subtext)
};
const output = template(sanitized);
```

---

## Performance Optimization

### Build Optimization
- Bundle to single ESM file
- Lazy-load subcommands (dynamic imports)
- Tree-shake unused dependencies
- Minimize bundle size (<2MB target)

### Runtime Optimization
- Cache parsed specs in memory during workflow
- Batch file writes at end of phase
- Use streaming for large file operations
- Parallel template rendering where possible

### Startup Time
- Target: <500ms for CLI commands
- Use dynamic imports for heavy dependencies
- Load AI SDKs only when needed
- Cache credential checks

---

## Documentation Standards

### CLI Help Format
```bash
Usage: onboardkit <command> [options]

Commands:
  onboard    Generate onboarding screens (guided walkthrough)
  init       Create template spec.md
  auth       Connect AI provider via OAuth
  validate   Validate spec.md against schema
  generate   Generate from templates (no AI)
  chat       Refine existing output
  reset      Clear checkpoints
  eject      Copy templates locally

Options:
  -h, --help     Display help for command
  -v, --version  Display version
  --verbose      Show detailed logs

Examples:
  $ onboardkit init
  $ onboardkit onboard
  $ onboardkit onboard --spec my-app-spec.md
  $ onboardkit auth
```

### README Requirements
- Terminal GIF showing full workflow (use vhs/terminalizer)
- Quick start (install → init → onboard)
- 3+ example specs with explanations
- Architecture diagram
- Troubleshooting section
- Contributing guide

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Set up `cli/` project structure
- [ ] Configure tsup, TypeScript, Vitest
- [ ] Define Zod schemas (`parser/schema.ts`)
- [ ] Implement markdown parser (`parser/markdown.ts`)
- [ ] Write unit tests for parser
- **Milestone:** Parse example specs to validated objects

### Week 2: Core Generation
- [ ] Create 20 Handlebars templates
- [ ] Implement template engine (`generator/engine.ts`)
- [ ] Implement Stitch prompt builder (`generator/prompt-builder.ts`)
- [ ] Write unit tests for generator
- **Milestone:** Generate code from spec (template-only)

### Week 3: Auth & AI
- [ ] Implement OAuth 2.0 + PKCE (`auth/oauth.ts`)
- [ ] Build credential storage with keyring-node (`auth/store.ts`)
- [ ] Create AI client abstraction (`ai/client.ts`)
- [ ] Implement Anthropic adapter (`ai/providers/anthropic.ts`)
- **Milestone:** Authenticate and make AI API calls

### Week 4: Workflow
- [ ] Implement checkpoint system (`checkpoint/store.ts`)
- [ ] Build all 7 phases (`phases/*.ts`)
- [ ] Create CLI commands (`commands/*.ts`)
- [ ] Wire up phase orchestration
- **Milestone:** Complete `onboardkit onboard` workflow

### Week 5: Polish & Launch
- [ ] Write example specs (finance, fitness, SaaS)
- [ ] Create README with terminal GIF
- [ ] Set up GitHub Actions CI/CD
- [ ] Configure changesets
- [ ] Test on macOS, Linux, Windows
- [ ] Publish v1.0 to npm
- **Milestone:** Production-ready launch

---

## Cost & Timeline

### Development Costs
| Item | Cost | Notes |
|------|------|-------|
| Infrastructure | $0/month | GitHub/npm free tiers |
| Claude Pro | $20/month × 1.25 | Development AI access |
| **Total** | **~$100** | 5 weeks development |

### Time Estimates (Solo Developer)
| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Week 1 | Foundation | Parser working |
| Week 2 | Generation | Template output |
| Week 3 | Auth & AI | OAuth + API calls |
| Week 4 | Workflow | Full CLI functional |
| Week 5 | Polish | v1.0 published |
| **Total** | **4-5 weeks** | Production ready |

---

## Success Metrics

### 30-Day Targets
- GitHub stars: 200+
- npm weekly downloads: 100+
- GitHub issues: 20+ (engagement)
- Community PRs: 5+
- Example specs contributed: 3+

### 90-Day Targets
- GitHub stars: 1,000+
- npm weekly downloads: 500+
- Showcase projects: 10+
- Blog mentions: 5+
- Fork count: 50+

### Quality Metrics
- Test coverage: >80% (core logic)
- Build time: <5 seconds
- Startup time: <500ms
- Bundle size: <2MB
- Type safety: 100% (no `any`)

---

## OpenClaw Lessons Applied

### Architecture
- ✅ **CLI-First Design:** Universal interface that scales
- ✅ **Service-Oriented:** Phases as isolated services
- ✅ **Gateway Pattern:** Commands route to phases
- ✅ **Local-First:** State stored locally, optional cloud

### Security
- ✅ **Command Validation:** Whitelist patterns
- ✅ **Path Safety:** Prevent directory traversal
- ✅ **Credential Encryption:** Multi-tier storage
- ✅ **Input Sanitization:** Validate at boundaries

### Execution
- ✅ **Serial-First:** Optimize later (start simple)
- ✅ **Checkpoint System:** Resume from failures
- ✅ **Error Recovery:** Graceful degradation
- ✅ **Docker Optional:** Keep it simple for CLI

---

## Common Issues & Solutions

### Issue: OAuth Callback Timeout
**Solution:** Increase callback server timeout to 2 minutes, provide manual token entry fallback

### Issue: Credential Storage Fails
**Solution:** Multi-tier fallback (keyring-node → encrypted file → manual entry)

### Issue: Template Generation Errors
**Solution:** TypeScript compilation check on generated code, Prettier formatting catches syntax errors

### Issue: Spec Parsing Failures
**Solution:** Detailed error messages with line numbers, AI repair suggestions in Phase 3

### Issue: Cross-Platform Path Issues
**Solution:** Use `path.resolve()` everywhere, test on all platforms

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Run with tsx (watch mode)
npm run build           # Build with tsup
npm run test            # Run Vitest
npm run test:coverage   # Run tests with coverage

# CLI Usage
npx onboardkit init                    # Create spec.md template
npx onboardkit validate                # Validate spec
npx onboardkit onboard                 # Full workflow
npx onboardkit auth                    # OAuth setup
npx onboardkit generate                # Template-only (no AI)
npx onboardkit chat                    # Refine output
npx onboardkit reset                   # Clear checkpoints
npx onboardkit eject                   # Copy templates locally

# Release
npx changeset                          # Document changes
git commit -m "feat: new feature"      # Conventional commit
git push                               # Trigger CI
# GitHub Actions creates release PR automatically
```

---

## Resources

### Documentation
- [Full Technical Research](./technical-CLI-Development-OnboardKit-research-2026-02-07.md)
- [OpenClaw Architecture](https://github.com/openclaw/openclaw)
- [TypeScript CLI Guide 2026](https://hackers.pub/@hongminhee/2026/typescript-cli-2026)
- [OAuth 2.0 + PKCE Spec](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)

### Tools
- [Vitest Docs](https://vitest.dev/)
- [Zod Docs](https://zod.dev/)
- [tsup Docs](https://tsup.egoist.dev/)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Changesets](https://github.com/changesets/changesets)

---

**Last Updated:** 2026-02-07
**Version:** 1.0
**Status:** ✅ Ready for Implementation
