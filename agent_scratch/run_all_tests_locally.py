import subprocess

def run_cmd(cmd):
    p = subprocess.run(cmd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, executable='/bin/bash')
    return p

print("=== RUNNING 1ST GEN UNIT TESTS LOCALLY VIA PNPM ===")
res1 = run_cmd("source ~/.nvm/nvm.sh && gpkg npx pnpm@10.28.2 --recursive --filter \"./Node-1st-gen/**\" run test")
print(res1.stdout[:4000])
if res1.stderr: print(f"Stderr: {res1.stderr[:2000]}")

print("=== RUNNING 2ND GEN UNIT TESTS LOCALLY VIA PNPM ===")
res2 = run_cmd("source ~/.nvm/nvm.sh && gpkg npx pnpm@10.28.2 --recursive --filter \"./Node/**\" run test")
print(res2.stdout[:4000])
if res2.stderr: print(f"Stderr: {res2.stderr[:2000]}")
