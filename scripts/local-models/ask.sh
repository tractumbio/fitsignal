#!/usr/bin/env bash
# Send a request, plus optional content, to a local Ollama model and print the answer.
#   ./ask.sh -m qwen-coder-7b "Explain this function" < file.py
#   cat notes.txt | ./ask.sh -m phi4-14b "Summarise in 3 bullets"
#   ./ask.sh -m qwen3-4b -f report.md -f data.csv "Compare these two files"
#   ./ask.sh "What is a mutex?"                 # default model: $ASK_MODEL or llama3.2-3b
#   ./ask.sh -m qwen3-4b -s "Answer in one line" "Capital of France?"
# Options: -m model alias or raw ollama tag | -f file (repeatable) | -s system prompt | -l list aliases
set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
conf="$dir/models.conf"
model="${ASK_MODEL:-llama3.2-3b}"
system=""
files=()

while getopts "m:f:s:lh" opt; do
  case $opt in
    m) model="$OPTARG" ;;
    f) files+=("$OPTARG") ;;
    s) system="$OPTARG" ;;
    l) grep -vE '^\s*(#|$)' "$conf" | awk -F'|' '{printf "%-20s %s\n", $1, $2}'; exit 0 ;;
    h|*) sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done
shift $((OPTIND - 1))

command -v ollama >/dev/null || { echo "ollama not found. Install it from https://ollama.com/download" >&2; exit 1; }

# Resolve alias -> tag; anything not in models.conf is treated as a raw Ollama tag.
tag="$(grep -vE '^\s*(#|$)' "$conf" | awk -F'|' -v m="$model" '$1==m {print $2}')"
tag="${tag:-$model}"

request="$*"
content=""
for f in "${files[@]}"; do
  [[ -r "$f" ]] || { echo "Cannot read file: $f" >&2; exit 1; }
  content+=$'\n'"--- $f ---"$'\n'"$(cat "$f")"$'\n'
done
if [[ ! -t 0 ]]; then
  piped="$(cat)"
  [[ -z "$piped" ]] || content+=$'\n'"--- stdin ---"$'\n'"$piped"$'\n'
fi

[[ -n "$request$content" ]] || { echo "Nothing to send. Pass a request and/or content (see -h)." >&2; exit 1; }

prompt="${system:+$system$'\n\n'}${request}${content:+$'\n'$content}"
printf '%s' "$prompt" | ollama run "$tag"
