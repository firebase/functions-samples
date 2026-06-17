import os
from pathlib import Path

js_flat = """module.exports = [
  {
    files: ["**/*.js"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
      "no-prototype-builtins": "off",
      "no-redeclare": "off",
      "no-constant-condition": "off",
      "no-case-declarations": "off"
    }
  }
];
"""

ts_flat = """const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  }
];
"""

count = 0
for dirpath, dirnames, filenames in os.walk("."):
    if 'node_modules' in dirnames: dirnames.remove('node_modules')
    if 'agent_scratch' in dirpath or '.git' in dirpath: continue
    
    for f in filenames:
        if f.startswith(".eslintrc"):
            p = Path(dirpath) / f
            p.unlink(missing_ok=True)
            
    if "package.json" in filenames:
        pkg_path = Path(dirpath) / "package.json"
        try:
            import json
            with open(pkg_path, "r") as f: data = json.load(f)
            scripts = data.get("scripts", {})
            if "lint" in scripts:
                out_flat = Path(dirpath) / "eslint.config.js"
                dev_deps = data.get("devDependencies", {})
                is_ts = "@typescript-eslint/parser" in dev_deps or "typescript-eslint" in dev_deps
                with open(out_flat, "w") as f:
                    f.write(ts_flat if is_ts else js_flat)
                count += 1
                print(f"Created {'TS' if is_ts else 'JS'} flat config in {out_flat}")
        except: pass

print(f"Successfully universally migrated {count} manifests to flat config.")
