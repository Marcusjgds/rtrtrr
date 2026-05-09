const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const RESULTS_CHANNEL_ID = process.env.RESULTS_CHANNEL_ID || '1493246772552667207';
const TIMEOUT_SECONDS = 120;
const QCM_COOLDOWN_HOURS = 24;

const QCM_QUESTIONS = [
  {
    question: 'Que signifie officiellement "SCP" selon la Fondation ?',
    choices: ['Securiser Contenir Proteger', 'Special Containment Procedures', 'Secure Contain Protect'],
    correct: 2,
  },
  {
    question: 'SCP-173 est dangereux uniquement quand...',
    choices: ['Il fait nuit complete dans sa cellule', 'Il nest pas observe directement par au moins une personne', 'Sa temperature depasse 40 degres'],
    correct: 1,
  },
  {
    question: 'Quelle classe designe un SCP dont la neutralisation menacerait la realite entiere ?',
    choices: ['Euclid', 'Keter', 'Apollyon'],
    correct: 2,
  },
  {
    question: 'Pourquoi SCP-682 na jamais pu etre neutralise ?',
    choices: ['Il sadapte biologiquement a chaque methode de destruction', 'Il est protege par un champ de force', 'Il se teleporte hors de toute enceinte'],
    correct: 0,
  },
  {
    question: 'Quel est le bon protocole si le visage de SCP-096 apparait sur une camera ?',
    choices: ['Declencher le protocole Pandora', 'Flouter son visage sur tous les supports et isoler les temoins', 'Neutraliser tous les agents ayant vu son visage sous 30 min'],
    correct: 1,
  },
  {
    question: 'Quelle organisation rivale exploite les anomalies a des fins commerciales ?',
    choices: ['Le Chaos Insurgency', 'Marshall Carter and Dark Ltd', 'La Fondation Prometheus'],
    correct: 1,
  },
  {
    question: 'SCP-3001 decrit un chercheur isole dans un espace sans matiere. Quel est le phenomene principal ?',
    choices: ['La desintegration de la memoire et conscience par isolement total', 'Une boucle temporelle infinie de 3 secondes', 'La fusion progressive avec SCP-106'],
    correct: 0,
  },
  {
    question: 'Le Protocole Ouroboros designe...',
    choices: ['La destruction simultanee de tous les SCP Keter', 'Un scenario impliquant SCP-2399 et SCP-179', 'Le plan urgence de la Fondation en cas de fin du monde imminente'],
    correct: 2,
  },
];

const qcmCooldowns = new Map();
const qcmPassed = new Set();
const qcmSessions = new Map();
const activeSessions = new Map();

const CATEGORIES = {
  medical: {
    label: 'Departement Medical',
    emoji: '🏥',
    color: 0x5865F2,
    postes: ['dirmed'],
  },
  scientifique: {
    label: 'Departement Scientifique',
    emoji: '🔬',
    color: 0x57F287,
    postes: ['dirsci'],
  },
  administratif: {
    label: 'Departement Administratif',
    emoji: '🏢',
    color: 0xFEE75C,
    postes: ['dirint'],
  },
};

const ROLE_IDS = {
  dirmed: process.env.ROLE_DIRMED || '1493253219252441209',
  dirsci: process.env.ROLE_DIRSCI || '1493253219252441209',
  dirint: process.env.ROLE_DIRINT || '1493253219252441209',
};

const RECRUITMENTS = {
  dirmed: {
    label: 'Directeur Medical',
    description: 'Departement Medical',
    color: 0x5865F2,
    questions: [
      'Quelles sont vos motivations ?',
      'Votre pseudo Roblox + ID Roblox',
      'Pourquoi toi et pas un autre pour devenir Directeur Medical ?',
      'Un hopital fait face a une augmentation brutale de cas de Sepsis. Quelle est la priorite absolue ?',
      'Un patient en detresse respiratoire aigue necessite une ventilation. Quelle strategie est recommandee ?',
      'Quel trouble entraine une augmentation des D-dimeres ?',
      'Quel est le traitement immediat d un arret cardiaque ?',
      'Une acidocetose diabetique necessite quel traitement ?',
      'Quel est le principal mode de transmission de la tuberculose ?',
      'Quel signe evoque une hypertension intracranienne ?',
      'En cas de ressources limitees (triage catastrophe), on privilegie quoi ?',
      'Quel est le meilleur moyen de reduire les infections nosocomiales ?',
    ],
  },
  dirsci: {
    label: 'Directeur Scientifique',
    description: 'Departement Scientifique',
    color: 0x57F287,
    questions: [
      'Quelles sont vos motivations ?',
      'Votre pseudo Roblox + ID Roblox',
      'Quelle est la caracteristique essentielle d une hypothese scientifique valide ?',
      'Que signifie une p-value inferieure a 0.05 ?',
      'Quel est le role principal de l ADN ?',
      'Quel est le but d un essai randomise controle ?',
      'Quel biais survient quand on ne publie que les resultats positifs ?',
      'Quelle technique permet d amplifier l ADN ?',
      'Quel test utiliser pour comparer 2 moyennes ?',
      'Quel est le role principal d un Directeur Scientifique ?',
      'Quelle structure permet aux bacteries de resister aux antibiotiques ?',
      'Quel est le niveau de preuve le plus eleve ?',
      'Quel est le plus grand risque en recherche ?',
      'Pourquoi toi et pas un autre pour devenir Directeur Scientifique ?',
    ],
  },
  dirint: {
    label: "Directeur d Installation",
    description: 'Departement Administratif',
    color: 0xFEE75C,
    questions: [
      'Quelles sont vos motivations ?',
      'Votre pseudo Roblox + ID Roblox',
      "Explique ce que represente pour toi le role de Directeur d Installation SCP.",
      'Quelles seraient tes 3 priorites absolues en arrivant sur un site SCP ?',
      'Une breche de confinement se produit avec plusieurs SCP en liberte. Decris chaque etape de ta gestion de crise.',
      'Comment geres-tu un SCP de classe Keter extremement instable ?',
      'Jusqu ou es-tu pret a aller dans les tests sur les SCP ?',
      'Toutes les communications sont coupees, le site est en chaos. Comment reprends-tu le controle ?',
      "Pourquoi toi et pas un autre pour devenir Directeur d Installation SCP ?",
    ],
  },
};

client.once('ready', () => {
  console.log('Bot connecte : ' + client.user.tag);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // !setup-recrutement
  if (message.content === '!setup-recrutement' && message.guild && message.member?.permissions.has('Administrator')) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Recrutements ouverts')
      .setDescription('Clique sur **Postuler** pour choisir un departement.\n\n Tu dois reussir le **/QCM** pour acceder aux recrutements.')
      .setColor(0x5865F2)
      .addFields(Object.values(CATEGORIES).map(cat => ({
        name: cat.emoji + ' ' + cat.label,
        value: cat.postes.map(p => '• ' + RECRUITMENTS[p].label).join('\n'),
        inline: true,
      })))
      .setFooter({ text: 'Tu auras ' + TIMEOUT_SECONDS + 's par question.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_recruitment').setLabel('📝 Postuler').setStyle(ButtonStyle.Primary)
    );
    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }

  // /QCM
  if (message.content.toLowerCase() === '/qcm' && message.guild) {
    const userId = message.author.id;

    if (qcmPassed.has(userId)) {
      return message.reply({ content: '✅ Tu as deja reussi le QCM ! Tu peux postuler librement.' });
    }

    if (qcmCooldowns.has(userId)) {
      const failTime = qcmCooldowns.get(userId);
      const remaining = QCM_COOLDOWN_HOURS * 3600 * 1000 - (Date.now() - failTime);
      if (remaining > 0) {
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        return message.reply({ content: '⏳ Attends encore **' + hours + 'h ' + minutes + 'min** avant de retenter le QCM.' });
      }
      qcmCooldowns.delete(userId);
    }

    if (qcmSessions.has(userId)) {
      return message.reply({ content: '⚠️ Tu as deja un QCM en cours dans tes messages prives !' });
    }

    await message.reply({ content: '📨 Le QCM a ete envoye en message prive !' });
    try {
      const dmChannel = await message.author.createDM();
      qcmSessions.set(userId, { questionIndex: 0, guildId: message.guildId, channelId: message.channelId });
      await sendQcmQuestion(dmChannel, userId);
    } catch {
      qcmSessions.delete(userId);
      await message.reply({ content: '❌ Impossible d envoyer un DM. Active tes messages prives !' });
    }
  }
});

client.on('interactionCreate', async (interaction) => {

  // Reponse QCM (boutons A/B/C)
  if (interaction.isButton() && interaction.customId.startsWith('qcm.')) {
    const parts = interaction.customId.split('.');
    const userId = parts[1];
    const choiceIndex = parseInt(parts[2]);

    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'Ce nest pas ton QCM.', ephemeral: true });
    }

    const session = qcmSessions.get(userId);
    if (!session) return interaction.reply({ content: 'Session QCM introuvable.', ephemeral: true });

    const qIndex = session.questionIndex;
    const question = QCM_QUESTIONS[qIndex];
    const isCorrect = choiceIndex === question.correct;

    if (!isCorrect) {
      qcmSessions.delete(userId);
      qcmCooldowns.set(userId, Date.now());

      // Embed en DM
      const failEmbed = new EmbedBuilder()
        .setTitle('❌ QCM echoue !')
        .setDescription(
          'Mauvaise reponse a la question **' + (qIndex + 1) + '** !\n\n' +
          '❌ Ta reponse : **' + question.choices[choiceIndex] + '**\n' +
          '✅ Bonne reponse : **' + question.choices[question.correct] + '**\n\n' +
          '⏳ Tu pourras retenter dans **' + QCM_COOLDOWN_HOURS + ' heures**.'
        )
        .setColor(0xED4245)
        .setTimestamp();

      await interaction.update({ embeds: [failEmbed], components: [] });

      // Notification dans le canal
      try {
        const guild = await client.guilds.fetch(session.guildId).catch(() => null);
        if (guild) {
          const guildChannel = await guild.channels.fetch(session.channelId).catch(() => null);
          if (guildChannel) {
            const publicEmbed = new EmbedBuilder()
              .setTitle('❌ QCM echoue')
              .setDescription('<@' + userId + '> a echoue au QCM SCP.\n⏳ Il/Elle pourra retenter dans **' + QCM_COOLDOWN_HOURS + ' heures**.')
              .setColor(0xED4245)
              .setTimestamp();
            await guildChannel.send({ embeds: [publicEmbed] });
          }
        }
      } catch {}
      return;
    }

    // Bonne reponse
    session.questionIndex++;

    if (session.questionIndex >= QCM_QUESTIONS.length) {
      qcmSessions.delete(userId);
      qcmPassed.add(userId);

      // Embed en DM
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ QCM reussi !')
        .setDescription(
          '🎉 Felicitations ! Tu as repondu correctement a toutes les questions.\n\n' +
          '🔓 Tu as maintenant acces aux recrutements !\nRetourne sur le serveur et clique sur **Postuler**.'
        )
        .setColor(0x57F287)
        .setTimestamp();

      await interaction.update({ embeds: [successEmbed], components: [] });

      // Notification dans le canal
      try {
        const guild = await client.guilds.fetch(session.guildId).catch(() => null);
        if (guild) {
          const guildChannel = await guild.channels.fetch(session.channelId).catch(() => null);
          if (guildChannel) {
            const publicEmbed = new EmbedBuilder()
              .setTitle('✅ QCM reussi !')
              .setDescription('<@' + userId + '> a reussi le QCM SCP !\n🔓 Il/Elle peut maintenant acceder aux recrutements.')
              .setColor(0x57F287)
              .setTimestamp();
            await guildChannel.send({ embeds: [publicEmbed] });
          }
        }
      } catch {}
      return;
    }

    // Question suivante
    const correctEmbed = new EmbedBuilder()
      .setTitle('✅ Bonne reponse !')
      .setDescription('**' + question.choices[question.correct] + '** — Correct !\n\nQuestion suivante dans un instant...')
      .setColor(0x57F287);

    await interaction.update({ embeds: [correctEmbed], components: [] });
    setTimeout(() => sendQcmQuestion(interaction.channel, userId), 1500);
  }

  // Bouton Postuler
  if (interaction.isButton() && interaction.customId === 'open_recruitment') {
    const userId = interaction.user.id;

    if (!qcmPassed.has(userId)) {
      return interaction.reply({
        content: '🔒 Tu dois reussir le **QCM** avant de postuler ! Utilise `/QCM` sur le serveur.',
        ephemeral: true,
      });
    }

    if (activeSessions.has(userId)) {
      return interaction.reply({ content: '⚠️ Tu as deja une candidature en cours dans tes messages prives !', ephemeral: true });
    }

    const buttons = Object.entries(CATEGORIES).map(([key, cat]) =>
      new ButtonBuilder().setCustomId('cat.' + key).setLabel(cat.emoji + ' ' + cat.label).setStyle(ButtonStyle.Secondary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    await interaction.reply({ content: '👇 Choisis un departement :', components: rows, ephemeral: true });
  }

  // Bouton categorie
  if (interaction.isButton() && interaction.customId.startsWith('cat.')) {
    const catKey = interaction.customId.split('.')[1];
    const category = CATEGORIES[catKey];
    if (!category) return;

    const select = new StringSelectMenuBuilder()
      .setCustomId('choose.' + catKey)
      .setPlaceholder('Choisis un poste...')
      .addOptions(category.postes.map(posteKey => ({
        label: RECRUITMENTS[posteKey].label,
        description: RECRUITMENTS[posteKey].description,
        value: posteKey,
      })));

    await interaction.update({
      content: category.emoji + ' **' + category.label + '** — Choisis un poste :',
      components: [new ActionRowBuilder().addComponents(select)],
    });
  }

  // Select poste
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('choose.')) {
    const key = interaction.values[0];
    const recruitment = RECRUITMENTS[key];

    await interaction.update({ content: '✅ Tu as choisi **' + recruitment.label + '**. Regarde tes messages prives !', components: [] });

    activeSessions.set(interaction.user.id, {
      recruitmentKey: key,
      guildId: interaction.guildId,
      memberTag: interaction.user.tag,
      memberId: interaction.user.id,
      answers: [],
      currentQuestion: 0,
      started: false,
    });

    try {
      const dmChannel = await interaction.user.createDM();
      await sendWelcomeMessage(dmChannel, interaction.user.id);
    } catch {
      activeSessions.delete(interaction.user.id);
      await interaction.followUp({ content: '❌ Impossible d envoyer un DM. Active tes messages prives !', ephemeral: true });
    }
  }

  // Bouton Commencer
  if (interaction.isButton() && interaction.customId.startsWith('start.')) {
    const userId = interaction.customId.split('.')[1];
    const session = activeSessions.get(userId);

    if (interaction.user.id !== userId) return interaction.reply({ content: 'Ce bouton ne t appartient pas.', ephemeral: true });
    if (!session) return interaction.reply({ content: 'Session introuvable. Recommence depuis le serveur.', ephemeral: true });
    if (session.started) return interaction.reply({ content: 'Le questionnaire a deja commence !', ephemeral: true });

    session.started = true;
    await interaction.update({ content: '▶️ **Questionnaire lance ! Bonne chance !**', components: [] });
    await startQuestion(interaction.channel, userId);
  }

  // Bouton Envoyer candidature
  if (interaction.isButton() && interaction.customId.startsWith('submit.')) {
    const userId = interaction.customId.split('.')[1];
    const session = activeSessions.get(userId);
    if (!session) return interaction.reply({ content: 'Session introuvable.', ephemeral: true });

    await sendResults(session);
    activeSessions.delete(userId);
    await interaction.update({ content: '🎉 **Candidature envoyee ! Bonne chance !**', components: [] });
  }

  // Accepter / Refuser
  if (interaction.isButton() && (interaction.customId.startsWith('accept.') || interaction.customId.startsWith('refuse.'))) {
    const parts = interaction.customId.split('.');
    const action = parts[0];
    const userId = parts[1];
    const recruitmentKey = parts[2];
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const isAccepted = action === 'accept';

    const color = isAccepted ? 0x57F287 : 0xED4245;
    const label = isAccepted ? 'ACCEPTE par ' : 'REFUSE par ';

    if (isAccepted && member) {
      const roleId = ROLE_IDS[recruitmentKey];
      if (roleId) await member.roles.add(roleId).catch(err => console.error('Role error:', err.message));
    }

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(color)
      .setFooter({ text: label + interaction.user.tag });

    await interaction.update({ embeds: [updatedEmbed], components: [] });

    try {
      const user = await client.users.fetch(userId);
      await user.send({
        embeds: [new EmbedBuilder()
          .setTitle('Decision sur ta candidature')
          .setDescription(isAccepted
            ? '🎉 Felicitations ! Ta candidature a ete **acceptee**. Bienvenue dans l equipe !'
            : '😔 Ta candidature a ete **refusee**. N hesite pas a repostuler plus tard !'
          )
          .setColor(color)
          .setTimestamp()
        ]
      });
    } catch {
      await interaction.followUp({ content: 'Impossible d envoyer un DM a <@' + userId + '>.', ephemeral: true });
    }
  }
});

// DM recrutement
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.guild) return;
  const session = activeSessions.get(message.author.id);
  if (!session || !session.started) return;

  const recruitment = RECRUITMENTS[session.recruitmentKey];
  session.answers.push(message.content);
  session.currentQuestion++;

  if (session.currentQuestion < recruitment.questions.length) {
    await startQuestion(message.channel, message.author.id);
  } else {
    await showSummary(message.channel, message.author.id);
  }
});

async function sendQcmQuestion(dmChannel, userId) {
  const session = qcmSessions.get(userId);
  if (!session) return;

  const qIndex = session.questionIndex;
  const q = QCM_QUESTIONS[qIndex];
  const total = QCM_QUESTIONS.length;
  const labels = ['A', 'B', 'C'];

  const embed = new EmbedBuilder()
    .setTitle('🧠 QCM SCP — Question ' + (qIndex + 1) + '/' + total)
    .setDescription(
      '**' + q.question + '**\n\n' +
      q.choices.map((c, i) => '**' + labels[i] + ')** ' + c).join('\n')
    )
    .setColor(0x5865F2)
    .setFooter({ text: 'Une seule mauvaise reponse = QCM echoue. Reflechis bien !' });

  const row = new ActionRowBuilder().addComponents(
    q.choices.map((choice, i) =>
      new ButtonBuilder()
        .setCustomId('qcm.' + userId + '.' + i)
        .setLabel(labels[i] + ') ' + (choice.length > 60 ? choice.substring(0, 57) + '...' : choice))
        .setStyle(ButtonStyle.Secondary)
    )
  );

  await dmChannel.send({ embeds: [embed], components: [row] });
}

async function sendWelcomeMessage(dmChannel, userId) {
  const session = activeSessions.get(userId);
  const recruitment = RECRUITMENTS[session.recruitmentKey];

  const embed = new EmbedBuilder()
    .setTitle('📋 Candidature — ' + recruitment.label)
    .setDescription(
      'Bienvenue dans le questionnaire de recrutement !\n\n' +
      'Poste : **' + recruitment.label + '**\n' +
      'Questions : **' + recruitment.questions.length + '**\n' +
      'Temps par question : **' + TIMEOUT_SECONDS + ' secondes**\n\n' +
      'Clique sur le bouton quand tu es pret(e).\n' +
      'Le chronometre demarre des la premiere question !'
    )
    .setColor(recruitment.color)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('start.' + userId).setLabel('▶️ Commencer le questionnaire').setStyle(ButtonStyle.Success)
  );

  await dmChannel.send({ embeds: [embed], components: [row] });
}

async function startQuestion(dmChannel, userId) {
  const session = activeSessions.get(userId);
  const recruitment = RECRUITMENTS[session.recruitmentKey];
  const qIndex = session.currentQuestion;
  const total = recruitment.questions.length;

  const embed = new EmbedBuilder()
    .setTitle(recruitment.label + ' — Question ' + (qIndex + 1) + '/' + total)
    .setDescription('❓ **' + recruitment.questions[qIndex] + '**')
    .setColor(recruitment.color)
    .setFooter({ text: 'Tu as ' + TIMEOUT_SECONDS + ' secondes pour repondre.' });

  await dmChannel.send({ embeds: [embed] });

  const countdownMsg = await dmChannel.send('⏳ **' + TIMEOUT_SECONDS + 's** restantes...');
  let remaining = TIMEOUT_SECONDS - 10;

  const countdownInterval = setInterval(async () => {
    if (remaining <= 0) return;
    await countdownMsg.edit('⏳ **' + remaining + 's** restantes...').catch(() => {});
    remaining -= 10;
  }, 10000);

  const collector = dmChannel.createMessageCollector({ filter: (m) => m.author.id === userId, max: 1, time: TIMEOUT_SECONDS * 1000 });

  collector.on('collect', () => {
    clearInterval(countdownInterval);
    countdownMsg.edit('✅ Reponse enregistree !').catch(() => {});
  });

  collector.on('end', async (collected) => {
    clearInterval(countdownInterval);
    if (collected.size === 0) {
      await countdownMsg.edit('⌛ Temps ecoule !').catch(() => {});
      const s = activeSessions.get(userId);
      if (s) {
        s.answers.push('(Pas de reponse)');
        s.currentQuestion++;
        if (s.currentQuestion < RECRUITMENTS[s.recruitmentKey].questions.length) {
          await startQuestion(dmChannel, userId);
        } else {
          await showSummary(dmChannel, userId);
        }
      }
    }
  });
}

async function showSummary(dmChannel, userId) {
  const session = activeSessions.get(userId);
  const recruitment = RECRUITMENTS[session.recruitmentKey];

  const embed = new EmbedBuilder()
    .setTitle('📋 Resume de ta candidature')
    .setDescription('Voici tes reponses pour **' + recruitment.label + '**. Verifie avant d envoyer !')
    .setColor(recruitment.color)
    .addFields(recruitment.questions.map((q, i) => ({ name: 'Q' + (i + 1) + ': ' + q, value: session.answers[i] || '(sans reponse)' })))
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('submit.' + userId).setLabel('📨 Envoyer ma candidature').setStyle(ButtonStyle.Success)
  );

  await dmChannel.send({ embeds: [embed], components: [row] });
}

async function sendResults(session) {
  const guild = await client.guilds.fetch(session.guildId).catch(() => null);
  if (!guild) return;

  const channel = await guild.channels.fetch(RESULTS_CHANNEL_ID).catch(() => null);
  if (!channel) { console.error('Salon resultats introuvable.'); return; }

  const recruitment = RECRUITMENTS[session.recruitmentKey];

  const embed = new EmbedBuilder()
    .setTitle('📥 Nouvelle candidature — ' + recruitment.label)
    .setDescription('Candidat : <@' + session.memberId + '> (' + session.memberTag + ')')
    .setColor(recruitment.color)
    .addFields(recruitment.questions.map((q, i) => ({ name: 'Q' + (i + 1) + ': ' + q, value: session.answers[i] || '(sans reponse)' })))
    .setTimestamp()
    .setFooter({ text: 'En attente de decision' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('accept.' + session.memberId + '.' + session.recruitmentKey).setLabel('✅ Accepter').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('refuse.' + session.memberId + '.' + session.recruitmentKey).setLabel('❌ Refuser').setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

client.login(process.env.DISCORD_TOKEN);
