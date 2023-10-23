"""Utility to format Python source files for Firebase docs."""

# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import difflib
import pathlib
import re

from yapf.yapflib import yapf_api

start_tag_re = re.compile(r"^([ \t]*)#\s*\[START\s+(\w+).*\]\s*\n", flags=re.MULTILINE)
end_tag_re = re.compile(r"^\s*#\s*\[END\s+(\w+).*\][ \t]*$", flags=re.MULTILINE)

pyproject_toml = str(pathlib.Path(__file__).parent / "pyproject.toml")


def reformat_in_place(files: list[str]) -> None:
    for file in files:
        with open(file, "rt", encoding="utf-8") as f:
            src = format(f.read())
        with open(file, "wt", encoding="utf-8") as f:
            f.write(src)


def check_and_diff(files: list[str]) -> int:
    diff_count = 0
    for file in files:
        with open(file, "rt", encoding="utf-8") as f:
            orig = f.read()
        fmt = format(orig)
        diff = list(
            difflib.unified_diff(orig.splitlines(),
                                 fmt.splitlines(),
                                 fromfile=file,
                                 tofile=f"{file} (reformatted)",
                                 lineterm=""))
        if len(diff) > 0:
            diff_count += 1
            print("\n".join(diff), end="\n\n")
    return diff_count


def format(src: str) -> str:
    out, _ = yapf_api.FormatCode(src, style_config=pyproject_toml)
    out = fix_region_tags(out)
    return out


def fix_region_tags(src: str) -> str:
    """Fix formattiing of region tags.

    - Remove extra blank lines after START tags.
    - Remove extra blank lines before END tags.
    - Matches indentation of END tags to their START tags.
    """
    src = start_tag_re.sub(r"\1# [START \2]\n", src)

    tag_indentation = {m.group(2): m.group(1) for m in start_tag_re.finditer(src)}

    def fix_end_tag(m: re.Match) -> str:
        name = m.group(1)
        indentation = tag_indentation[name]
        return f"{indentation}# [END {name}]"

    src = end_tag_re.sub(fix_end_tag, src)

    return src


if __name__ == "__main__":
    import argparse

    argparser = argparse.ArgumentParser()
    argparser.add_argument("--check_only",
                           "-c",
                           action="store_true",
                           help="check files and print diffs, but don't modify files")
    argparser.add_argument("--exclude",
                           "-e",
                           action="append",
                           default=[],
                           help="exclude file or glob (can specify multiple times)")
    argparser.add_argument("file_or_glob", nargs="+")
    args = argparser.parse_args()

    files = {str(f) for fs in [pathlib.Path(".").glob(fg) for fg in args.file_or_glob] for f in fs}
    excludes = {str(f) for fs in [pathlib.Path(".").glob(fg) for fg in args.exclude] for f in fs}
    files = files - excludes

    if args.check_only:
        diff_count = check_and_diff(files)
        if diff_count != 0:
            print(f"{diff_count} files would be reformatted.")
            print(f"Run {argparser.prog} to reformat in place.")
        exit(diff_count)
    else:
        reformat_in_place(files)
