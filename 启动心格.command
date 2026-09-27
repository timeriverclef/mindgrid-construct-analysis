#!/bin/zsh
set -e
cd -- "$(dirname -- "$0")"
if command -v node >/dev/null 2>&1; then
  exec node scripts/serve.mjs
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  exec "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/serve.mjs
else
  echo "请安装 Node.js 20.19 或更新版本，然后再次打开。"
  read -r "?按回车关闭"
fi
