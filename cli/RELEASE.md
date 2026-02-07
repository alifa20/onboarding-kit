# Release Checklist

Pre-release checklist for OnboardKit releases.

## Pre-Release (1 week before)

### Code Quality

- [ ] All tests passing on CI
  ```bash
  npm test
  npm run test:ci
  ```

- [ ] Code coverage >80% for core modules
  ```bash
  npm run test:coverage
  # Check coverage report
  ```

- [ ] TypeScript compilation clean (no errors)
  ```bash
  npm run typecheck
  ```

- [ ] Linting passes
  ```bash
  npm run lint
  ```

- [ ] No critical security vulnerabilities
  ```bash
  npm audit
  # Fix any high/critical issues
  ```

### Cross-Platform Testing

- [ ] Tested on macOS (latest)
  - [ ] All commands work
  - [ ] OAuth flow works
  - [ ] Keychain storage works
  - [ ] Generated code compiles

- [ ] Tested on Linux (Ubuntu LTS)
  - [ ] All commands work
  - [ ] OAuth flow works
  - [ ] libsecret storage works (or fallback)
  - [ ] Generated code compiles

- [ ] Tested on Windows (Windows 11)
  - [ ] All commands work
  - [ ] OAuth flow works
  - [ ] Credential Manager works (or fallback)
  - [ ] Generated code compiles

### Example Specs

- [ ] All example specs validate
  ```bash
  npx onboardkit validate --spec examples/fitness-app.md
  npx onboardkit validate --spec examples/finance-app.md
  npx onboardkit validate --spec examples/saas-app.md
  ```

- [ ] All example specs generate successfully
  ```bash
  npx onboardkit generate --spec examples/fitness-app.md
  npx onboardkit generate --spec examples/finance-app.md
  npx onboardkit generate --spec examples/saas-app.md
  ```

- [ ] Generated code from examples compiles
  ```bash
  cd onboardkit-output
  tsc --noEmit --strict
  ```

### Documentation

- [ ] README.md is up to date
  - [ ] Installation instructions accurate
  - [ ] Quick start works
  - [ ] Command examples tested
  - [ ] Links work

- [ ] CHANGELOG.md updated
  - [ ] Version number correct
  - [ ] All changes documented
  - [ ] Breaking changes highlighted
  - [ ] Migration notes (if applicable)

- [ ] All documentation reviewed
  - [ ] docs/USER-GUIDE.md
  - [ ] docs/CLI-REFERENCE.md
  - [ ] docs/SPEC-FORMAT.md
  - [ ] docs/API.md
  - [ ] docs/ARCHITECTURE.md
  - [ ] docs/TROUBLESHOOTING.md
  - [ ] docs/FAQ.md

- [ ] Code examples in docs tested

### Package Metadata

- [ ] package.json version bumped
  - [ ] Version follows semver
  - [ ] Breaking change → major bump
  - [ ] New feature → minor bump
  - [ ] Bug fix → patch bump

- [ ] package.json metadata complete
  - [ ] Description accurate
  - [ ] Keywords relevant
  - [ ] Homepage URL correct
  - [ ] Repository URL correct
  - [ ] Bugs URL correct

- [ ] LICENSE file present and correct

### Build & Bundle

- [ ] Production build succeeds
  ```bash
  npm run build
  ```

- [ ] Bundle size acceptable (<2MB)
  ```bash
  du -h dist/index.js
  ```

- [ ] Shebang present in dist/index.js
  ```bash
  head -n 1 dist/index.js
  # Should be: #!/usr/bin/env node
  ```

- [ ] Source maps generated
  ```bash
  ls dist/*.map
  ```

- [ ] Type declarations generated
  ```bash
  ls dist/*.d.ts
  ```

## Release Day

### Final Checks

- [ ] Pull latest from main
  ```bash
  git checkout main
  git pull origin main
  ```

- [ ] Run full test suite one more time
  ```bash
  npm run test:ci
  ```

- [ ] Clean build
  ```bash
  rm -rf dist node_modules
  npm install
  npm run build
  ```

- [ ] Test npx execution locally
  ```bash
  npm link
  onboardkit --version
  onboardkit --help
  ```

### Git Tagging

- [ ] Create git tag
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

- [ ] Tag message includes changelog highlights

### npm Publishing

- [ ] Verify npm registry authentication
  ```bash
  npm whoami
  ```

- [ ] Dry-run publish
  ```bash
  npm publish --dry-run
  # Review files to be published
  ```

- [ ] Publish to npm
  ```bash
  npm publish --provenance
  ```

- [ ] Verify package on npm
  ```bash
  # Visit https://www.npmjs.com/package/onboardkit
  # Check version, files, readme
  ```

- [ ] Test npx from npm
  ```bash
  # In a different directory
  npx onboardkit@latest --version
  ```

### GitHub Release

- [ ] Create GitHub release
  - [ ] Go to https://github.com/alifa20/onboarding-kit/releases/new
  - [ ] Tag: v1.0.0
  - [ ] Title: "OnboardKit v1.0.0"
  - [ ] Description: Copy from CHANGELOG.md
  - [ ] Mark as latest release

- [ ] Attach release assets (if any)
  - [ ] Standalone binaries (future)
  - [ ] Documentation PDF (future)

### Announcement

- [ ] Prepare announcement content
  - [ ] Highlight key features
  - [ ] Include terminal GIF demo
  - [ ] Link to documentation
  - [ ] Thank contributors

- [ ] Post on Product Hunt
  - [ ] Title: "OnboardKit - Zero-cost AI-powered onboarding screens"
  - [ ] Description: Concise value proposition
  - [ ] Include demo GIF
  - [ ] Add relevant tags

- [ ] Post on Reddit
  - [ ] r/reactnative - "Show & Tell" flair
  - [ ] r/expo - Share project
  - [ ] r/SideProject - Launch announcement
  - [ ] r/webdev - Tool announcement

- [ ] Post on Hacker News
  - [ ] Title: "Show HN: OnboardKit – Generate React Native onboarding from markdown"
  - [ ] Link to GitHub

- [ ] Post on Twitter/X
  - [ ] Announcement thread
  - [ ] Demo video/GIF
  - [ ] Key features
  - [ ] Link to docs
  - [ ] Tag relevant accounts

- [ ] Announce in Discord servers
  - [ ] Expo Discord
  - [ ] React Native Discord
  - [ ] Relevant dev communities

- [ ] Post on Dev.to (optional)
  - [ ] Write detailed launch post
  - [ ] Include technical details
  - [ ] Add code examples

- [ ] Update personal website/portfolio (if applicable)

## Post-Release (24-48 hours)

### Monitoring

- [ ] Monitor npm download stats
  ```bash
  # Check https://npm-stat.com/charts.html?package=onboardkit
  ```

- [ ] Monitor GitHub traffic
  - [ ] Stars
  - [ ] Clones
  - [ ] Visitors

- [ ] Monitor issues
  - [ ] Respond to bug reports within 24 hours
  - [ ] Triage and label issues
  - [ ] Fix critical bugs immediately

- [ ] Monitor social media feedback
  - [ ] Respond to comments
  - [ ] Answer questions
  - [ ] Gather feature requests

### Documentation

- [ ] Update documentation based on feedback
- [ ] Add FAQ entries for common questions
- [ ] Update troubleshooting guide

### Planning

- [ ] Create milestone for next version
- [ ] Triage feature requests
- [ ] Update roadmap
- [ ] Plan sprint for bug fixes

## Version History

### Semantic Versioning

- **Major (x.0.0)** - Breaking changes
- **Minor (1.x.0)** - New features, backward compatible
- **Patch (1.0.x)** - Bug fixes, backward compatible

### Release Frequency

- **Major releases** - As needed (breaking changes)
- **Minor releases** - Monthly (new features)
- **Patch releases** - Weekly (bug fixes)

## Emergency Hotfix Process

If a critical bug is discovered after release:

1. **Assess severity**
   - Security vulnerability → immediate hotfix
   - Data loss bug → immediate hotfix
   - CLI completely broken → immediate hotfix
   - Minor bug → schedule for next patch

2. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/v1.0.1
   ```

3. **Fix and test**
   ```bash
   # Fix bug
   # Add regression test
   npm test
   ```

4. **Release hotfix**
   ```bash
   # Update version to 1.0.1
   git commit -am "hotfix: critical bug fix"
   git tag v1.0.1
   git push origin v1.0.1
   npm publish
   ```

5. **Notify users**
   - GitHub release with "HOTFIX" label
   - Twitter/X announcement
   - Update documentation

6. **Post-mortem**
   - Document what went wrong
   - Add preventative measures
   - Improve testing

## Rollback Process

If release has critical issues:

1. **Deprecate version on npm**
   ```bash
   npm deprecate onboardkit@1.0.0 "Critical bug, use 1.0.1 instead"
   ```

2. **Revert git tag (if not pulled by users)**
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

3. **Communicate clearly**
   - GitHub issue explaining problem
   - Social media announcement
   - Documentation warning

## Notes

- Always use `--provenance` flag when publishing to npm for supply chain security
- Test extensively on all platforms before release
- Communicate clearly with users about breaking changes
- Keep CHANGELOG.md up to date
- Celebrate releases!

---

**Last Updated:** 2026-02-07
**Next Review:** Before v1.1 release
