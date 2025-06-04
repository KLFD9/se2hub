# Tâches pour l'implémentation du Mod Manager

1. **Ajouter la page Mod Manager**
   - Créer `ModManagerPage.tsx` avec un composant de base.
   - Ajouter la route `/tools/modmanager` dans `src/App.tsx`.
   - Insérer la carte correspondante dans `ToolsPage.tsx`.
2. **Intégrer la gestion des modlists**
   - S'appuyer sur l'outil open source [Space-Engineers-Mod-Manager](https://github.com/g3arshift/Space-Engineers-Mod-Manager) pour permettre l'import/export de listes de mods.
   - Prévoir l'organisation et le tri des mods (ordre de chargement, thèmes, etc.).
3. **Suivi des conflits entre mods**
   - Implémenter un système d'analyse des incompatibilités (feature planifiée dans le Mod Manager).
   - Afficher des alertes claires pour les utilisateurs.
4. **Interface d'édition**
   - Permettre l'ajout et la suppression de mods manuellement.
   - Sauvegarder la liste localement dans le navigateur.
5. **Import/Export simplifié**
   - Importer une `modlist.json` depuis un fichier.
   - Exporter la liste actuelle au même format.
6. **Recherche de mods intégrée**
   - Ajouter l'endpoint `/api/mods/search` dans `server.js` pour interroger le Workshop Steam et retourner une liste de mods (id, nom, miniature).
   - Afficher un champ de recherche dans `ModManagerPage` et présenter les résultats sous forme de liste.
   - Permettre l'ajout direct d'un mod depuis les résultats sans avoir à saisir son identifiant manuellement.
