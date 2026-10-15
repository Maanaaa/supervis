#!/bin/bash
# Garde-fou Git pour Antigravity (PreToolUse sur run_command)
# Empêche les pushs directs sur main/dev et les commandes destructrices.

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.toolCall.args.CommandLine // empty')

if [ -z "$CMD" ]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# 1. Vérification push direct sur main ou dev
if echo "$CMD" | grep -Eq 'git +push +(origin +)?(main|dev)\b'; then
  REASON="Push direct interdit sur main/dev. Vous devez créer une branche de feature (feat/issue-X-...) et ouvrir une Pull Request."
  jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
  exit 0
fi

# 2. Vérification git push sans argument si on est sur main ou dev
if echo "$CMD" | grep -Eq '^git +push *(origin)? *$'; then
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
  if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "dev" ]; then
    REASON="Push direct interdit depuis la branche $CURRENT_BRANCH. Créez une branche de feature."
    jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
    exit 0
  fi
fi

# 3. Vérification force push
if echo "$CMD" | grep -Eq 'git +push +.*(--force|-f)\b'; then
  REASON="Force push interdit pour préserver l'historique Git."
  jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
  exit 0
fi

# 4. Vérification git reset --hard
if echo "$CMD" | grep -Eq 'git +reset +--hard\b'; then
  REASON="git reset --hard est bloqué par précaution pour éviter toute perte de travail non commité."
  jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
  exit 0
fi

# Par défaut, autorisé
echo '{"decision": "allow"}'
exit 0
