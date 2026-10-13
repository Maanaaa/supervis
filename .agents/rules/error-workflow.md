# Workflow de Traitement et Journalisation des Erreurs (Error Workflow)

Ce protocole s'applique automatiquement et immédiatement dès que l'utilisateur signale une erreur, un dysfonctionnement, un comportement inattendu ou demande de résoudre un bug.

---

## 1. Documentation Systématique dans le Fichier Dédié

Toute demande relative à une erreur **DOIT obligatoirement être consignée** dans le fichier :
[`docs/journal-erreurs.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/journal-erreurs.md)

Chaque entrée dans ce journal doit suivre la structure standardisée suivante :

```markdown
### [ERR-YYYYMMDD-XX] Titre Court de l'Anomalie

- **Date & Heure :** YYYY-MM-DD HH:mm:ss
- **Signalement Utilisateur :** "Citation exacte ou synthèse fidèle des propos de l'utilisateur"
- **Symptôme Constaté :** Description factuelle du comportement anormal observé.
- **Analyse de Cause Racine (RCA) :** Explication technique détaillée de l'origine du bug.
- **Correctifs Appliqués :** Liste précise des fichiers modifiés et des mécanismes ajoutés/ajustés.
- **Règles & Prévention :** Règle pérenne ajoutée dans `.agents/rules/` ou ADR pour interdire la récidive.
- **Statut :** Résolu ✅
```

---

## 2. Déroulé Séquentiel du Diagnostic et de la Résolution

1. **Prise en Compte Immédiate & Journalisation :**
   - Inscrire la demande dans [`docs/journal-erreurs.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/journal-erreurs.md).

2. **Investigation & Reproduction :**
   - Analyser les logs terminaux, les codes HTTP, les réponses SSR, les traces d'erreurs et les timeouts.
   - Ne pas deviner : vérifier l'état réel des services (ex: port BDD, état des routes, nullabilité des variables client).

3. **Correction Robuste (Résilience & Zero-Blocking) :**
   - Appliquer des timeouts stricts sur toutes les dépendances réseau/BDD (ex: `serverSelectionTimeoutMS: 3000`).
   - Assurer un fallback élégant sans blocage de l'interface utilisateur.
   - Toujours fournir un composant de chargement (`loading.tsx`) et des composants d'erreur (`error.tsx`, `global-error.tsx`).
   - Sécuriser l'hydratation côté client (gardes sur les variables optionnelles ou nullables comme `usePathname()`).

4. **Capitalisation dans les Règles :**
   - Identifier pourquoi le problème s'est produit.
   - Ajouter ou enrichir une règle dans `.agents/rules/` (`code-quality.md`, `error-workflow.md`, `testing-standards.md`) afin que la cause identifiée soit formellement bannie pour tous les développements futurs.

5. **Validation par les Tests & CI/CD (Retour OK obligatoire) :**
   - Tests unitaires : `npm test -- tests/unit`
   - Tests complets : `npm test`
   - Chaîne locale CI/CD : `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
   - **Retourner impérativement les tests au statut OK (100% de succès)** dans la réponse à l'utilisateur.
   - S'assurer que le pipeline distant GitHub Actions passe au **VERT ✅** (`gh pr checks`).

---

## 3. Honnêteté des Comptes-Rendus (Obligatoire)

- **Décision ≠ Implémentation :** Quand seule une ADR ou une doc est rédigée, l'écrire explicitement en tête de réponse (« Aucun code n'a été écrit, la fonctionnalité n'est pas encore active »). Ne jamais décrire un comportement applicatif (redirection, écran, endpoint) comme s'il existait s'il n'est pas codé et testé.
- **Uniquement ce qui a été exécuté :** Le rapport de tests ne liste que les commandes réellement lancées dans le tour courant, avec leurs chiffres exacts. Si la chaîne CI/CD complète n'a pas été relancée, l'indiquer (« non relancé dans ce tour »).
- **Zéro donnée inventée :** Ne jamais compléter un identifiant tronqué (run ID, SHA) ni détailler un nombre de tests par suite non présent dans la sortie réelle.
