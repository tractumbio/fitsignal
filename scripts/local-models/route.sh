#!/usr/bin/env bash
# Let a small local model pick the best model for a request, then run it via ask.sh.
#   ./route.sh "Why does this segfault?" < crash.c      # -> code model
#   ./route.sh "Is this argument valid? ..."            # -> reasoning model
#   ./route.sh "Capital of France?"                     # -> light model
#   ./route.sh -n "..."                                 # dry run: print the chosen model only
#   ./route.sh -m phi4-14b "..."                        # skip routing, force a model
# Options: -f file (repeatable) | -s system prompt | -n dry run | -m force model | -v show why
# Override choices with env vars: ROUTER_MODEL, CODE_MODEL, REASON_MODEL, LIGHT_MODEL.
set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
conf="$dir/models.conf"

router="${ROUTER_MODEL:-llama3.2-3b}"
code_model="${CODE_MODEL:-qwen-coder-7b}"
reason_model="${REASON_MODEL:-deepseek-r1-8b}"
light_model="${LIGHT_MODEL:-llama3.2-3b}"

system=""; force=""; dry=0; verbose=0; files=()
while getopts "f:s:m:nvh" opt; do
  case $opt in
    f) files+=("$OPTARG") ;;
    s) system="$OPTARG" ;;
    m) force="$OPTARG" ;;
    n) dry=1 ;;
    v) verbose=1 ;;
    h|*) sed -n '2,9p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done
shift $((OPTIND - 1))
request="$*"

command -v ollama >/dev/null || { echo "ollama not found. Install it from https://ollama.com/download" >&2; exit 1; }

stdin_content=""
if [[ ! -t 0 ]]; then stdin_content="$(cat)"; fi
[[ -n "$request$stdin_content" || ${#files[@]} -gt 0 ]] || { echo "Nothing to route. Pass a request and/or content (see -h)." >&2; exit 1; }

classify() {
  local sample="$request"$'\n'"$stdin_content"
  for f in "${files[@]}"; do [[ -r "$f" ]] && sample+=$'\n'"$(head -c 1500 "$f")"; done
  sample="${sample:0:2000}"
  local tag
  tag="$(grep -vE '^\s*(#|$)' "$conf" | awk -F'|' -v m="$router" '$1==m {print $2}')"
  tag="${tag:-$router}"
  local instruction="You are a router. Read the user's task and reply with exactly one word:
code      - writing, reading, debugging, reviewing or explaining source code, shell, SQL, configs
reasoning - maths, logic, planning, multi-step analysis, weighing trade-offs, hard problems
light     - quick facts, short answers, classification, rewriting, summaries, casual chat
Reply with only: code, reasoning or light.

Task:
$sample"
  printf '%s' "$instruction" | ollama run "$tag" 2>/dev/null \
    | tr '[:upper:]' '[:lower:]' | grep -oE 'code|reasoning|light' | head -n1 || true
}

if [[ -n "$force" ]]; then
  model="$force"; kind="forced"
else
  kind="$(classify)"; kind="${kind:-light}"
  case "$kind" in
    code) model="$code_model" ;;
    reasoning) model="$reason_model" ;;
    *) kind="light"; model="$light_model" ;;
  esac
fi

echo "[route] $kind -> $model" >&2
[[ $dry -eq 1 ]] && { echo "$model"; exit 0; }

args=(-m "$model")
[[ -n "$system" ]] && args+=(-s "$system")
for f in "${files[@]}"; do args+=(-f "$f"); done
if [[ -n "$stdin_content" ]]; then
  printf '%s' "$stdin_content" | "$dir/ask.sh" "${args[@]}" "$request"
else
  "$dir/ask.sh" "${args[@]}" "$request" </dev/null
fi
