# Contexte du Projet

> **Problématique d'origine :**  
> *"Un petit hébergeur veut un tableau de bord qui reçoit les alertes de ses serveurs et les montre à l'astreinte. Qui s'en occupe, quand c'est réglé."*

---

## 1. Contexte Métier
Un petit hébergeur informatique gère une infrastructure de serveurs pour ses clients (sites web, bases de données, applications, VPS). 
Pour garantir la continuité de service et respecter ses engagements de disponibilité (SLA) :
- Les pannes et anomalies doivent être détectées au plus vite, y compris la nuit et le week-end.
- Une équipe d'astreinte technique assure la permanence en dehors des heures de bureau.
- Les techniciens ont besoin d'un outil centralisé et temps réel pour coordonner leurs interventions sans friction.

---

## 2. Objectifs Clés
1. **Centralisation des alertes** : Visualiser l'état des machines et centraliser les alertes d'incidents (charge CPU excessive, saturation disque, crash de service, coupure réseau).
2. **Coordination de l'astreinte (*« Qui s'en occupe »*)** :
   - Savoir en temps réel si une alerte est en cours de traitement et par quel collègue.
   - Éviter qu'un incident critique reste sans réponse ou que deux techniciens interviennent sur la même machine.
3. **Traçabilité et clôture (*« Quand c'est réglé »*)** :
   - Enregistrer l'heure exacte de prise en charge et de résolution.
   - Fournir un historique clair pour le suivi de la qualité de service et le calcul du temps moyen de rétablissement (MTTR).

---

## 3. Cadre Académique & Contraintes
- **Cadre :** SAE S5 — Développement Web & Intelligence Artificielle.
- **Technologies imposées / cibles :** Node.js, NoSQL (MongoDB), communication temps réel (Socket.IO).
- **Démarche attendue :** Rigueur méthodologique, documentation pérenne des choix, utilisation d'outils d'assistance IA avec traçabilité des décisions.
