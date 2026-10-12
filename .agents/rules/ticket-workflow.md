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

4. **Tests Automatisés Complets :**
   - Rédiger et exécuter la suite de tests (`npm test`) :
     - Tests unitaires (modèles, utilitaires)
     - Tests fonctionnels (route handlers, requêtes HTTP)
     - Tests E2E / Intégration (WebSockets, opérations atomiques BDD)
   - Valider la chaîne locale complète : `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`.

5. **Pull Request (PR) vers `dev` :**
   - Commiter avec des messages conventionnels (`feat(...)`, `fix(...)`, `test(...)`) référençant `#X`.
   - Pousser la branche de feature : `git push origin feat/issue-X-<slug>`.
   - Créer la Pull Request vers `dev` via GitHub CLI :
     ```bash
     gh pr create --base dev --head feat/issue-X-<slug> --title "feat(...): titre (#X)" --body "Description détaillée, critères d'acceptation et références ADR"
     ```

6. **CI GitHub Actions Verte :**
   - Surveiller le run GitHub Actions déclenché par l'événement `pull_request` sur la PR :
     ```bash
     gh pr checks
     ```
   - S'assurer que le pipeline passe au **VERT ✅**. En cas d'échec, corriger immédiatement sur la branche de feature.

7. **Comment tester :**
   - Fournir un guide pas-à-pas clair et actionnable dans la réponse finale pour permettre à l'utilisateur de tester la fonctionnalité en local et de procéder à la revue de la PR.
   - Proposer ensuite le ticket suivant.
