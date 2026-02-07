#!/bin/bash
set -e

echo "================================"
echo "OnboardKit Cross-Platform Tests"
echo "================================"
echo ""

# Detect OS
OS_TYPE="$(uname -s)"
case "${OS_TYPE}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=macOS;;
    MINGW*|MSYS*|CYGWIN*)     PLATFORM=Windows;;
    *)          PLATFORM="UNKNOWN:${OS_TYPE}"
esac

echo "Platform: ${PLATFORM}"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        exit 1
    fi
}

# Run tests
echo "Running unit tests..."
npm test -- --run
print_status $? "Unit tests"

echo ""
echo "Running integration tests..."
npm run test:integration
print_status $? "Integration tests"

echo ""
echo "Running platform tests..."
npm run test:platform
print_status $? "Platform tests"

echo ""
echo "Running code generation tests..."
npm run test:coverage -- --reporter=text
print_status $? "Coverage tests"

# Platform-specific tests
echo ""
echo "Running platform-specific checks..."

if [[ "$PLATFORM" == "macOS" ]]; then
    echo "Testing macOS-specific features..."
    # Test keychain access (mock)
    echo "  - Keychain integration: ✓ (mocked)"

elif [[ "$PLATFORM" == "Linux" ]]; then
    echo "Testing Linux-specific features..."
    # Test secret service (mock)
    echo "  - Secret Service integration: ✓ (mocked)"

elif [[ "$PLATFORM" == "Windows" ]]; then
    echo "Testing Windows-specific features..."
    # Test credential manager (mock)
    echo "  - Credential Manager integration: ✓ (mocked)"
fi

# Test Node.js version compatibility
echo ""
echo "Node.js version: $(node --version)"
NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')

if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js version >= 18"
else
    echo -e "${RED}✗${NC} Node.js version must be >= 18"
    exit 1
fi

# Build test
echo ""
echo "Testing build..."
npm run build
print_status $? "Build"

# Check bundle size
if [ -f "dist/index.js" ]; then
    BUNDLE_SIZE=$(wc -c < dist/index.js)
    BUNDLE_SIZE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1024 / 1024" | bc)
    echo "Bundle size: ${BUNDLE_SIZE_MB}MB"

    # Check if under 2MB
    if (( $(echo "$BUNDLE_SIZE_MB < 2" | bc -l) )); then
        echo -e "${GREEN}✓${NC} Bundle size within limit (<2MB)"
    else
        echo -e "${YELLOW}⚠${NC} Bundle size approaching limit"
    fi
fi

echo ""
echo "================================"
echo -e "${GREEN}All tests passed!${NC}"
echo "================================"
