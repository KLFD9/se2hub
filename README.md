# Engineers Hub 🚀

Une plateforme moderne dédiée aux ingénieurs et passionnés de technologie, offrant un espace de partage de connaissances et de ressources.

## 🌟 Fonctionnalités Principales

### Actuelles

- **Section Actualités Tech**: Agrégation et affichage des dernières nouvelles du monde technologique
- **Location de Serveurs**: Interface de gestion pour la location de serveurs
- **Grille de Fonctionnalités**: Présentation visuelle des services disponibles
- **Section Héros**: Landing page moderne et responsive
- **Intégration Réseaux Sociaux**: Connexion avec les principales plateformes sociales

### 🔮 Fonctionnalités à Venir

- **Forum Communautaire**: Espace de discussion et d'entraide
- **Système de Mentorat**: Mise en relation mentors/mentorés
- **Marketplace de Ressources**: Partage de templates, scripts et outils
- **Système de Badges**: Reconnaissance des contributions
- **API Publique**: Pour l'intégration avec d'autres services

## 🛠 Stack Technique

- **Frontend**: React + TypeScript + Vite
- **Styling**: CSS Modules avec support responsive
- **Backend**: Node.js avec Express
- **State Management**: React Hooks et Context API
- **Performance**: Optimisation avec Skeleton Loading

## 📦 Installation

```bash
# Cloner le repository
git clone [url-du-repo]

# Installer les dépendances
npm install

# Variables d'environnement
cp .env.example .env
# Configurer les variables d'environnement nécessaires

# Lancer en développement
npm run dev

# Build pour la production
npm run build
```

## 🔧 Configuration

Le projet nécessite les configurations suivantes:

- Variables d'environnement pour les API keys
- Configuration des services de news
- Paramètres de connexion aux réseaux sociaux

## 📤 Export/Import SpaceCalc

L'outil **SpaceCalc** permet d'exporter vos calculs sous forme de fichier JSON. Ce fichier suit la structure suivante :

```json
{
  "configuration": {
    "shipSize": "small",
    "baseWeight": 10000,
    "gravity": "earth",
    "atmosphere": "normal",
    "multiplier": "realistic"
  },
  "containerStats": { /* ... */ },
  "thrusterResults": { /* ... */ },
  "multiAxisConfig": { /* ... */ },
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

Pour réimporter une configuration, cliquez sur le bouton **Importer** dans la section d'export de SpaceCalc et sélectionnez votre fichier `.json`. Les valeurs de configuration (taille du vaisseau, masse, environnement...) seront chargées automatiquement ainsi que les résultats associés.

## 🧩 Mod Manager

Ce nouvel outil permet désormais d'éditer simplement vos listes de mods Space Engineers.
Inspiré par [Space-Engineers-Mod-Manager](https://github.com/g3arshift/Space-Engineers-Mod-Manager),
il offre l'import/export de modlists et la détection de conflits (fonctionnalité planifiée).
Vous pouvez ajouter ou supprimer des mods, sauvegarder la liste dans le navigateur et exporter un fichier `modlist.json`.
Depuis cette version, un champ de recherche permet de trouver un mod directement via le Workshop Steam.
Les résultats s'affichent sous la barre de recherche et vous pouvez ajouter un mod en un clic sans retenir son identifiant.

## 🤝 Contribution

Les contributions sont les bienvenues! Voici comment participer:

1. Fork du projet
2. Création d'une branche (`git checkout -b feature/AmazingFeature`)
3. Commit des changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouverture d'une Pull Request

## 📝 Standards de Code

- Utilisation de TypeScript strict
- Pas encore de tests unitaires (Jest à venir)
- Respect des règles ESLint
- Documentation des composants avec JSDoc

## 📫 Contact

Pour toute question ou suggestion, n'hésitez pas à :

- Ouvrir une issue
- Rejoindre notre communauté Discord
- Nous contacter via les réseaux sociaux

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE.md pour plus de détails.
