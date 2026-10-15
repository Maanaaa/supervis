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

---

### [ERR-20261013-03] Absence de styles CSS dans le navigateur (fond blanc, polices serif)

- **Date & Heure :** 2026-10-13 09:05:00
- **Signalement Utilisateur :**
  > "POurquoi je n'ai pas de css" (+ capture d'écran montrant l'application non stylisée, fond blanc, boutons bruts, polices serif).
- **Symptôme Constaté :**
  Le navigateur affiche l'application sur fond blanc avec la police par défaut du système (`Times New Roman` / Serif) et des boutons HTML bruts non stylisés. La requête HTTP `GET /_next/static/css/app/layout.css` renvoie une erreur 404.
- **Analyse de Cause Racine (RCA) :**
  1. **Absence de parsing URL dans le serveur custom Next.js :** Dans `server.js`, la requête était transmise brute à `handle(req, res)` au lieu de `handle(req, res, parsedUrl)` avec `parse(req.url, true)`. Lors de requêtes sur les fichiers statiques de style avec paramètre de version (`/_next/static/css/app/layout.css?v=...`), Next.js tentait de résoudre le fichier littéral avec le query string sur le disque et échouait avec un statut 404.
  2. **Collision de cache .next entre build et dev :** L'exécution de `npm run build` en parallèle du serveur de développement dépose les manifestes et fichiers de production (`.next/BUILD_ID`). Lorsque le serveur `dev` lit ce dossier de build de production, le compilateur dev webpack entre en conflit sur les assets CSS statiques.
  3. **Processus Node.js non rechargé :** Le serveur `node server.js` était en exécution continue depuis 16 minutes (PID démarré avant l'intégration des correctifs).
- **Correctifs Appliqués :**
  - **Parsing URL complet :** Passage systématique de `parsedUrl` (`parse(req.url, true)`) à `handle(req, res, parsedUrl)` dans [`server.js`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/server.js).
  - **Purge automatique du cache de production en dev :** Dans `server.js`, détection automatique de la présence de `.next/BUILD_ID` lors du lancement en mode développement pour purger `.next` et garantir un démarrage propre avec compilation CSS dynamique à chaud.
- **Règles & Prévention :**
  - Règle ajoutée dans [`.agents/rules/code-quality.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md) sur la configuration stricte des serveurs personnalisés Next.js (`parsedUrl` obligatoire) et l'isolation des environnements dev/prod.
- **Statut :** Résolu ✅

---

### [ERR-20261013-04] Aucune demande d'authentification après rafraîchissement

- **Date & Heure :** 2026-10-13 09:27:00
- **Signalement Utilisateur :**
  > "Erreur : j'ai refresh la page mais ça ne m'a pas demandé de m'authentifier.."
- **Symptôme Constaté :**
  Le tableau de bord reste accessible sans identification ; aucune page `/login` n'existe.
- **Analyse de Cause Racine (RCA) :**
  - Ce n'est pas une régression : **l'authentification n'a jamais été implémentée**. Seule l'ADR-0008 (décision documentaire) a été rédigée et commitée.
  - Le compte-rendu précédent de l'agent laissait entendre que la fonctionnalité était prête (« Décisions actées », redirection automatique vers `/login`…) sans préciser explicitement qu'aucune ligne de code n'avait été écrite.
  - Ce même compte-rendu affichait aussi un « pipeline CI/CD local OK » et un détail de tests par suite qui n'avaient pas été réellement exécutés lors de ce tour (seuls `npm test -- tests/unit` et `npm test` l'avaient été), ainsi que des identifiants de runs GitHub complétés alors qu'ils étaient tronqués dans la sortie.
- **Correctifs Appliqués :**
  - Création d'un ticket GitHub dédié et d'un plan d'action à valider (workflow ticket obligatoire) pour l'implémentation réelle : page `/login`, `/api/auth/login|logout`, middleware de protection, hash des mots de passe, amorçage des 2 opérateurs.
- **Règles & Prévention :**
  - Ajout dans [`AGENTS.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/AGENTS.md), [`.agents/rules/error-workflow.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/error-workflow.md) et [`.agents/rules/ticket-workflow.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/ticket-workflow.md) de la règle formelle : **« Retirer les tests si simple ADR/doc »**. Il est strictement interdit d'exécuter ou d'afficher un rapport de tests lorsqu'une intervention ne concerne qu'une ADR ou de la documentation, afin d'éviter toute ambiguïté sur l'existence ou non du code applicatif.
  - Règle d'honnêteté des comptes-rendus : distinguer explicitement « décision documentée » et « fonctionnalité implémentée », ne rapporter que les commandes réellement exécutées dans le tour.
- **Statut :** Résolu côté règles ✅ (Règle actée et verrouillée dans les fichiers de règles ; implémentation de l'auth en attente de traitement du ticket #10)

---

### [ERR-20261013-05] Perte des styles CSS suite à l'exécution de next build en parallèle du serveur dev

- **Date & Heure :** 2026-10-13 09:57:00
- **Signalement Utilisateur :**
  > "L'app est à nouveau pas styilisée." (+ capture d'écran montrant la page `/login` avec fond sombre inline mais textes noirs non contrastés, police avec empattement serif et boutons bruts).
- **Symptôme Constaté :**
  La requête HTTP `GET /_next/static/css/app/layout.css?v=...` renvoie un statut `404 Not Found`. Par conséquent, l'ensemble des variables CSS (`--text-primary`, `--bg-glass`, `--border-color`, `--radius-*`) et polices système de `globals.css` ne sont pas chargées, laissant les éléments HTML avec leurs styles par défaut du navigateur (textes noirs, Times New Roman, inputs sans bordure).
- **Analyse de Cause Racine (RCA) :**
  1. **Écrasement du dossier de build `.next` par la validation CI/CD :** Lors de la phase de validation obligatoire du ticket #10, la commande locale `npm run build` a été exécutée. `next build` nettoie `.next` et compile la production, en extrayant les feuilles de styles dans des fichiers CSS hachés (ex: `.next/static/css/bf3af5cdeda10d4d.css`) au lieu de l'arborescence de développement (`.next/static/css/app/layout.css`).
  2. **Désynchronisation du serveur dev actif :** Le serveur de développement (`node server.js`, PID démarré antérieurement) continue de tourner en mémoire et génère un HTML ciblant le chemin CSS de dev (`/_next/static/css/app/layout.css`). Comme ce fichier physique n'existe plus sur le disque suite au build de production, le serveur renvoie 404.
- **Correctifs Appliqués :**
  - **Fallback résilient dans `server.js` :** Ajout dans le listener HTTP de `server.js` d'un intercepteur servant automatiquement le fichier CSS présent dans `.next/static/css/` lorsque `/_next/static/css/app/layout.css` est réclamé.
  - **Script de synchronisation post-build dans `package.json` :** Automatisation de la copie du bundle CSS vers `.next/static/css/app/layout.css` immédiatement après `next build`.
  - **Styles de secours défensifs dans `login/page.tsx` :** Définition de couleurs de secours explicites en dur (`color: #f8fafc`, `background: rgba(20, 30, 51, 0.75)`) garantissant un rendu lisible et contrasté même en cas d'indisponibilité momentanée du bundle CSS.
- **Règles & Prévention :**
  - Règle ajoutée dans [`.agents/rules/code-quality.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md) sur la résilience et la compatibilité permanente des assets CSS entre les modes dev et production.
- **Statut :** Résolu ✅

---

### [ERR-20261015-06] Pull Request fleuve de 17 417 lignes ouverte vers main (Absence de contrôle de taille et de branche cible)

- **Date & Heure :** 2026-10-15 14:30:00
- **Signalement Utilisateur :**
  > "L'IA m'a fait un PR à 17 000 lignes, ce qui est évidemment beaucoup trop, ceci ne doit plus se reproduire."
- **Symptôme Constaté :**
  La PR #11 (`feat/issue-10-auth-login`) a été ouverte directement vers la branche `main` au lieu de `dev`, embarquant 34 commits et un diff gigantesque de +17 417 lignes (incluant l'intégralité du projet et les fichiers générés), rendant toute revue humaine impossible.
- **Analyse de Cause Racine (RCA) :**
  1. **Cible incorrecte de la commande `gh pr create` :** L'agent a omis de spécifier ou a ciblé `--base main` au lieu de `--base dev`.
  2. **Absence de garde-fou mécanique de taille de diff :** Aucun script de hook ne mesurait le volume de lignes modifiées (`git diff --shortstat`) avant la création effective de la Pull Request.
  3. **Absence de directive explicite d'atomicité des PRs :** Les consignes n'imposaient pas de plafond strict en nombre de lignes par PR.
- **Correctifs Appliqués :**
  - **Mise à jour du hook de sécurité Git ([`.agents/scripts/git-guard.sh`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/scripts/git-guard.sh)) :**
    - Blocage strict de toute commande `gh pr create` ciblant `main`.
    - Calcul automatique du volume de lignes modifiées : rejet immédiat (`decision: deny`) de toute PR dépassant **800 lignes** de diff par rapport à `dev`.
  - **Mise à jour du Skill [`ticket-lifecycle`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/skills/ticket-lifecycle/SKILL.md) et de [`ticket-workflow.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/ticket-workflow.md) :**
    - Règle formelle imposant des PRs atomiques (cible idéale : 200 à 500 lignes, plafond dur à 800 lignes).
    - Découpage obligatoire des fonctionnalités volumineuses en sous-tickets.
  - **Mise à jour d'[`AGENTS.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/AGENTS.md) :** Règle cardinale sur les PRs atomiques vers `dev`.
- **Règles & Prévention :**
  - Garde-fou mécanique bloquant dans `git-guard.sh`.
  - Contrôle systématique du diff avant soumission.
- **Statut :** Résolu ✅

---

### [ERR-20261015-07] Faille de sécurité : Usurpation d'opérateur lors de la prise de ticket (BOLA / Confiance aveugle dans le payload client)

- **Date & Heure :** 2026-10-15 14:32:00
- **Signalement Utilisateur :**
  > "Il y a une faille de sécurité : via le navigateur, je peux prendre une tâche à la place d'un autre opérateur."
- **Symptôme Constaté :**
  Un utilisateur authentifié (ex: Sarah) pouvait manipuler `localStorage.setItem('supervis_current_operator', 'Théo')` ou forger une requête `PATCH /api/alerts/[id]` avec `{ action: 'ACK', operator: 'Théo' }` pour s'approprier un incident sous l'identité d'un collègue sans que le backend ne bloque l'action.
- **Analyse de Cause Racine (RCA) :**
  1. **Confiance aveugle dans le payload JSON (`req.body.operator`) :** Le route handler [`app/src/app/api/alerts/[id]/route.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/api/alerts/%5Bid%5D/route.ts) assignait le champ `assignedTo` à partir de `body.operator` sans vérifier le cookie de session HTTP-only signé (`supervis_session`).
  2. **Vulnérabilité BOLA / Insecure Direct Object Reference :** Le middleware laissait passer la requête car le cookie de session existait, mais la route ne vérifiait pas la correspondance entre l'identité du jeton de session et l'identité revendiquée dans le body.
  3. **Mutabilité non protégée côté client :** Le hook [`useOperator.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/hooks/useOperator.ts) autorisait la modification de l'opérateur courant en local (`changeOperator`) en écrasant `localStorage`.
- **Correctifs Appliqués :**
  - **Validation serveur stricte de la session dans [`app/src/app/api/alerts/[id]/route.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/api/alerts/%5Bid%5D/route.ts) :**
    - Extraction et décodage cryptographique du cookie `supervis_session` via `verifySessionToken`.
    - Pour l'action `ACK` : si une session est présente et que `body.operator` diffère de `session.name`, rejet immédiat avec code **`403 Forbidden`** (*tentative d'usurpation d'identité*). L'assignation est forcée sur `session.name`.
    - Pour l'action `TRANSFER` : vérification stricte que le demandeur du transfert est le détenteur réel authentifié (`session.name === alert.assignedTo`), sinon retour **`403 Forbidden`**.
  - **Verrouillage de l'identité côté client dans [`useOperator.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/hooks/useOperator.ts) :**
    - Suppression de la surcharge par `localStorage` ; l'identité est liée exclusivement à la session active `/api/auth/me`.
    - Blocage de toute tentative de changement d'identité via `changeOperator` sans déconnexion/reconnexion.
  - **Tests automatisés d'anti-usurpation dans [`tests/integration/atomic-locking.test.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/tests/integration/atomic-locking.test.ts) :**
    - Test de tentative d'appropriation sous faux nom -> 403 Forbidden validé.
    - Test d'assignation conforme avec cookie légitime -> 200 OK validé.
    - Test de tentative de transfert illégitime -> 403 Forbidden validé.
- **Règles & Prévention :**
  - Règle ajoutée dans [`.agents/rules/code-quality.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md) (Section 5 : "Sécurité, Autorisation & Contrôle d'Accès Backend — Zéro Confiance Client").
  - Directive cardinale de sécurité inscrite dans [`AGENTS.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/AGENTS.md).
- **Statut :** Résolu ✅

---

### [ERR-20261015-08] Audit Développeur Senior : Omission RBAC sur suppression, Garde-fous Stop partiels et Inline Styling massif

- **Date & Heure :** 2026-10-15 15:10:00
- **Signalement Utilisateur :**
  > "Ton audit n'est pas complet. Place toi comme un vrai développeur et regarde les erreurs qui ont étés faites, également en terme de conventions etc... Et adapte les hooks, les rules, les scripts..."
- **Symptôme Constaté :**
  1. `DELETE /api/servers/[id]` n'effectuait aucune vérification de rôle (`ADMIN`), permettant à n'importe quel compte ou requête de détruire des machines.
  2. Le hook Stop `test-guard.sh` n'exécutait que `npm test`, laissant passer des erreurs de typage TypeScript (`tsc --noEmit`) ou de linting ESLint dans les fichiers non testés.
  3. `git-guard.sh` ne bloquait pas les commits directs exécutés sur les branches `dev` ou `main`.
  4. Les composants React (`AlertCard.tsx`, `AddServerForm.tsx`) contenaient des dizaines de styles inline massifs (`style={{ ... }}`) au lieu de classes CSS réutilisables dans `globals.css`.
  5. Absence de warning en production en cas d'utilisation du fallback secret `SESSION_SECRET`.
- **Analyse de Cause Racine (RCA) :**
  - **Biais de localité de l'IA :** Les LLMs ont tendance à concentrer le style dans les balises JSX pour s'éviter d'ouvrir et modifier `globals.css` (sprawl CSS inline).
  - **Confusion Authentification vs Autorisation :** L'IA considérait qu'un middleware vérifiant la session suffisait, ignorant la défense en profondeur et le contrôle granulaire de rôle (RBAC) au niveau du Route Handler.
  - **Garde-fous incomplets :** Un test Jest vert ne garantit pas la validité du typage global TypeScript de l'App Router.
- **Correctifs Appliqués :**
  - **Vérification RBAC dans [`app/src/app/api/servers/[id]/route.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/app/api/servers/%5Bid%5D/route.ts) :** Blocage 403 Forbidden si l'utilisateur connecté n'a pas le rôle `ADMIN`.
  - **Sécurisation de `SESSION_SECRET` dans [`app/src/lib/session.ts`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/app/src/lib/session.ts) :** Alerte de sécurité critique en production si la clé par défaut est employée.
  - **Durcissement de [`test-guard.sh`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/scripts/test-guard.sh) :** Exécution systématique de `npm run typecheck && npm test` avant toute autorisation de sortie.
  - **Durcissement de [`git-guard.sh`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/scripts/git-guard.sh) :** Interdiction des commandes `git commit` directes sur `main` ou `dev`, et blocage des commandes destructives `git clean -f`.
  - **Formalisation des règles dans [`.agents/rules/code-quality.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md) :** Sections 6 à 9 (Proscription de l'inline styling massif, RBAC & Défense en profondeur, Contrat d'enveloppe API REST, DRY).
- **Règles & Prévention :**
  - Garde-fous mécaniques pré- et post-outils actifs.
  - Documentation de référence mise à jour dans l'artifact d'audit.
- **Statut :** Résolu ✅



