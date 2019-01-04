# Install dependencies
echo "Installing dependencies..."
npm install

# Run linter
echo "Linting..."
npm run lint

# Run tests
echo "Testing..."
npm run ci-test
