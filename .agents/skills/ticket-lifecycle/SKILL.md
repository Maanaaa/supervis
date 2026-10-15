---
name: ticket-lifecycle
description: >-
  Use this skill when implementing a GitHub issue or feature ticket. Enforces branch checkout
  (feat/issue-X-<slug>), implementation steps, local validation suite execution, pull request
  creation, and CI check monitoring.
---

# Ticket Lifecycle Runbook

## 1. Protocole d'implémentation
1. **Branche dédiée depuis `dev`** :
   - Format obligatoire : `feat/issue-X-<slug>` ou `fix/issue-X-<slug>`.
   - Commande : `git checkout -b feat/issue-X-<slug>` depuis `dev`. Ne jamais coder directement sur `dev`.
2. **Implémentation & Tests** :
   - Coder dans `app/` selon les règles (`TypeScript strict`, `no any`, Server Components).
   - Écrire ou enrichir les tests dans `app/tests/`.
3. **Suite de validation locale (obligatoire)** :
   ```bash
   cd app && npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
   ```
   Tous les tests doivent être 100% OK.
4. **Commit & Push** :
   - Suivre le skill `commit-crafting`.
   - Pousser la branche : `git push -u origin feat/issue-X-<slug>`.
5. **Pull Request atomique vers `dev`** :
   - Vérifier la taille du diff : `git diff --shortstat dev...HEAD`.
   - Règle stricte : Le diff doit être ≤ 800 lignes (idéalement 200 à 500). Interdiction absolue de PRs géantes.
   - Base branch : Toujours `--base dev`. Interdiction absolue de cibler `main`.
   ```bash
   gh pr create --base dev --head feat/issue-X-<slug> --title "feat(#X): <titre>" --body "Closes #X. <description concise>"
   ```
6. **Surveillance CI** :
   - Vérifier le statut de la CI : `gh pr checks` ou `gh run watch`.
7. **Rapport minimaliste** :
   - Retourner uniquement : résumé des modifs (3 puces max), statut des tests (OK), URL de la PR et guide de test en 3 lignes.
