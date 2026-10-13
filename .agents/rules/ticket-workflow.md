# Règle de Traitement Systématique des Tickets & Workflow Git

Cette règle est contraignante et prioritaire. À chaque fois que l'utilisateur demande de traiter un ticket (ex: *"Traite le ticket n°X"*), l'IA doit exécuter la séquence suivante sans sauter aucune étape :

## Déroulé Séquentiel Obligatoire

1. **Plan d'action à valider :**
   - Rédiger un plan d'action exhaustif décrivant le découpage, les fichiers créés/modifiés et la stratégie de tests.
   - Soumettre ce plan sous forme d'artifact à l'utilisateur et attendre son accord explicite avant toute modification de code.

2. **Branche de feature dédiée :**
   - Créer et basculer sur une branche dédiée issue de `dev` :
     ```bash
     git checkout dev
     git pull origin dev
     git checkout -b feat/issue-X-<slug>
     ```
   - Interdiction formelle de développer directement sur la branche `dev` ou `main`.

3. **Développement (Dev) :**
   - Implémenter le code en respectant strictement l'interdiction de `any`, l'architecture App Router et les ADRs.

4. **Tests Automatisés Complets & Validation CI/CD :**
   - **Commandes obligatoires :**
     - Tests unitaires : `npm test -- tests/unit`
     - Tests complets (unitaires, fonctionnels, E2E, intégration) : `npm test`
     - Validation locale complète CI/CD : `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
   - **Obligation absolue d'affichage OK (code applicatif uniquement) :** Il est **impératif de retourner les tests au statut OK** (100% de succès, 0 échec) dans chaque compte-rendu pour tout développement applicatif.
   - **Exclusion formelle pour les ADRs / docs :** Si une tâche ou un ticket concerne uniquement la rédaction d'une ADR ou de la documentation sans toucher au code applicatif, **retirer et ne jamais afficher de tests**.
   - Interdiction de soumettre une PR si un seul test ou check échoue.

5. **Pull Request (PR) vers `dev` :**
   - Commiter avec des messages conventionnels (`feat(...)`, `fix(...)`, `test(...)`) référençant `#X`.
   - Pousser la branche de feature : `git push origin feat/issue-X-<slug>`.
   - Créer la Pull Request vers `dev` via GitHub CLI :
     ```bash
     gh pr create --base dev --head feat/issue-X-<slug> --title "feat(...): titre (#X)" --body "Description détaillée, critères d'acceptation et références ADR"
     ```

6. **CI/CD GitHub Actions Verte :**
   - Surveiller le run GitHub Actions déclenché par l'événement `pull_request` sur la PR :
     ```bash
     gh pr checks
     ```
   - S'assurer que le pipeline passe au **VERT ✅**. En cas d'échec, corriger immédiatement sur la branche de feature.

7. **Comment tester & Rapport de validation :**
   - **Retourner impérativement les tests en OK** dans la réponse avec le résumé exact des résultats.
   - Fournir un guide pas-à-pas clair et actionnable pour tester en local.
   - Proposer ensuite le ticket suivant.

---

## Liaison ADR & Création d'Issue GitHub

À chaque fois que l'utilisateur demande de concevoir ou rédiger une ADR :
1. **Rédaction de l'ADR :** Rédiger le document dans `docs/adr/XXXX-<slug>.md` et mettre à jour le sommaire `docs/adr/README.md`.
2. **Création systématique de l'Issue GitHub (`gh issue create`) :**
   - Créer une issue détaillée pour l'implémentation future qui découle de cette ADR.
   - Inclure :
     - Contexte et justification architecturale (lien vers l'ADR).
     - Spécifications fonctionnelles et techniques attendues.
     - Critères d'acceptation précis (DoD).
3. **Pas de tests :** Ne jamais lancer ni afficher de tests applicatifs lors de cette étape de simple décision/documentation.
