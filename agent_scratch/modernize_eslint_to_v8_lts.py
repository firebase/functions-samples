import os
import json

count = 0
for dirpath, dirnames, filenames in os.walk("."):
    if 'node_modules' in dirnames: dirnames.remove('node_modules')
    if 'agent_scratch' in dirpath or '.git' in dirpath: continue
    if "package.json" in filenames:
        p = os.path.join(dirpath, "package.json")
        try:
            with open(p, "r") as f:
                data = json.load(f)
                
            dev_deps = data.get("devDependencies", {})
            if "eslint" in dev_deps and dev_deps["eslint"] != "^8.57.1":
                dev_deps["eslint"] = "^8.57.1"
                data["devDependencies"] = dev_deps
                with open(p, "w") as f:
                    json.dump(data, f, indent=2)
                    f.write("\n")
                count += 1
                print(f"Standardized eslint to LTS ^8.57.1 in {p}")
        except Exception as e:
            pass

print(f"Successfully standardized eslint to ^8.57.1 across {count} manifests.")
