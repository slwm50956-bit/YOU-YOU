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
const TOTAL_BOXES = 25;

// كل قناة عندها لعبة نشطة
const games = new Map();

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
    activePlayers: new Set(),// لاعبين لسا موجودين
    boxes: new Map(),        // boxNumber -> Set(userIds)
    exploded: new Set(),     // المربعات المفجّرة
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

    // تحديث البانل
    const updated = EmbedBuilder.from(embed).setDescription(
      `اضغط الزر للانضمام!\n` +
      `⏳ عندك **30 ثانية**\n` +
      `👥 عدد اللاعبين: **${game.players.size}**`
    );
    panel.edit({ embeds: [updated] }).catch(() => {});
  });

  joinCollector.on('end', async () => {
    // إغلاق الزر
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
    `كل لاعب رح يستلم قائمة سرية لاختيار مخبأه من **1 إلى 25**.\n` +
    `⏳ عندكم **60 ثانية**.`
  );

  // خيارات المربعات
  const options = [];
  for (let i = 1; i <= TOTAL_BOXES; i++) {
    options.push({ label: `مربع ${i}`, value: `${i}`, emoji: '📦' });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('pick_box')
    .setPlaceholder('اختر مخبأك...')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  // نرسل رسالة لكل لاعب
  const pickMessages = new Map();

  for (const [userId, data] of game.players) {
    try {
      const user = await client.users.fetch(userId);
      const msg = await user.send({
        content: '🙈 **اختر مخبأك بسرعة!** محد رح يشوف اختيارك.',
        components: [row],
      });
      pickMessages.set(userId, msg);
    } catch {
      // ما قدرنا نرسل DM
      channel.send(`⚠️ <@${userId}> ما قدرت أرسلك رسالة خاصة، افتح الـ DM.`);
    }
  }

  // نجمع الاختيارات من كل لاعب عبر collector لكل DM
  const pickPromises = [];

  for (const [userId, msg] of pickMessages) {
    const p = new Promise((resolve) => {
      const c = msg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: PICK_TIME,
        max: 1,
      });

      c.on('collect', async (i) => {
        const boxNum = parseInt(i.values[0]);
        const player = game.players.get(i.user.id);
        if (!player) return;

        player.box = boxNum;

        if (!game.boxes.has(boxNum)) game.boxes.set(boxNum, new Set());
        game.boxes.get(boxNum).add(i.user.id);

        await i.update({
          content: `✅ اخترت **المربع ${boxNum}**. استنى بداية التفجير! 💥`,
          components: [],
        });
        resolve();
      });

      c.on('end', (collected) => {
        if (collected.size === 0) {
          // ما اختار — نعطيه مربع عشوائي
          const boxNum = Math.floor(Math.random() * TOTAL_BOXES) + 1;
          const player = game.players.get(userId);
          if (player) {
            player.box = boxNum;
            if (!game.boxes.has(boxNum)) game.boxes.set(boxNum, new Set());
            game.boxes.get(boxNum).add(userId);
          }
          msg.edit({ content: `⏰ ما اخترت، عطيناك **المربع ${boxNum}** عشوائي.`, components: [] }).catch(() => {});
          resolve();
        }
      });
    });
    pickPromises.push(p);
  }

  await Promise.all(pickPromises);

  // نتحقق كم لاعب فعلياً اختار
  const pickedPlayers = [...game.players.values()].filter(p => p.box !== null);
  if (pickedPlayers.length < 2) {
    await channel.send('❌ ما فيه لاعبين كفاية اختاروا. ألغيت اللعبة.');
    games.delete(channel.id);
    return;
  }

  await startBombPhase(channel, game);
}

// ==================== مرحلة التفجير ====================
async function startBombPhase(channel, game) {
  game.phase = 'bombing';

  await channel.send('💥 **بدأت مرحلة التفجير!**');

  let round = 0;

  while (game.activePlayers.size > 1) {
    round++;
    await sleep(4000); // كل 4 ثواني جولة

    // 1) البوت يختار لاعب عشوائي من الأحياء
    const aliveList = [...game.activePlayers];
    const chosenPlayerId = aliveList[Math.floor(Math.random() * aliveList.length)];
    const chosenPlayer = game.players.get(chosenPlayerId);

    // 2) هذا اللاعب يختار مربع يفجّره
    // نجيب المربعات المتاحة (غير مفجّرة)
    const availableBoxes = [];
    for (let i = 1; i <= TOTAL_BOXES; i++) {
      if (!game.exploded.has(i)) availableBoxes.push(i);
    }

    if (availableBoxes.length === 0) {
      // ما بقي مربعات؟ نوقف
      break;
    }

    // نطلب من اللاعب يختار مربع عبر DM
    const boxToExplode = await askPlayerToExplode(chosenPlayer, availableBoxes);

    if (boxToExplode === null) {
      // ما رد — البوت يختار عشوائي
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

async function askPlayerToExplode(player, availableBoxes) {
  try {
    const options = availableBoxes.slice(0, 25).map(b => ({
      label: `مربع ${b}`,
      value: `${b}`,
      emoji: '💣',
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId('explode_box')
      .setPlaceholder('اختر مربع لتفجيره!')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    const msg = await player.user.send({
      content: `💥 **دورك!** اختر مربع لتفجيره (عندك 15 ثانية)`,
      components: [row],
    });

    return await new Promise((resolve) => {
      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 15_000,
        max: 1,
      });

      collector.on('collect', async (i) => {
        const box = parseInt(i.values[0]);
        await i.update({ content: `💥 فجّرت **المربع ${box}**!`, components: [] });
        resolve(box);
      });

      collector.on('end', (c) => {
        if (c.size === 0) {
          msg.edit({ content: '⏰ انتهى وقتك!', components: [] }).catch(() => {});
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

async function explodeBox(channel, game, boxNum) {
  game.exploded.add(boxNum);
  const victims = game.boxes.get(boxNum);

  if (!victims || victims.size === 0) {
    await channel.send(`💨 المربع **${boxNum}** كان فاضي! محد كان فيه.`);
    return;
  }

  // فلترة الأحياء فقط
  const aliveVictims = [...victims].filter(id => game.activePlayers.has(id));

  if (aliveVictims.length === 0) {
    await channel.send(`💨 المربع **${boxNum}** كان فاضي! محد كان فيه.`);
    return;
  }

  // نطردهم
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
