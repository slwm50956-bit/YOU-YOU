const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = '!';
const JOIN_TIME = 30_000;      // 30 ثانية للتسجيل
const PICK_TIME = 60_000;      // 60 ثانية لاختيار المخبأ
const EXPLODE_TIME = 20_000;   // 20 ثانية لكل لاعب يفجّر
const TOTAL_BOXES = 25;

const games = new Map(); // channelId -> game

client.once('ready', () => {
  console.log(`✅ البوت شغال: ${client.user.tag}`);
  client.user.setActivity('🎮 !غميضة', { type: 0 });
});

// ==================== الأوامر ====================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'غميضة' || cmd === 'ghomeda') {
    if (games.has(message.channel.id)) {
      return message.reply('❌ في لعبة شغالة بهذي القناة!');
    }
    startGame(message);
  }

  if (cmd === 'help') {
    message.reply('🎮 **الأوامر:**\n`!غميضة` - ابدأ لعبة الغميضة');
  }
});

// ==================== بدء اللعبة ====================
async function startGame(message) {
  const channel = message.channel;

  const game = {
    host: message.author.id,
    players: new Map(),      // userId -> { user, box }
    activePlayers: new Set(),
    boxes: new Map(),        // boxNumber -> Set(userIds)
    exploded: new Set(),
    phase: 'joining',
  };
  games.set(channel.id, game);

  const embed = new EmbedBuilder()
    .setTitle('🙈 لعبة الغميضة')
    .setDescription(
      `اضغط الزر للانضمام!\n` +
      `⏳ عندك **30 ثانية**\n` +
      `👥 عدد اللاعبين: **0**`
    )
    .setColor(0x5865F2);

  const joinBtn = new ButtonBuilder()
    .setCustomId('join_ghomeda')
    .setLabel('🎮 انضم للعبة')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(joinBtn);

  const panel = await channel.send({ embeds: [embed], components: [row] });

  // ============ استقبال الانضمام ============
  const joinCollector = panel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: JOIN_TIME,
  });

  joinCollector.on('collect', async (i) => {
    if (i.customId !== 'join_ghomeda') return;

    if (game.players.has(i.user.id)) {
      return i.reply({ content: '⚠️ انت مسجل بالفعل!', ephemeral: true });
    }

    game.players.set(i.user.id, { user: i.user, box: null });
    game.activePlayers.add(i.user.id);

    await i.reply({ content: '✅ انضممت للعبة!', ephemeral: true });

    const updated = EmbedBuilder.from(embed).setDescription(
      `اضغط الزر للانضمام!\n` +
      `⏳ عندك **30 ثانية**\n` +
      `👥 عدد اللاعبين: **${game.players.size}**`
    );
    panel.edit({ embeds: [updated] }).catch(() => {});
  });

  joinCollector.on('end', async () => {
    const disabledBtn = ButtonBuilder.from(joinBtn).setDisabled(true);
    await panel.edit({
      components: [new ActionRowBuilder().addComponents(disabledBtn)],
    }).catch(() => {});

    if (game.players.size < 2) {
      await channel.send('❌ ما فيه لاعبين كفاية (لازم 2 على الأقل).');
      games.delete(channel.id);
      return;
    }

    await startPickPhase(channel, game);
  });
}

// ==================== مرحلة اختيار المخبأ ====================
async function startPickPhase(channel, game) {
  game.phase = 'picking';

  await channel.send(
    `📍 **مرحلة الاختيار!**\n` +
    `رح تطلع لكل لاعب قائمة سرية لاختيار مخبأه من **1 إلى 25**.\n` +
    `⏳ عندكم **60 ثانية**.`
  );

  // نبني القائمة مرة وحدة
  const buildOptions = () => {
    const options = [];
    for (let i = 1; i <= TOTAL_BOXES; i++) {
      options.push({ label: `مربع ${i}`, value: `${i}`, emoji: '📦' });
    }
    return options;
  };

  // رسالة عامة فيها الزر
  const pickBtn = new ButtonBuilder()
    .setCustomId('pick_box_btn')
    .setLabel('📍 اختر مخبأك')
    .setStyle(ButtonStyle.Primary);

  const pickRow = new ActionRowBuilder().addComponents(pickBtn);

  const pickPanel = await channel.send({
    content: '**اضغط الزر لاختيار مخبأك (سري):**',
    components: [pickRow],
  });

  // collector للزر
  const btnCollector = pickPanel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: PICK_TIME,
  });

  // كل لاعب يختار مرة وحدة
  const picked = new Set();

  btnCollector.on('collect', async (i) => {
    if (i.customId !== 'pick_box_btn') return;

    const player = game.players.get(i.user.id);
    if (!player) {
      return i.reply({ content: '❌ انت مو مسجل باللعبة!', ephemeral: true });
    }

    if (picked.has(i.user.id)) {
      return i.reply({ content: `⚠️ انت اخترت **المربع ${player.box}** بالفعل!`, ephemeral: true });
    }

    // نطلع له Select Menu سري
    const select = new StringSelectMenuBuilder()
      .setCustomId(`pick_box_${i.user.id}`)
      .setPlaceholder('اختر مخبأك...')
      .addOptions(buildOptions());

    const row = new ActionRowBuilder().addComponents(select);

    await i.reply({
      content: '🙈 **اختر مخبأك بسرعة!** محد رح يشوف اختيارك:',
      components: [row],
      ephemeral: true,
    });
  });

  // نستقبل اختيارات كل لاعب عبر تفاعلات ephemeral
  client.on('interactionCreate', async function pickHandler(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('pick_box_')) return;

    const userId = interaction.customId.replace('pick_box_', '');
    if (interaction.user.id !== userId) return;

    const gameCheck = games.get(interaction.channelId || interaction.message?.channelId);
    const currentGame = games.get(channel.id);
    if (!currentGame || currentGame.phase !== 'picking') return;

    const player = currentGame.players.get(userId);
    if (!player) return;

    if (player.box !== null) {
      return interaction.update({
        content: `⚠️ اخترت **المربع ${player.box}** بالفعل!`,
        components: [],
      });
    }

    const boxNum = parseInt(interaction.values[0]);
    player.box = boxNum;
    picked.add(userId);

    if (!currentGame.boxes.has(boxNum)) currentGame.boxes.set(boxNum, new Set());
    currentGame.boxes.get(boxNum).add(userId);

    await interaction.update({
      content: `✅ اخترت **المربع ${boxNum}**. استنى بداية التفجير! 💥`,
      components: [],
    });
  });

  // استنى انتهاء الوقت
  await new Promise((resolve) => {
    btnCollector.on('end', resolve);
  });

  // إغلاق الزر
  const disabledPick = ButtonBuilder.from(pickBtn).setDisabled(true);
  await pickPanel.edit({
    components: [new ActionRowBuilder().addComponents(disabledPick)],
  }).catch(() => {});

  // اللي ما اختار → مربع عشوائي
  for (const [userId, player] of game.players) {
    if (player.box === null) {
      const boxNum = Math.floor(Math.random() * TOTAL_BOXES) + 1;
      player.box = boxNum;
      if (!game.boxes.has(boxNum)) game.boxes.set(boxNum, new Set());
      game.boxes.get(boxNum).add(userId);
      await channel.send(`⏰ <@${userId}> ما اختار، عطيناه **المربع ${boxNum}** عشوائي.`).catch(() => {});
    }
  }

  await startBombPhase(channel, game);
}

// ==================== مرحلة التفجير ====================
async function startBombPhase(channel, game) {
  game.phase = 'bombing';

  await channel.send('💥 **بدأت مرحلة التفجير!**');

  while (game.activePlayers.size > 1) {
    await sleep(3000);

    // 1) البوت يختار لاعب عشوائي حي
    const aliveList = [...game.activePlayers];
    const chosenPlayerId = aliveList[Math.floor(Math.random() * aliveList.length)];

    // 2) المربعات المتبقية
    const availableBoxes = [];
    for (let i = 1; i <= TOTAL_BOXES; i++) {
      if (!game.exploded.has(i)) availableBoxes.push(i);
    }

    if (availableBoxes.length === 0) break;

    // 3) نطلب من اللاعب يختار مربع
    const boxToExplode = await askPlayerToExplode(channel, game, chosenPlayerId, availableBoxes);

    if (boxToExplode === null) {
      const randomBox = availableBoxes[Math.floor(Math.random() * availableBoxes.length)];
      await channel.send(
        `💣 <@${chosenPlayerId}> ما اختار، البوت فجّر **المربع ${randomBox}** بالنيابة عنه!`
      );
      await explodeBox(channel, game, randomBox);
    } else {
      await channel.send(
        `💣 <@${chosenPlayerId}> اختار يفجّر **المربع ${boxToExplode}**!`
      );
      await explodeBox(channel, game, boxToExplode);
    }

    await sleep(1500);
  }

  await endGame(channel, game);
}

// ==================== طلب من اللاعب يفجّر ====================
async function askPlayerToExplode(channel, game, playerId, availableBoxes) {
  const player = game.players.get(playerId);
  if (!player) return null;

  const options = availableBoxes.map(b => ({
    label: `مربع ${b}`,
    value: `${b}`,
    emoji: '💣',
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`explode_${playerId}`)
    .setPlaceholder('اختر مربع لتفجيره!')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  await channel.send({
    content: `💥 <@${playerId}> **دورك!** اختر مربع لتفجيره (عندك 20 ثانية):`,
    components: [row],
  });

  // نستنى اختياره عبر interactionCreate
  return await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      client.removeListener('interactionCreate', handler);
      resolve(null);
    }, EXPLODE_TIME);

    const handler = async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.customId !== `explode_${playerId}`) return;
      if (interaction.user.id !== playerId) {
        return interaction.reply({ content: '❌ هذا مو دورك!', ephemeral: true });
      }

      clearTimeout(timeout);
      client.removeListener('interactionCreate', handler);

      const box = parseInt(interaction.values[0]);
      await interaction.update({
        content: `💥 فجّرت **المربع ${box}**!`,
        components: [],
      });
      resolve(box);
    };

    client.on('interactionCreate', handler);
  });
}

// ==================== تفجير مربع ====================
async function explodeBox(channel, game, boxNum) {
  game.exploded.add(boxNum);
  const victims = game.boxes.get(boxNum);

  if (!victims || victims.size === 0) {
    await channel.send(`💨 المربع **${boxNum}** كان فاضي! محد كان فيه.`);
    return;
  }

  const aliveVictims = [...victims].filter(id => game.activePlayers.has(id));

  if (aliveVictims.length === 0) {
    await channel.send(`💨 المربع **${boxNum}** كان فاضي! محد كان فيه.`);
    return;
  }

  for (const id of aliveVictims) {
    game.activePlayers.delete(id);
  }

  const mentions = aliveVictims.map(id => `<@${id}>`).join(', ');
  await channel.send(
    `🔥 **انفجر المربع ${boxNum}!**\n` +
    `خرج من اللعبة: ${mentions}\n` +
    `👥 المتبقي: **${game.activePlayers.size}**`
  );
}

// ==================== نهاية اللعبة ====================
async function endGame(channel, game) {
  const winnerId = [...game.activePlayers][0];
  const winner = game.players.get(winnerId);

  const embed = new EmbedBuilder()
    .setTitle('🏆 انتهت اللعبة!')
    .setColor(0xFFD700)
    .setDescription(
      winner
        ? `🎉 الفائز هو <@${winnerId}>!\nكان مختبئ في **المربع ${winner.box}** 🤫`
        : 'ما فيه فائز 🤷'
    );

  await channel.send({ embeds: [embed] });
  games.delete(channel.id);
}

// ==================== أدوات ====================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ==================== تسجيل الدخول ====================
client.login(process.env.DISCORD_TOKEN);
