#!/bin/bash
# Hook Stop : Garde-fou tests Jest avant clôture de tour par l'agent
# Ne bloque que si du code dans app/ a été modifié et que les tests échouent.

# Consommer stdin
cat > /dev/null

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/app"

# Vérifier si des fichiers dans app/ ont été modifiés
HAS_APP_CHANGES=$(git -C "$REPO_ROOT" status --porcelain app/ 2>/dev/null)
if [ -z "$HAS_APP_CHANGES" ]; then
  CURRENT_BRANCH=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null)
  if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "dev" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    HAS_APP_CHANGES=$(git -C "$REPO_ROOT" diff --name-only dev -- app/ 2>/dev/null)
  fi
fi

# Si aucun fichier dans app/ n'est concerné, autoriser la sortie (tâche purement doc/ADR)
if [ -z "$HAS_APP_CHANGES" ]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Du code applicatif a été modifié : exécuter la suite de tests Jest
if [ -d "$APP_DIR" ]; then
  TEST_OUTPUT=$(cd "$APP_DIR" && npm test 2>&1)
  TEST_STATUS=$?

  if [ $TEST_STATUS -ne 0 ]; then
    REASON="Garde-fou Stop : Les tests Jest échouent dans app/. Vous devez impérativement corriger le code et obtenir 100% de succès avant de rendre la main."
    jq -n --arg reason "$REASON" '{"decision": "continue", "reason": $reason}'
    exit 0
  fi
fi

echo '{"decision": "allow"}'
exit 0
