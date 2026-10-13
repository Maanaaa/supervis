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

5. **Validation par les Tests & Build :**
   - Exécuter la suite complète de contrôle (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`).
   - S'assurer que le pipeline CI passe au vert avant de valider.
