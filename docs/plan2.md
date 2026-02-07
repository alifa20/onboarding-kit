# OnboardKit - MVP-First Implementation Plan

**Author:** Soldier (AI Assistant)  
**Date:** 2026-02-07  
**Status:** Recommended Alternative to 5-Week Plan  
**Based On:** OpenClaw architectural lessons + realistic solo developer constraints

---

## Executive Summary

Your technical research is **excellent** - comprehensive, well-structured, and thorough. However, the 5-week implementation timeline is **overly ambitious** for a solo developer with a day job.

**Key Issue:** Trying to build too many features at once (OAuth, 4 AI providers, 20 templates, checkpoints, chat refinement) increases risk of:
- Burnout from scope creep
- Never shipping (perpetual development)
- Abandoning project mid-way
- Budget/time overruns

**Solution:** MVP-First approach - ship a working product in 3-4 weeks, iterate based on user feedback.

---

## Assessment Summary

### ✅ What's Strong

1. **Architecture Design**
   - 7-phase workflow with checkpoints (smart)
   - Service-oriented design (scalable)
   - CLI-first approach (universal interface)
   - Local-first with optional cloud (reduces complexity)

2. **Tech Stack**
   - TypeScript + Commander.js (battle-tested)
   - Vitest for testing (modern, fast)
   - tsup for bundling (zero-config)
   - Zod for validation (type-safe)

3. **Security Approach**
   - OAuth 2.0 + PKCE (proper auth flow)
   - Multi-tier credential storage
   - Path traversal prevention
   - Input sanitization

### ⚠️ Major Concerns

1. **Scope Creep (Critical)**
   - OAuth for 4 AI providers
   - 20 Handlebars templates
   - Checkpoint/resume system
   - Interactive chat refinement
   - **Reality:** Each feature = 1-2 weeks alone

2. **AI Integration Complexity**
   - 4 providers = 4 different auth patterns
   - Token refresh strategies per provider
   - Rate limiting handling
   - Fallback logic
   - **OpenClaw Lesson:** They started with 1 provider, added others over time

3. **OAuth is Hard**
   - Callback server setup
   - State management
   - Token refresh mechanics
   - Cross-platform keychain access (macOS/Linux/Windows)
   - **OpenClaw Lesson:** They avoided OAuth initially, used API keys

4. **Template Maintenance**
   - 20 templates across multiple categories
   - Expo SDK updates (quarterly)
   - React Navigation API changes
   - **Reality:** Templates rot fast in React Native ecosystem

5. **Timeline Underestimate**
   - Original plan: 5 weeks
   - Real calendar time: 10-15 weeks (10-15 hrs/week development)
   - Development complexity: 8-12 weeks full-time equivalent

6. **Budget Underestimate**
   - Original: $100
   - Realistic: $150-200 (API costs during dev/testing)

---

## MVP-First Approach (Recommended)

### Core Philosophy

**Ship the smallest possible version that provides value:**
- Template-only generation (no AI) = still useful
- Add AI layer once proven
- OAuth when users demand it
- Additional providers based on feedback

**OpenClaw took 2 years to reach current polish. Don't try to build it in 5 weeks.**

---

## Phase 1: Proof of Concept (Week 1-2)

### Goal
Validate the core concept: "Generate React Native onboarding screens from markdown specs"

### Scope
```bash
npx onboardkit init       # Create spec.md template
npx onboardkit validate   # Check spec.md validity
npx onboardkit generate   # Generate screens (template-only, no AI)
```

### Features
✅ **Include:**
- Basic markdown parsing (frontmatter + content sections)
- Zod schema validation
- 3 core templates: Welcome, Login, Signup screens
- Simple Handlebars rendering
- File output to `./onboardkit-output/`
- Basic error messages

❌ **Exclude:**
- AI integration
- OAuth authentication
- Checkpoint system
- Chat refinement
- Multiple AI providers
- 17 additional templates

### Tech Stack (Minimal)
```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "@clack/prompts": "^0.7.0",
    "unified": "^11.0.4",
    "remark-parse": "^11.0.0",
    "remark-frontmatter": "^5.0.0",
    "zod": "^3.22.4",
    "handlebars": "^4.7.8",
    "picocolors": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "tsup": "^8.0.1",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0"
  }
}
```

### Deliverables
- Working CLI that generates 3 screens from markdown
- 3 example specs (finance-app.md, fitness-app.md, saas-app.md)
- Basic README with usage instructions
- Unit tests for parser + validator (>70% coverage)

### Success Criteria
- Can run `npx onboardkit init` and get valid spec template
- Can run `npx onboardkit generate` and get working React Native screens
- Generated code compiles without errors
- Total time: **2 weeks (20-30 hours)**

---

## Phase 2: AI Layer (Week 3-4)

### Goal
Add intelligent spec validation and repair using Claude API

### Scope
```bash
npx onboardkit onboard    # Guided workflow with AI validation
```

### Features
✅ **Include:**
- Claude API integration (API key-based auth)
- Phase 2: Spec validation (AI checks for completeness)
- Phase 3: Spec repair (AI suggests fixes for invalid specs)
- Simple prompt templates for validation/repair
- Environment variable: `ANTHROPIC_API_KEY`

❌ **Exclude:**
- OAuth (use API key for now)
- Other AI providers (Google, GitHub, Ollama)
- Checkpoint system
- Phase 4: Enhancement (AI suggestions)
- Phase 6: Refinement chat

### AI Integration Pattern
```typescript
// Simple, single-provider approach
interface AIClient {
  validateSpec(spec: string): Promise<ValidationResult>;
  repairSpec(spec: string, errors: ValidationError[]): Promise<string>;
}

class AnthropicClient implements AIClient {
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async validateSpec(spec: string): Promise<ValidationResult> {
    // Single API call, simple prompt
  }
  
  async repairSpec(spec: string, errors: ValidationError[]): Promise<string> {
    // Single API call, repair prompt
  }
}
```

### Auth Strategy (Simple)
```typescript
// No OAuth, just API key
const apiKey = process.env.ANTHROPIC_API_KEY || 
               await getFromKeychain('anthropic-api-key') ||
               await promptUserForKey();

if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not found. Get your key from: https://console.anthropic.com');
  process.exit(1);
}
```

### Deliverables
- AI-powered spec validation
- AI-powered spec repair
- Better error messages with AI context
- Updated README with AI setup instructions

### Success Criteria
- AI catches invalid specs and suggests fixes
- Repair success rate >80% for common errors
- API costs during development: <$20
- Total time: **2 weeks (20-30 hours)**

---

## Phase 3: Polish & Launch (Week 5-6)

### Goal
Production-ready v1.0 with solid UX and documentation

### Scope
```bash
npx onboardkit --help     # Beautiful help text
npx onboardkit --version  # Version info
```

### Features
✅ **Include:**
- Checkpoint system (resume from failures)
- Better error handling + recovery
- Progress indicators during generation
- 3 polished example specs with screenshots
- Comprehensive README with terminal GIF
- GitHub Actions CI/CD setup
- npm publish workflow
- MIT license

❌ **Still Exclude:**
- OAuth (add in v1.1)
- Multiple AI providers (add in v1.2)
- Additional templates beyond core 3 (add in v1.3)
- Chat refinement (add in v1.4)

### Checkpoint System (Simple)
```typescript
// Minimal checkpoint for resume capability
interface Checkpoint {
  phase: 'init' | 'validate' | 'repair' | 'generate' | 'complete';
  timestamp: string;
  specPath: string;
  outputDir: string;
  errors?: string[];
}

// Save after each phase
await saveCheckpoint({
  phase: 'validate',
  timestamp: new Date().toISOString(),
  specPath: './spec.md',
  outputDir: './onboardkit-output'
});
```

### Documentation Requirements
- **README.md:**
  - Terminal GIF showing full workflow (30 seconds)
  - Quick start (install → init → generate)
  - 3 example specs with visual results
  - Troubleshooting section
- **CONTRIBUTING.md:**
  - How to add new templates
  - How to run tests
  - Code style guidelines
- **examples/:**
  - `finance-app.md` + screenshot
  - `fitness-app.md` + screenshot
  - `saas-app.md` + screenshot

### Deliverables
- Published to npm as `@onboardkit/cli` or `onboardkit`
- GitHub repo with CI/CD
- 3 example specs with visual results
- Terminal GIF demo
- v1.0.0 release notes

### Success Criteria
- npm weekly downloads: 50+ in first month
- GitHub stars: 100+ in first month
- Zero critical bugs reported in first week
- Total time: **2 weeks (20-30 hours)**

---

## Realistic Timeline & Costs

### Calendar Time Breakdown

**Assumptions:**
- Solo developer with day job
- 10-15 hours/week available for development
- Real-world interruptions (life happens)

| Phase | Calendar Weeks | Dev Hours | Dates |
|-------|---------------|-----------|-------|
| Phase 1: PoC | 2 weeks | 20-30 hrs | Week 1-2 |
| Phase 2: AI Layer | 2 weeks | 20-30 hrs | Week 3-4 |
| Phase 3: Polish | 2 weeks | 20-30 hrs | Week 5-6 |
| **Total** | **6 weeks** | **60-90 hrs** | **1.5 months** |

**Buffer:** Add 2 weeks for unexpected issues = **8 weeks total**

### Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Claude API (dev) | $30 | Testing validation/repair |
| Claude API (examples) | $20 | Generating example specs |
| Claude Pro subscription | $40 | 2 months × $20 |
| Domain (optional) | $15 | onboardkit.dev |
| **Total** | **$105** | Realistic estimate |

**Original estimate was $100, this aligns well but accounts for real usage.**

---

## Post-Launch Roadmap (v1.1+)

### v1.1 - OAuth Support (Week 9-10)
**If users request it:**
- Add OAuth 2.0 + PKCE for Claude
- Multi-tier credential storage
- Token refresh logic
- **Effort:** 2 weeks

### v1.2 - Multiple AI Providers (Week 11-13)
**If users want choice:**
- Add Google Gemini support
- Add GitHub Models support
- Provider selection in `onboard` command
- **Effort:** 3 weeks

### v1.3 - Extended Templates (Week 14-16)
**Based on user requests:**
- Add 5-10 more templates (Settings, Profile, etc.)
- Community template contributions
- Template versioning
- **Effort:** 3 weeks

### v1.4 - Chat Refinement (Week 17-18)
**If users need it:**
- Interactive chat for tweaking generated code
- Multi-turn conversations
- Context-aware suggestions
- **Effort:** 2 weeks

**Total to full vision: 18 weeks (4.5 months)**

---

## Risk Mitigation

### Risk 1: Scope Creep
**Mitigation:**
- Strict feature freeze after each phase
- User feedback decides next features
- "No" is the default answer to new features during MVP

### Risk 2: AI API Costs
**Mitigation:**
- Aggressive caching of AI responses
- Limit API calls to validation/repair only (no enhancement in MVP)
- Set hard budget limit: $50 for dev, stop if exceeded

### Risk 3: Template Rot
**Mitigation:**
- Start with only 3 templates
- Pin Expo SDK version in generated code
- Version templates alongside CLI
- Community maintenance model post-launch

### Risk 4: Low Adoption
**Mitigation:**
- Focus on documentation quality
- Create compelling example specs
- Post to r/reactnative, Twitter, Product Hunt
- Offer to generate specs for open-source projects

### Risk 5: Burnout
**Mitigation:**
- 6-week timeline has buffer
- Ship incomplete features as "coming soon"
- Take breaks between phases
- Celebrate small wins

---

## Decision Framework

### When to Add a Feature

**Ask these questions:**
1. **Is it blocking v1.0 launch?** (No = defer)
2. **Do 3+ users request it?** (No = defer)
3. **Can it be added in <1 week?** (No = break down)
4. **Does it complicate the core UX?** (Yes = defer)

**Default answer: "Great idea! Let's add it in v1.X after we validate the core concept."**

### When to Ship

**Ship when:**
- Core workflow works end-to-end
- 3 example specs generate correctly
- README has clear instructions
- No critical bugs in manual testing

**Don't wait for:**
- Perfect code coverage (70% is fine)
- All edge cases handled (log them as issues)
- Full OAuth implementation (API keys work)
- Community templates (core 3 are enough)

---

## Success Metrics

### 30-Day Post-Launch
- npm weekly downloads: **50+** (not 100+)
- GitHub stars: **100+** (not 200+)
- GitHub issues: **10+** (engagement signal)
- No critical bugs: **0** (quality signal)

### 90-Day Post-Launch
- npm weekly downloads: **200+**
- GitHub stars: **300+**
- Community PRs: **3+**
- Example specs contributed: **2+**

**Adjust expectations downward from original plan to avoid disappointment.**

---

## Why This Plan is Better

### Original 5-Week Plan Issues
1. ❌ Tries to build everything at once
2. ❌ No validation of core concept before investing in OAuth
3. ❌ 20 templates = massive maintenance burden
4. ❌ 4 AI providers = 4x complexity
5. ❌ Unrealistic for solo developer with day job

### MVP-First Plan Advantages
1. ✅ Ships working product in 6 weeks
2. ✅ Validates core concept before heavy investment
3. ✅ 3 templates = manageable, extensible
4. ✅ 1 AI provider = focused, debuggable
5. ✅ Realistic timeline with buffer

### Risk Comparison

| Risk | Original Plan | MVP Plan |
|------|--------------|----------|
| Never ships | High | Low |
| Scope creep | Very High | Low |
| Burnout | High | Medium |
| Wasted effort | High | Low |
| Low adoption | Medium | Medium |

---

## Next Steps

### Week 1 Action Items

**Day 1-2: Project Setup**
- [ ] Create `cli/` directory structure
- [ ] Initialize npm package (`npm init`)
- [ ] Configure TypeScript (`tsconfig.json`)
- [ ] Configure tsup (`tsup.config.ts`)
- [ ] Set up Vitest (`vitest.config.ts`)
- [ ] Create basic README

**Day 3-4: Parser Foundation**
- [ ] Define Zod schemas (`parser/schema.ts`)
- [ ] Implement markdown parser (`parser/markdown.ts`)
- [ ] Write parser tests (50+ test cases)
- [ ] Test with example specs

**Day 5-7: Template Engine**
- [ ] Create 3 Handlebars templates
  - `templates/Welcome.hbs`
  - `templates/Login.hbs`
  - `templates/Signup.hbs`
- [ ] Implement template renderer (`generator/engine.ts`)
- [ ] Write generator tests
- [ ] Test end-to-end (spec → code)

**Week 1 Milestone:** Parse markdown specs and generate 3 screens

### Week 2 Action Items

**Day 8-10: CLI Commands**
- [ ] Implement `onboardkit init` (create spec template)
- [ ] Implement `onboardkit validate` (check spec)
- [ ] Implement `onboardkit generate` (render templates)
- [ ] Add `--help`, `--version` flags
- [ ] Test CLI commands manually

**Day 11-12: Error Handling**
- [ ] Better error messages with context
- [ ] Line numbers for parsing errors
- [ ] Validation error details
- [ ] Success messages with output paths

**Day 13-14: Polish & Test**
- [ ] Write 3 example specs
- [ ] End-to-end manual testing
- [ ] Fix critical bugs
- [ ] Update README with examples

**Week 2 Milestone:** Working CLI that generates screens from markdown

---

## Comparison: Original vs MVP Plan

| Aspect | Original Plan | MVP Plan | Winner |
|--------|--------------|----------|--------|
| Timeline | 5 weeks | 6 weeks | MVP (realistic) |
| Features | All at once | Incremental | MVP (safer) |
| AI Providers | 4 providers | 1 provider | MVP (focused) |
| Templates | 20 templates | 3 templates | MVP (manageable) |
| Auth | OAuth PKCE | API key | MVP (simpler) |
| Checkpoints | Phase 1 | Phase 3 | MVP (when needed) |
| Risk of failure | High | Low | MVP (de-risked) |
| Risk of burnout | Very High | Medium | MVP (sustainable) |
| Time to first user | 5+ weeks | 2 weeks | MVP (faster feedback) |
| Cost | $100 (under) | $105 (accurate) | Tie |

---

## Conclusion

**Your research is excellent. Your ambition is admirable. Your timeline is unrealistic.**

**The MVP-First approach:**
- Ships a working product in 6 weeks (vs 5 weeks that never ships)
- Validates the core concept before heavy investment
- Reduces risk of scope creep and burnout
- Allows iteration based on real user feedback
- Builds sustainable momentum

**OpenClaw didn't become OpenClaw in 5 weeks. It took 2 years of iteration.**

**Start small. Ship fast. Iterate based on feedback.**

---

## Final Recommendation

**Choose MVP-First Plan (this document) over the original 5-week plan.**

**Rationale:**
1. Higher probability of success (ship something vs ship nothing)
2. Faster time to user feedback (2 weeks vs 5+ weeks)
3. Lower risk of burnout and abandonment
4. Easier to debug and test (fewer moving parts)
5. Sustainable pace for solo developer with day job

**Next Action:** Review this plan, adjust if needed, then start Week 1 Day 1 tasks.

**Remember:** Done is better than perfect. Ship the MVP, then make it great.

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Status:** ✅ Ready for Review & Execution
