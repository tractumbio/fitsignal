#!/usr/bin/env bash
# Download the local models listed in models.conf via Ollama.
#   ./pull_models.sh              pull every model
#   ./pull_models.sh light        pull one group (coding | reasoning | light)
#   ./pull_models.sh qwen3-4b     pull one model by alias
#   ./pull_models.sh --list       show models and whether they are installed
set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
conf="$dir/models.conf"

command -v ollama >/dev/null || { echo "ollama not found. Install it from https://ollama.com/download" >&2; exit 1; }

entries() { grep -vE '^\s*(#|$)' "$conf"; }

if [[ "${1:-}" == "--list" ]]; then
  installed="$(ollama list | awk 'NR>1 {print $1}')"
  while IFS='|' read -r alias tag group; do
    if grep -qx "$tag" <<<"$installed"; then s="installed"; else s="missing"; fi
    printf '%-20s %-26s %-10s %s\n' "$alias" "$tag" "$group" "$s"
  done < <(entries)
  exit 0
fi

target="${1:-all}"
pulled=0
while IFS='|' read -r alias tag group; do
  if [[ "$target" == "all" || "$target" == "$alias" || "$target" == "$group" ]]; then
    echo "==> $alias ($tag)"
    ollama pull "$tag"
    pulled=$((pulled + 1))
  fi
done < <(entries)

[[ $pulled -gt 0 ]] || { echo "No model or group matches '$target'. Try --list." >&2; exit 1; }
echo "Done: $pulled model(s)."
