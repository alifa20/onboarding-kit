# Stitch MCP Integration

OnboardKit now includes **Stitch MCP integration** for AI-powered UI design generation.

## Overview

The tool generates React Native code in two ways:

1. **Template-only mode** (`generate` command): Fast code generation using Handlebars templates
2. **AI-enhanced mode** (`onboard` command): 7-phase workflow including Stitch UI generation

## Workflow with Stitch

```
Markdown Spec
  ↓
Phase 1: OAuth Authentication (Claude)
  ↓
Phase 2: Spec Validation (AI)
  ↓
Phase 3: Spec Repair (AI, if needed)
  ↓
Phase 4: Copy Enhancement (AI, optional)
  ↓
Phase 5: Code Generation (Handlebars templates)
  ↓
Phase 6: Refinement (placeholder)
  ↓
Phase 7: Finalize
  ├─ Write React Native code to disk
  ├─ Generate Stitch prompts → stitch-prompts/
  └─ [Optional] Connect to Stitch MCP → Generate UI designs
```

## Phase 7: Stitch Integration

In Phase 7 (Finalize), OnboardKit:

1. **Always writes Stitch prompts** to `stitch-prompts/` directory
   - One markdown file per screen (welcome.md, login.md, etc.)
   - Contains detailed design instructions with theme colors, layout, content
   - Can be used manually even without MCP connection

2. **Optionally connects to Stitch MCP** (if available)
   - Prompts user: "Connect to Stitch MCP to generate UI designs?"
   - Creates a Stitch project
   - Generates all screen designs using Stitch's AI
   - Displays preview URLs for each generated design

## Implementation Details

### Stitch Prompt Builder

**Location:** `cli/src/lib/stitch/prompt-builder.ts`

Generates detailed prompts for each screen type:
- Welcome screen
- Onboarding steps (with progress indicators)
- Soft paywall (optional)
- Login screen (with social auth buttons)
- Name capture / signup
- Hard paywall (optional)
- Home screen placeholder

Each prompt includes:
- Screen purpose and layout instructions
- Theme colors and typography
- Design guidelines and best practices
- Content (headlines, CTAs, copy)
- Device type (MOBILE/DESKTOP/TABLET)

### Stitch MCP Client

**Location:** `cli/src/lib/stitch/client.ts`

Interfaces with Stitch MCP server using these tools:
- `mcp__stitch__create_project` - Create a new Stitch project
- `mcp__stitch__generate_screen_from_text` - Generate a screen from text prompt
- `mcp__stitch__get_screen` - Retrieve screen details
- `mcp__stitch__list_screens` - List all screens in project

**Note:** The current implementation documents the MCP interface but requires Claude Code's MCP integration to make actual calls. This is because:
1. MCP tool calls must go through Claude Code's protocol
2. The CLI cannot directly call MCP tools outside of Claude Code context
3. Prompts are always saved to disk for manual use or future integration

### Phase 7 Integration

**Location:** `cli/src/lib/workflow/phases.ts`

The `executeFinalize` function now:
1. Writes all generated code files
2. Builds Stitch prompts using `buildStitchPrompts(spec)`
3. Formats prompts as markdown using `formatPromptsAsMarkdown(prompts)`
4. Writes prompts to `stitch-prompts/` directory
5. Checks if Stitch MCP is available using `isStitchMCPAvailable()`
6. If available, prompts user to connect
7. If user agrees, creates project and generates all screens
8. Displays success/failure results with preview URLs

## Usage

### Using the `onboard` Command (AI + Stitch)

```bash
# Authenticate first (one-time setup)
npx onboardkit auth

# Run the full workflow with AI and Stitch
npx onboardkit onboard spec.md --output ./my-app

# During Phase 7, you'll be prompted:
# ┌ Connect to Stitch MCP to generate UI designs?
# └ Yes / No
```

If you select "Yes", OnboardKit will:
- Create a Stitch project
- Generate all screen designs
- Display Stitch URLs where you can view/edit designs
- Continue with code generation

### Generated Output Structure

```
my-app/
├── app/                     # Expo Router screens
├── components/              # Shared components
├── theme/                   # Theme files (colors, typography, spacing)
├── stitch-prompts/         # ✨ Stitch prompts (always generated)
│   ├── welcome.md
│   ├── onboarding-step-0.md
│   ├── onboarding-step-1.md
│   ├── login.md
│   ├── name-capture.md
│   └── home.md
└── .onboardkit-metadata.json
```

### Manual Use of Stitch Prompts

Even without MCP connection, you can use the generated prompts:

1. Navigate to `stitch-prompts/` directory
2. Copy any prompt (e.g., `welcome.md`)
3. Open Stitch manually
4. Paste the prompt to generate that screen design
5. Export the design and integrate with your code

## Example Stitch Prompt

Here's what a generated prompt looks like:

````markdown
# Welcome Screen

**Screen ID:** `welcome`
**Device Type:** MOBILE

---

Create a mobile welcome screen for "FitnessTracker".

**Layout:**
- Full-screen design with the following elements arranged vertically:
  1. Hero image or illustration at the top (hero-workout.png)
  2. Large headline in the middle: "Welcome to FitnessTracker"
  3. Supporting subtext below: "Your personal fitness companion"
  4. Primary CTA button at the bottom: "Get Started"
  5. "Skip" text link below the CTA: "Skip for now"

**Visual Style:**
- Primary brand color: #FF6B6B
- Background color: #FFFFFF
- Text color: #2C3E50
- Button: use primary color with white text
- Font: Inter
- Border radius: 12px for rounded corners
- Generous padding and spacing for a clean, premium feel

**Design Guidelines:**
- Modern, minimal aesthetic
- High contrast for readability
- Professional illustration style for the hero image
- Center-aligned content
- Mobile-first design (portrait orientation)
````

## MCP Server Configuration

To use Stitch MCP, ensure it's configured in your Claude Code settings:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-stitch"]
    }
  }
}
```

## Limitations & Future Work

**Current Limitations:**
- MCP tool calls require Claude Code context (can't run standalone)
- Sequential screen generation (no parallel requests yet)
- No design-to-code conversion (designs stay in Stitch)
- No refinement loop after initial generation

**Future Enhancements:**
- Standalone MCP client for CLI usage outside Claude Code
- Parallel screen generation for faster processing
- Design export/code sync from Stitch to React Native
- Interactive refinement chat in Phase 6
- Multiple design variants per screen

## Testing

To test Stitch integration:

```bash
# 1. Create a test spec
cat > spec.md << 'EOF'
# MyApp
## Config
- Platform: expo
- Navigation: expo-router
- Styling: stylesheet
[... rest of spec ...]
EOF

# 2. Run onboard command (requires Claude Code with Stitch MCP)
npx onboardkit onboard spec.md --output ./test-output

# 3. Check stitch-prompts/ directory
ls -la ./test-output/stitch-prompts/

# 4. Review generated prompts
cat ./test-output/stitch-prompts/welcome.md
```

## Architecture

```
cli/src/lib/
├── stitch/
│   ├── types.ts           # TypeScript interfaces
│   ├── prompt-builder.ts  # Generate Stitch prompts from spec
│   ├── client.ts          # MCP client for Stitch tools
│   └── index.ts           # Public exports
├── workflow/
│   └── phases.ts          # Phase 7 integration
└── ...
```

## Summary

OnboardKit now bridges the gap between **markdown specs** and **visual UI designs**:

1. Write your app spec in markdown
2. AI validates and enhances your spec
3. Templates generate React Native code
4. **Stitch prompts** are automatically created
5. Optionally connect to **Stitch MCP** for UI generation
6. Get both **working code** and **professional designs**

This makes OnboardKit a complete solution for mobile app onboarding flows: from idea → spec → design → code.
