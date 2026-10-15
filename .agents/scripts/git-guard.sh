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

# 5. Vérification création de PR vers main
if echo "$CMD" | grep -Eq 'gh +pr +create +.*--base +(origin/)?main\b'; then
  REASON="Création de PR vers 'main' formellement interdite. Toutes les Pull Requests doivent impérativement cibler la branche 'dev' (--base dev)."
  jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
  exit 0
fi

# 6. Vérification de la taille de la Pull Request (Anti-PR fleuve de 17 000 lignes)
if echo "$CMD" | grep -Eq 'gh +pr +create\b'; then
  BASE_BRANCH="dev"
  DIFF_LINES=$(git diff --shortstat "$BASE_BRANCH"...HEAD 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i ~ /insertion|deletion/) sum+=$(i-1)} END {print sum+0}')
  MAX_PR_LINES=800
  if [ -n "$DIFF_LINES" ] && [ "$DIFF_LINES" -gt "$MAX_PR_LINES" ]; then
    REASON="PR fleuve rejetée : $DIFF_LINES lignes modifiées détectées par rapport à $BASE_BRANCH (limite maximale autorisée : $MAX_PR_LINES lignes). Découpez l'implémentation en tickets atomiques pour préserver la revue de code."
    jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
    exit 0
  fi
fi

# 7. Vérification commit direct sur main ou dev
if echo "$CMD" | grep -Eq 'git +commit\b'; then
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
  if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "dev" ]; then
    REASON="Commit direct interdit sur la branche $CURRENT_BRANCH. Basculez impérativement sur une branche dédiée (ex: git checkout -b feat/issue-X-... ou fix/...) avant de commiter."
    jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
    exit 0
  fi
fi

# 8. Vérification git clean destructif
if echo "$CMD" | grep -Eq 'git +clean +.*-f'; then
  REASON="git clean -f est bloqué par précaution pour éviter la suppression accidentelle de nouveaux fichiers non suivis."
  jq -n --arg reason "$REASON" '{"decision": "deny", "reason": $reason}'
  exit 0
fi

# Par défaut, autorisé
echo '{"decision": "allow"}'
exit 0
