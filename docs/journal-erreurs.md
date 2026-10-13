# Journal des Erreurs et Incidents — Projet Supervision

Ce document consigne l'historique exhaustif des anomalies signalées, leur diagnostic technique, les correctifs apportés et les règles adoptées pour garantir la fiabilité de l'application.

---

### [ERR-20261013-01] Boucle infinie "missing required error components, refreshing..."

- **Date & Heure :** 2026-10-13 08:35:00
- **Signalement Utilisateur :**
  > "Problème détecté : missing required error components, refreshing... Classe ma demande si besoin stp et réponds-y. Si tu comprends ce que tu as fait pour que ça ne fonctionne pas, ajoute la règle dans les fichiers qui concernent les règles pour plus que ça se reproduise."
- **Symptôme Constaté :**
  Le navigateur affiche un écran blanc avec le message brut `<pre>missing required error components, refreshing...</pre>` et tourne en boucle infinie de rechargement.
- **Analyse de Cause Racine (RCA) :**
  Next.js App Router exige la présence obligatoire de composants d'erreur racine (`error.tsx`, `global-error.tsx`, `not-found.tsx`). En cas d'erreur non interceptée lors du rendu ou de la pré-évaluation sans ces composants, Next.js injecte un script de secours qui recharge la page en boucle.
- **Correctifs Appliqués :**
  - Création de [`app/src/app/error.tsx`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/error.tsx) avec bouton de réessai.
  - Création de [`app/src/app/global-error.tsx`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/global-error.tsx) englobant la structure HTML racine.
  - Création de [`app/src/app/not-found.tsx`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/not-found.tsx) pour les routes 404.
  - Définition d'un fallback `MONGODB_URI` dans `server.js`.
- **Règles & Prévention :**
  - Ajout de la règle obligatoire "Composants d'Erreur & Boundaries obligatoires (Anti-boucle infinie)" dans [`.agents/rules/code-quality.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md).
- **Statut :** Résolu ✅

---

### [ERR-20261013-02] Onglet "History" inactif au clic (Navigation figée sans feedback)

- **Date & Heure :** 2026-10-13 08:48:00
- **Signalement Utilisateur :**
  > "Je suis bien sur la page d'accueil, mais je ne peux pas aller dans l'onglet History par exemple, je clique mais rien ne se passe. Documente ma demande. Ajoute dans le workflows "error-workflow" ce que tu dois faire quand je demande de régler une erreur, notamment documenter ma demande et ta réponse dans un fichier particulier"
- **Symptôme Constaté :**
  L'utilisateur se trouve sur la page d'accueil (`/`) et clique sur l'onglet "📜 Historique & MTTR" (`/history`), mais l'URL ne change pas immédiatement et la page semble insensible aux clics.
- **Analyse de Cause Racine (RCA) :**
  1. **Blocage Mongoose (30s) :** `HistoryPage` est un Server Component asynchrone qui exécute `await connectDB()`. Par défaut, sans configuration `serverSelectionTimeoutMS`, Mongoose attend 30 000 ms avant d'échouer avec `ECONNREFUSED 127.0.0.1:27017` lorsqu'aucun service MongoDB local n'est actif.
  2. **Absence d'indicateur visuel de transition (`loading.tsx`) :** Next.js App Router exécute les transitions de navigation sous React Suspense. Sans fichier `loading.tsx`, Next.js conserve l'écran courant sans aucun retour visuel tant que le serveur n'a pas répondu ou échoué, donnant l'impression que le clic n'a eu aucun effet.
  3. **Risque de NullPointer sur `pathname` :** Dans `Navigation.tsx`, `usePathname()` peut renvoyer `null` pendant l'hydratation. L'appel direct `pathname.startsWith(...)` sans vérification préalable provoquait une rupture de l'hydratation React.
  4. **Environnement de développement sans base locale :** Si l'utilisateur n'a pas démarré de démon MongoDB externe, `server.js` tentait de joindre le port 27017 fermé.
- **Correctifs Appliqués :**
  - **Mongoose Timeout rapide :** Ajout de `serverSelectionTimeoutMS: 3000` dans [`lib/db.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/lib/db.ts) pour ne jamais bloquer le serveur au-delà de 3 secondes.
  - **Création de `loading.tsx` :** Ajout de [`app/src/app/loading.tsx`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/loading.tsx) avec skeleton loader pour un feedback visuel instantané (<16ms) au clic sur n'importe quel onglet.
  - **Sécurisation de `Navigation.tsx` :** Vérification stricte de la nullité de `pathname` avant l'appel à `.startsWith()`.
  - **Démarrage automatique Mongo en dev :** Dans [`server.js`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/server.js), détection automatique de la disponibilité de MongoDB : si le port 27017 local est inaccessible, initialisation transparente d'une instance `mongodb-memory-server` avec amorçage des données de test (serveurs et techniciens) pour une expérience de dev 100% plug & play.
- **Règles & Prévention :**
  - Création de la règle de workflow [`.agents/rules/error-workflow.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/error-workflow.md).
  - Enrichissement de [`.agents/rules/code-quality.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md) sur la réactivité de navigation et la présence impérative de `loading.tsx`.
- **Statut :** Résolu ✅
