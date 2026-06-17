import subprocess
import json

res = subprocess.run("gh api repos/firebase/functions-samples/commits/inlined/infrastructure-audit-overhaul/check-runs", shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, executable='/bin/bash')
if res.returncode == 0:
    data = json.loads(res.stdout)
    for c in data.get("check_runs", []):
        if c.get("conclusion") == "failure":
            print(f"FAILED CHECK: {c.get('name')}")
            print(f"HTML URL: {c.get('html_url')}")
            output = c.get("output", {})
            print(f"Title: {output.get('title')}")
            print(f"Summary:\n{output.get('summary')}")
            print("="*50)
else:
    print(res.stderr)
