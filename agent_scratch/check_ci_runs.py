import subprocess
import json

def run_cmd(cmd):
    p = subprocess.run(cmd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, executable='/bin/bash')
    return p

res = run_cmd("gh pr checks 1291 --repo firebase/functions-samples --json name,state,link")
if res.returncode == 0:
    data = json.loads(res.stdout)
    for c in data:
        if c.get("state") == "FAILURE":
            name = c.get("name")
            link = c.get("link")
            run_id = link.split("/")[-3]
            print(f"\n================ FAILED JOB: {name} (Run ID: {run_id}) ================")
            log_res = run_cmd(f"gh run view {run_id} --log-failed")
            print(log_res.stdout[:4000])
else:
    print(f"Error: {res.stderr}")
