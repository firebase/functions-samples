module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Removed rule "disallow the use of console" from recommended eslint rules
    "no-console": "off",

    // Removed rule "disallow the use of debugger" from recommended eslint rules
    "no-debugger": "off",
  }
}
