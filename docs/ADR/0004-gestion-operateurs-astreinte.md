# ADR-0004 : Identification des membres d'astreinte (Annuaire d'opérateurs)

- **Date :** 2026-10-12
- **Statut :** Amendé par [ADR-0008](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0008-authentification-operateurs-login.md)
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Pour répondre à l'exigence *"Qui s'en occupe"*, le système doit savoir quel technicien prend en charge l'incident.
Se pose la question du degré de complexité nécessaire pour gérer ces utilisateurs : faut-il un système complet d'authentification (login, mot de passe hashé, tokens JWT, cookies) ou un mécanisme plus direct ?

## Décision proposée
Adopter un **annuaire d'opérateurs léger** :
- Une collection MongoDB `users` (ou `operators`) contenant l'identité des techniciens (nom, email, téléphone, statut de garde).
- Dans l'interface du tableau de bord :
  - Un sélecteur d'opérateur actif (ex: *« Intervenant : Théo »* mémorisé localement).
  - Lors d'une prise en charge, l'alerte est automatiquement attribuée à l'opérateur sélectionné.
- Pas de formulaire de login bloquant ou de gestion de sessions/mots de passe dans un premier temps.

## Alternatives envisagées
1. **Champ texte libre :** L'opérateur tape son nom à chaque clic. Écarté pour éviter les fautes de frappe et l'absence de cohérence de l'équipe.
2. **Système complet d'authentification avec mots de passe :** Écarté pour l'instant car cela consomme beaucoup de temps de développement sans apporter de valeur directe au cœur du problème de supervision. Peut être branché ultérieurement sans modifier le modèle de données.

## Conséquences
- **Positives :**
  - Données structurées et cohérentes pour les affectations.
  - Ergonomie maximale pour les tests et la démo (changement de technicien en 1 clic).
  - Évolutivité : l'ajout futur d'un mot de passe sur le modèle `User` ne cassera rien.
- **Compromis :**
  - Pas de barrière de sécurité par mot de passe (environnement de confiance type réseau interne).
