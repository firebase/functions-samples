import os
import json
import re

count = 0
for dirpath, dirnames, filenames in os.walk("."):
    if 'node_modules' in dirnames: dirnames.remove('node_modules')
    if 'agent_scratch' in dirpath or '.git' in dirpath: continue
    if "package.json" in filenames:
        p = os.path.join(dirpath, "package.json")
        try:
            with open(p, "r") as f:
                data = json.load(f)
                
            scripts = data.get("scripts", {})
            modified = False
            for sname, scmd in scripts.items():
                if "eslint" in scmd and "--ext" in scmd:
                    # remove --ext <exts>
                    new_cmd = re.sub(r'--ext\s+[\w\.,]+', '', scmd).strip()
                    new_cmd = re.sub(r'\s+', ' ', new_cmd)
                    scripts[sname] = new_cmd
                    modified = True
                    
            if modified:
                data["scripts"] = scripts
                with open(p, "w") as f:
                    json.dump(data, f, indent=2)
                    f.write("\n")
                count += 1
                print(f"Cleaned --ext from lint scripts in {p}")
        except Exception as e:
            pass

print(f"Cleaned obsolete CLI flags across {count} manifests.")
