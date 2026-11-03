# ADR-0012 : Cohérence stricte du parc de serveurs et auto-provisioning lors des simulations (Amende ADR-0010)

- **Date :** 2026-11-03
- **Statut :** Accepté
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Le simulateur de pannes (introduit par l'ADR-0010) permettait de déclencher des alertes prédéfinies (`cpu`, `disk`, `nginx`). Cependant :
1. Les actions ciblaient des serveurs codés en dur (`srv-database-01`, `srv-prod-api`, `srv-lb-edge`) qui n'existaient pas dans le parc initial amorcé par `server.js` (`db-primary-sql`, `web-prod-01`, etc.).
2. En conséquence, les alertes s'affichaient sans liaison `serverId`, et le serveur incriminé restait introuvable dans la vue "Parc Serveurs".
3. Par ailleurs, les calculs de temps relatifs affichés sur les fiches d'alerte et de serveurs entraînaient des désynchronisations d'hydratation React SSR/Client (1 seconde de décalage entre le rendu serveur et le montage client).

## Décision retenue
1. **Harmonisation et auto-provisioning des serveurs simulés :**
   - Remplacement de `db-primary-sql` par `srv-database-01` dans les seeds de démarrage de l'infrastructure.
   - Les déclencheurs du simulateur ciblent en priorité les serveurs existants correspondant au type de panne.
   - Si un serveur spécifié n'existe pas en base, il est automatiquement créé dans la collection `Server`, indexé, invalidé en cache et diffusé via l'événement Socket.IO `server:created`.
   - Toute alerte créée par simulation est impérativement liée à l'`_id` de son serveur hôte.
2. **Neutralisation des écarts d'hydratation temporels :**
   - Utilisation de la directive React `suppressHydrationWarning` sur tous les éléments DOM affichant des dates relatives calculées dynamiquement (`formatRelativeTime`).

## Alternatives envisagées
1. **Création d'alertes orphelines (sans liaison serveur) :** Rejeté car cela brise la traçabilité dans l'onglet "Parc Serveurs" et empêche la navigation vers `/servers/[id]`.
2. **Calcul des temps relatifs uniquement après `useEffect` côté client :** Rejeté car cela entraîne un scintillement visuel (layout shift) au premier affichage SSR. `suppressHydrationWarning` est la solution native recommandée par Next.js.

## Conséquences
- **Positives :**
  - Intégrité référentielle garantie à 100% entre les incidents et le parc de serveurs.
  - Zéro erreur d'hydratation React lors des rendus SSR avec calculs de temps relatifs.
  - Expérience démonstration fluide sans anomalie visuelle en soutenance.
- **Compromis :**
  - Les serveurs auto-provisionnés pour la démo sont persistés en base tant qu'un `reset` ou un nettoyage de base n'est pas déclenché.
