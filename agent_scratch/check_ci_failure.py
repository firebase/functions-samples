import json
import subprocess

def run_cmd(cmd):
    p = subprocess.run(cmd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, executable='/bin/bash')
    return p

print("=== CHECKS STATUS ON PR #1291 ===")
p = run_cmd("gh pr checks 1291 --repo firebase/functions-samples")
print(p.stdout)
if p.stderr: print(f"Error: {p.stderr}")

for line in p.stdout.split("\n"):
    if "fail" in line:
        parts = line.split()
        url = parts[-1]
        run_id = url.split("/")[-3]
        print(f"\n--- Fetching failure log for Run ID {run_id} ({parts[0]}) ---")
        res = run_cmd(f"gh run view {run_id} --log-failed")
        if res.returncode == 0:
            print(res.stdout[:4000])
            if len(res.stdout) > 4000:
                print("\n[Log truncated... Printing bottom 2000 chars:]")
                print(res.stdout[-2000:])
        else:
            print(f"Failed to get run log: {res.stderr}")
