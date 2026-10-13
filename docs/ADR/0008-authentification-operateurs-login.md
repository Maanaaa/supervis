# ADR-0008 : Authentification des opérateurs d'astreinte via formulaire de connexion (Amende ADR-0004)

- **Date :** 2026-10-13
- **Statut :** Accepté
- **Amende :** [ADR-0004 : Identification des membres d'astreinte (Annuaire d'opérateurs)](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0004-gestion-operateurs-astreinte.md)
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
L'ADR-0004 proposait initialement un annuaire d'opérateurs léger reposant sur un simple sélecteur libre en en-tête, sans mot de passe ni formulaire d'authentification bloquant.

Cependant, dans un contexte d'astreinte d'hébergement où chaque action (prise en charge sub-milliseconde, délégation, clôture post-mortem) doit être strictement imputable et où l'accès à la console de supervision doit être réservé aux seuls intervenants autorisés, l'identification formelle par mot de passe s'impose.

L'utilisateur a exprimé les exigences suivantes :
1. Intégrer un **formulaire de connexion** (`/login`) pour les utilisateurs.
2. Définir **`admin`** comme mot de passe par défaut.
3. Utiliser l'API et la base de données MongoDB (`users`) pour la validation des identifiants (ou mécanisme de fallback sécurisé).
4. **Interdire formellement l'inscription / création libre de compte** (`self-registration` désactivée).
5. **Amorcer automatiquement les deux opérateurs de garde par défaut** dans la base de données.

---

## Décision retenue

Nous adoptons une **authentification nominale par formulaire de connexion avec comptes prédéfinis** :

1. **Formulaire de Connexion Dédié (`/login`) :**
   - Mise à disposition d'une page de connexion ergonomique et cohérente avec la charte graphique sombre d'infrastructure.
   - Saisie de l'identifiant (Nom d'opérateur ou Email) et du mot de passe.
   - Redirection automatique vers `/login` si l'utilisateur accède au tableau de bord sans session active.
   - Bouton de déconnexion sécurisé accessible depuis l'en-tête du tableau de bord.

2. **Politique de Mots de Passe & Sécurité :**
   - Le mot de passe par défaut est **`admin`**.
   - Le modèle MongoDB `User` intègre le champ `password` (avec hashage sécurisé ou vérification API).

3. **API d'Authentification & Gestion de Session :**
   - Mise en place d'un endpoint dédié (ex: `/api/auth/login`) vérifiant les informations d'identification contre la collection MongoDB `users`.
   - Conservation de l'identité de l'opérateur connecté (session / cookie HTTP sécurisé ou stockage persistant côté client) afin que chaque opération (ACK, clôture, transfert) lui soit automatiquement attribuée sans sélection manuelle.

4. **Fermeture Stricte des Créations de Compte :**
   - Aucun formulaire d'enregistrement libre (`/register` ou `Sign Up`) n'est présent ni autorisé.
   - L'administration des comptes reste réservée aux administrateurs ou au provisioning interne.

5. **Amorçage Automatique des Deux Opérateurs par Défaut :**
   - Le système initialise systématiquement en base les deux comptes opérateurs suivants lors du démarrage :
     - **Opérateur 1 :**
       - Nom : `Théo`
       - Email : `theo@supervis.local`
       - Mot de passe par défaut : `admin`
       - Rôle : `ADMIN`
       - Statut : `isOnDuty: true` (De garde)
     - **Opérateur 2 :**
       - Nom : `Sarah`
       - Email : `sarah@supervis.local`
       - Mot de passe par défaut : `admin`
       - Rôle : `ASTREINTE`
       - Statut : `isOnDuty: true` (De garde)

---

## Alternatives envisagées
1. **Sélecteur sans mot de passe (ADR-0004 initial) :** Remplacé car insuffisant pour garantir l'imputabilité des actions et la protection d'un outil d'astreinte critique.
2. **Inscription libre des utilisateurs :** Rejetée formellement pour des raisons évidentes de sécurité (risque d'accès non autorisé au tableau de bord d'infrastructure).
3. **SSO / Fournisseur d'identité tiers (OAuth2, Keycloak, Auth0) :** Écarté car surdimensionné pour le besoin immédiat et introduisant des dépendances externes alors que l'application doit pouvoir tourner de manière autonome et hors-ligne.

---

## Conséquences
- **Positives :**
  - Sécurité d'accès garantie par mot de passe.
  - Imputabilité et auditabilité strictes des prises en charge et clôtures d'incidents.
  - Prise en main immédiate en local et en démonstration grâce aux deux comptes pré-configurés avec le mot de passe `admin`.
  - Contrôle d'accès hermétique : aucune création de compte sauvage possible.
- **Compromis :**
  - Nécessite la saisie des identifiants lors de la première arrivée sur l'application.
