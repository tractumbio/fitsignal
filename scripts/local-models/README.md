# Local models

Requires [Ollama](https://ollama.com/download). Models are defined in `models.conf` (`alias|tag|group`).

```bash
./pull_models.sh --list        # what is installed
./pull_models.sh light         # one group: coding | reasoning | light
./pull_models.sh               # everything (~50 GB, check free disk first)

./ask.sh -m qwen-coder-7b "Explain this" < file.py
cat notes.txt | ./ask.sh -m phi4-14b "Summarise in 3 bullets"
./ask.sh -m qwen3-4b -f a.md -f b.md "Compare these"
```

`ask.sh` reads content from stdin and/or `-f` files, appends it to your request, and prints the model's answer.
Default model is `$ASK_MODEL`, else `llama3.2-3b`. `./ask.sh -l` lists aliases.

## Auto-routing

`route.sh` asks a small model (`llama3.2-3b`) to classify the request as `code`, `reasoning` or `light`, then runs it on the matching model through `ask.sh`. It accepts the same stdin, `-f` and `-s` inputs.

```bash
./route.sh "Why does this segfault?" < crash.c   # code      -> qwen-coder-7b
./route.sh "Is this plan sound? ..."             # reasoning -> deepseek-r1-8b
./route.sh "Capital of France?"                  # light     -> llama3.2-3b
./route.sh -n "..."                              # dry run: print the chosen model only
./route.sh -m phi4-14b "..."                     # skip routing, force a model
```

Change the picks with `ROUTER_MODEL`, `CODE_MODEL`, `REASON_MODEL` and `LIGHT_MODEL` (aliases from `models.conf`). If the router's answer can't be parsed, it falls back to `light`.
