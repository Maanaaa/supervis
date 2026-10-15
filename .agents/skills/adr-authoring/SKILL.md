---
name: adr-authoring
description: >-
  Use this skill when creating, updating, or amending an Architecture Decision Record (ADR)
  in docs/ADR/. Enforces immutable decisions, proper numbering, template format, index update,
  and strict prohibition of test runs for pure documentation.
---

# ADR Authoring Runbook

## 1. Règles d'or
- **Immuabilité** : Ne jamais modifier la décision d'une ADR acceptée. Pour changer un choix, créer une nouvelle ADR qui amende la précédente (`ADR-XXXX : Amende ADR-YYYY`).
- **Pas de tests** : Interdiction absolue d'exécuter ou d'afficher un rapport de tests pour une tâche documentaire / ADR.

## 2. Procédure séquentielle
1. **Identifier le numéro suivant** :
   - Vérifier les fichiers dans `docs/ADR/` (format `000X-titre-court.md`).
2. **Rédiger le fichier ADR** :
   - Placer dans `docs/ADR/XXXX-<slug>.md`.
   - Utiliser la structure obligatoire :
     ```markdown
     # ADR-XXXX : <Titre>
     - **Date :** YYYY-MM-DD
     - **Statut :** Proposé | Accepté | Amendé par ADR-YYYY
     - **Décideurs :** Théo, Antigravity

     ## Contexte et Problématique
     ## Décision retenue
     ## Alternatives envisagées
     ## Conséquences
     - **Positives :** ...
     - **Compromis :** ...
     ```
3. **Mettre à jour l'index** :
   - Ajouter la nouvelle ADR dans le tableau de `docs/ADR/README.md`.
4. **Créer l'issue GitHub associée** :
   - Exécuter : `gh issue create --title "feat(adr): ADR-XXXX <Titre>" --body "Implémentation technique liée à l'ADR-XXXX..."`
5. **Output minimal** :
   - Indiquer en 2-3 lignes : chemin de l'ADR créée, statut, et numéro d'issue liée.
