#!/bin/bash
# Hook PostToolUse : Auto-format Prettier sur app/
# Se déclenche après modification de fichier (write_to_file, replace_file_content)

# Lire stdin (requis par le protocole)
cat > /dev/null

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/app"

if [ -d "$APP_DIR/node_modules" ]; then
  # Exécuter prettier silencieusement sur les fichiers modifiés de app/
  (cd "$APP_DIR" && npm run format >/dev/null 2>&1)
fi

# Réponse obligatoire contractuelle
echo '{}'
exit 0
