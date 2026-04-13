# 🤖 Bot de Recrutement Discord

## Installation locale

```bash
npm install
cp .env.example .env
# Remplis le fichier .env
node index.js
```

## Configuration

### 1. Créer le bot sur Discord
1. Va sur https://discord.com/developers/applications
2. "New Application" → donne un nom
3. Onglet **Bot** → "Add Bot" → copie le **Token**
4. Onglet **OAuth2 > URL Generator** :
   - Scopes : `bot`, `applications.commands`
   - Bot Permissions : `Send Messages`, `Read Messages`, `Manage Messages`, `Embed Links`, `Send Messages in Threads`
5. Copie l'URL générée → ouvre-la → invite le bot sur ton serveur

### 2. Activer les Intents
Sur le portail développeur > Bot :
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

### 3. Remplir le .env
```env
DISCORD_TOKEN=ton_token
RESULTS_CHANNEL_ID=id_du_salon_resultats
```

Pour obtenir un ID : active le mode développeur (Paramètres > Avancés > Mode développeur), puis clic droit sur le salon > "Copier l'identifiant"

### 4. Lancer le bot dans Discord
Dans n'importe quel salon : `!setup-recrutement`

---

## Hébergement gratuit

### Option A — Railway (recommandé)
1. Crée un compte sur https://railway.app
2. "New Project" > "Deploy from GitHub Repo"
3. Ajoute les variables d'env dans l'onglet Variables
4. Deploy ✅

### Option B — Render.com
1. Crée un compte sur https://render.com
2. "New Web Service" > connecte ton repo GitHub
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Ajoute les env vars et deploy ✅

---

## Personnaliser les recrutements

Dans `index.js`, modifie l'objet `RECRUITMENTS` :

```js
const RECRUITMENTS = {
  monPoste: {
    label: '🎯 Nom du poste',
    description: 'Description courte',
    color: 0x5865F2, // Couleur en hex
    questions: [
      'Question 1 ?',
      'Question 2 ?',
      // ...
    ],
  },
};
```

Puis change `RESULTS_CHANNEL_ID` avec l'ID de ton salon résultats.
