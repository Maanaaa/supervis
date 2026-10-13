---
name: commit-crafting
description: >-
  Use this skill when preparing git commits. Enforces conventional commits with short,
  meaningful titles, concrete concise bodies, reference to ticket numbers, and zero-verbosity
  token-saving outputs.
---

# Commit Crafting Runbook

## 1. Règles de nommage
- **Format du titre (≤ 50 caractères, impératif, sans point final)** :
  `<type>(<scope>): <action courte et parlante>`
  - Types autorisés : `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`.
  - Scopes fréquents : `auth`, `alerts`, `socket`, `models`, `ui`, `agents`, `ci`.
  - Exemples :
    - `feat(auth): ajout middleware session opérateur`
    - `fix(socket): gestion déconnexion inattendue`
    - `test(alerts): validation concurrence atomique`

## 2. Corps du message (court et concret)
- 1 à 3 puces maximum, directes et concrètes.
- Référence obligatoire au ticket : `Closes #X` ou `Ref #X`.
- Exemple :
  ```text
  feat(alerts): prise en charge atomique des tickets

  - findOneAndUpdate conditionnel sur status OPEN
  - émission socket ticket:claimed
  - Closes #12
  ```

## 3. Règle d'or : Économie de tokens
- Ne jamais générer de pavés de texte ou de diffs verbeux pour annoncer un commit.
- Afficher uniquement la commande exécutée et le hash court du commit.
