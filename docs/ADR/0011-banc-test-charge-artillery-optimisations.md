# ADR-0011 : Banc de test de charge Artillery et stratégie d'optimisation haute performance

- **Date :** 2026-11-03
- **Statut :** Accepté
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique

L'application de supervision d'astreinte **supervis-app** doit être capable d'absorber des pics soudains d'incidents, d'inondations de métriques système et de consultations massives par les techniciens d'astreinte sans rupture de service ni perte de réactivité.

Avant cette décision, aucune métrique concrète de résistance à la charge (débit req/s, latences p95/p99 sous saturation, consommation mémoire, limites des connexions MongoDB) n'était mesurée de manière automatisée. Les premiers essais ont révélé des goulots d'étranglement :
1. Dégradation de la latence médiane (> 1,2s) et p95 (> 6,5s) sous forte sollicitation.
2. Blocage CPU de la boucle d'événements Node.js par les opérations cryptographiques synchrones (`scryptSync`).
3. Épuisement rapide du pool de connexions Mongoose par défaut (10 connexions).
4. Absence de couche de cache mémoire, obligeant chaque requête à réinterroger MongoDB.

---

## Décision retenue

Nous intégrons **Artillery** comme banc de test de charge et de stress officiel pour l'application, et mettons en œuvre une stratégie d'optimisation multicouche pour la haute performance :

1. **Outillage Artillery & Scénarios Dédiés :**
   - Intégration de scénarios versionnés dans `tests/load/` :
     - `artillery-smoke.yml` : vérification rapide (2s).
     - `artillery.yml` : montée en charge progressive (35s, jusqu'à 35 VU/s).
     - `artillery-50reqs.yml` : test continu à 50 req/s stabilisées (100% succès).
     - `artillery-massive.yml` : test d'hyper-trafic (jusqu'à 150 VU/s et 12 000+ requêtes).
   - Script autonome `scripts/generate-report.mjs` générant des rapports HTML interactifs enrichis avec diagnostic, anomalies et axes d'amélioration.

2. **Désengorgement de la boucle d'événements (Event Loop) :**
   - Remplacement de `scryptSync` par `scryptAsync` (déporté dans le thread pool libuv) pour l'authentification dans `src/lib/auth.ts`.
   - Mise en place d'un cache mémoire des jetons HMAC validés (`tokenCache`) dans `src/lib/session.ts` pour réduire drastiquement l'empreinte CPU du middleware.
   - Normalisation insensible aux accents de la recherche d'identifiants (`theo` / `Théo`).

3. **Optimisation MongoDB & Mongoose :**
   - Augmentation du pool de connexions Mongoose à `maxPoolSize: 100` et `minPoolSize: 10` dans `src/lib/db.ts`.
   - Utilisation systématique de `.lean()` et limitation par défaut (`limit(50)`) sur les listes volumineuses d'alertes et de serveurs.
   - Ajout d'index composés (`createdAt: -1`) sur les modèles `Server` et `Alert`.

4. **Cache In-Memory Réactif (TTL) :**
   - Création de `src/lib/cache.ts` pour stocker en RAM les réponses de consultation (`/api/alerts`, `/api/servers`) pendant 1,5s.
   - Invalidation réactive immédiate du cache lors de toute écriture ou mutation (`POST /api/alerts`, `PATCH`, `DELETE`).

5. **Durcissement Réseau & Sockets HTTP :**
   - Configuration du listener HTTP dans `server.js` : `maxConnections: 65535`, backlog TCP à `2048`, `keepAliveTimeout: 65000` et intercepteur `server.on('error')` contre les pannes `EPIPE`.

---

## Alternatives envisagées

- **k6 (Grafana) :** Excellent outil en Go, mais nécessite une installation binaire externe et ne s'intègre pas aussi naturellement dans l'écosystème npm / Next.js sans dépendances supplémentaires.
- **Autocannon :** Ultra-rapide pour benchmarker une URL unique en HTTP pipelining, mais insuffisant pour orchestrer des scénarios multi-étapes avec authentification par cookies.
- **Cache externe Redis dès maintenant :** Idéal pour une mise à l'échelle horizontale multi-instances, mais introduit une dépendance d'infrastructure lourde non requise pour une instance unique déjà capable d'atteindre 5 000+ req/s en mémoire.

---

## Conséquences

### Positives
- **Gains de performance spectaculaires :** Latence p95 divisée par 148 (de 6 569 ms à 44 ms), latence médiane sous les 10 ms.
- **Fiabilité sous charge :** Zéro échec et zéro perte de paquets sous régime nominal continu à 50 req/s.
- **Visibilité immédiate :** Rapports HTML autonomes directement visualisables par les développeurs et l'équipe d'astreinte.
- **Tolérance utilisateur :** Reconnaissance fluide des identifiants avec ou sans accents (`theo` / `Théo`).

### Compromis
- **Cache en mémoire local :** Le cache TTL est interne au processus Node.js actuel. En cas de déploiement en cluster multi-nœuds futur, un broker Redis sera nécessaire pour la synchronisation globale du cache et des WebSockets.

