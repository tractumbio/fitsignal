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
