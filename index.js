// ============================================================
// KINGDOM BOT — ROYAL CRIMSON EDITION v3 + VOICE MASTER
// Discord.js v14 • MongoDB • CommonJS
// ============================================================

const {
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  PermissionsBitField, ChannelType, ModalBuilder,
  TextInputBuilder, TextInputStyle, ActivityType, Partials
} = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('✅ البوت يعمل'));
app.listen(port, () => console.log(`🌐 خادم الويب على المنفذ ${port}`));

const TOKEN = process.env.DISCORD_TOKEN;
const MONGO_URL = process.env.MONGO_URL;
const OWNER_ID = process.env.OWNER_ID || null;

if (!TOKEN) {
  console.error('❌ تأكد من وجود DISCORD_TOKEN.');
  process.exit(1);
}
if (!MONGO_URL) {
  console.error('❌ تأكد من وجود MONGO_URL.');
  process.exit(1);
}

// ============================================================
// ========== الهوية البصرية ==========
// ============================================================

const THEME = {
  BLACK: 0x0a0a0f,
  DARK: 0x14141a,
  ORANGE: 0x8b0000,
  ORANGE_LIGHT: 0xb01030,
  ORANGE_DARK: 0x5c0000,
  ORANGE_HEX: '#8b0000',
  BLACK_HEX: '#0a0a0f',
  DARK_HEX: '#14141a',
  SUCCESS: 0xb8860b,
  ERROR: 0xc41e3a,
  WARN: 0xffb000,
  GOLD: 0xd4af37,
  GOLD_DARK: 0xb8860b,
  CREAM: 0xf5e6d3,
  PLATINUM: 0xe5e4e2,
};

try {
  // GlobalFonts.registerFromPath('./fonts/NotoNaskhArabic-Bold.ttf', 'NotoArabic');
} catch (e) {}
const ARABIC_FONT = 'NotoArabic, Arial, sans-serif';

mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ اتصال MongoDB ناجح'))
  .catch(err => {
    console.error('❌ فشل اتصال MongoDB:', err);
    process.exit(1);
  });

// ============================================================
// ========== نماذج MongoDB ==========
// ============================================================

const ConfigSchema = new mongoose.Schema({
  guildId: { type: String, unique: true, required: true },
  serverName: { type: String, default: null },
  logChannel: String,
  welcomeChannel: String,
  welcomeMessage: { type: String, default: 'أهلاً بك في السيرفر! 🎉' },
  welcomeTitle: { type: String, default: '👑 مرحباً بك' },
  welcomeImage: String,
  welcomeBackground: String,
  muteRole: String,
  joinRole: String,
  ticketPanelImage: String,
  rolesImage: String,
  rolesPanelText: String,
  bannerImage: String,
  generalImage: String,
  levelChannelId: String,
  ticketRatingEnabled: { type: Boolean, default: true },
  ticketRatingChannel: String,
  ticketLogChannel: String,
  pigeonChannel: String,
  pigeonTitle: { type: String, default: '🕊️ الحمام الزاجل' },
  pigeonDescription: { type: String, default: 'لإرسال رسالة خاصة عبر الحمام الزاجل، اضغط على الزر أدناه.' },
  pigeonImage: String,
  applyPanelTitle: { type: String, default: '📋 التقديمات الإدارية' },
  applyPanelDescription: { type: String, default: 'اختر القسم الذي ترغب بالتقديم عليه من القائمة المنسدلة أدناه.' },
  applyPanelImage: String,
  applyPanelChannel: String,
  applyResultLog: String,

  // ========== الحماية العامة ==========
  protectionEnabled: { type: Boolean, default: false },
  antiSpamEnabled: { type: Boolean, default: false },
  antiSpamMax: { type: Number, default: 5 },
  antiSpamSeconds: { type: Number, default: 5 },
  antiLinkEnabled: { type: Boolean, default: false },
  antiEveryoneEnabled: { type: Boolean, default: false },

  protectionActionSpam: { type: String, enum: ['delete', 'delete_warn', 'delete_mute', 'delete_warn_mute'], default: 'delete_warn' },
  protectionTimeoutSpam: { type: Number, default: 10 },

  protectionActionLink: { type: String, enum: ['delete', 'delete_warn', 'delete_mute', 'delete_warn_mute'], default: 'delete_warn' },
  protectionTimeoutLink: { type: Number, default: 10 },

  protectionActionEveryone: { type: String, enum: ['delete', 'delete_warn', 'delete_mute', 'delete_warn_mute'], default: 'delete_warn' },
  protectionTimeoutEveryone: { type: Number, default: 10 },

  protectionActionWord: { type: String, enum: ['delete', 'delete_warn', 'delete_mute', 'delete_warn_mute'], default: 'delete_warn' },
  protectionTimeoutWord: { type: Number, default: 10 },

  protectionAction: { type: String, enum: ['delete', 'delete_warn', 'delete_mute', 'delete_warn_mute'], default: 'delete_warn' },

  protectionBypassRoles: [String],
  suggestionsChannel: String,

  // ✅ Voice Master
  voiceCreatorChannelId: { type: String, default: null },
  voiceCategoryId: { type: String, default: null },
  voicePanelChannelId: { type: String, default: null },
  voicePanelImage: { type: String, default: null },
  voicePanelTitle: { type: String, default: '🎙️' },
}, { timestamps: true });
const Config = mongoose.model('Config', ConfigSchema);

const BannedWordSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  word: { type: String, required: true },
  addedBy: String,
  createdAt: { type: Date, default: Date.now },
});
BannedWordSchema.index({ guildId: 1, word: 1 }, { unique: true });
const BannedWord = mongoose.model('BannedWord', BannedWordSchema);

const UserSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
}, { timestamps: true });
UserSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const User = mongoose.model('User', UserSchema);

const WarnSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  reason: String,
  moderator: String,
  date: { type: Date, default: Date.now },
});
const Warn = mongoose.model('Warn', WarnSchema);

const TicketSettingsSchema = new mongoose.Schema({
  guildId: { type: String, unique: true, required: true },
  sections: [{
    name: String,
    roleId: String,
    emoji: { type: String, default: '📌' },
  }],
  panelTitle: { type: String, default: '🎫 مركز الدعم' },
  text: { type: String, default: 'مرحباً بكم في مركز الدعم، لفتح تذكرة اختر القسم من القائمة أدناه.' },
  image: { type: String, default: null },
  categoryId: { type: String, default: null },
});
const TicketSettings = mongoose.model('TicketSettings', TicketSettingsSchema);

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  sectionName: String,
  claimedBy: String,
  claimedAt: Date,
  addedMembers: [String],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  closed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Ticket = mongoose.model('Ticket', TicketSchema);

const TicketRatingSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  closedBy: String,
  section: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  ticketId: String,
  createdAt: { type: Date, default: Date.now },
});
TicketRatingSchema.index({ guildId: 1, ticketId: 1 }, { unique: true });
const TicketRating = mongoose.model('TicketRating', TicketRatingSchema);

const SelfRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roleId: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  emoji: { type: String, default: '🎭' },
  image: { type: String, default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });
SelfRoleSchema.index({ guildId: 1, roleId: 1 }, { unique: true });
const SelfRole = mongoose.model('SelfRole', SelfRoleSchema);

const AutoLineSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  text: String,
  image: String,
  enabled: { type: Boolean, default: false },
});
AutoLineSchema.index({ guildId: 1, channelId: 1 }, { unique: true });
const AutoLine = mongoose.model('AutoLine', AutoLineSchema);

const AutoReplySchema = new mongoose.Schema({
  guildId: String,
  keyword: String,
  reply: String,
  image: String,
});
AutoReplySchema.index({ guildId: 1, keyword: 1 }, { unique: true });
const AutoReply = mongoose.model('AutoReply', AutoReplySchema);

const LevelRoleSchema = new mongoose.Schema({
  guildId: String,
  level: Number,
  roleId: String,
});
LevelRoleSchema.index({ guildId: 1, level: 1 }, { unique: true });
const LevelRole = mongoose.model('LevelRole', LevelRoleSchema);

const ControllerSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
});
ControllerSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const Controller = mongoose.model('Controller', ControllerSchema);

const NameCooldownSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  timestamp: { type: Date, default: Date.now },
});
const NameCooldown = mongoose.model('NameCooldown', NameCooldownSchema);

const PigeonSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  messageId: { type: String },
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
});
PigeonSchema.index({ guildId: 1, createdAt: -1 });
const Pigeon = mongoose.model('Pigeon', PigeonSchema);

const ApplicationSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  answers: [{
    question: String,
    answer: String,
  }],
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  reviewedBy: String,
  reviewedAt: Date,
  messageId: String,
  createdAt: { type: Date, default: Date.now },
});
ApplicationSchema.index({ guildId: 1, userId: 1, type: 1, createdAt: -1 });
const Application = mongoose.model('Application', ApplicationSchema);

const ApplySectionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '📋' },
  image: { type: String, default: null },
  roleId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  questions: [{
    label: { type: String, required: true },
    style: { type: String, enum: ['SHORT', 'PARAGRAPH'], default: 'SHORT' },
    required: { type: Boolean, default: true },
  }],
  order: { type: Number, default: 0 },
}, { timestamps: true });
ApplySectionSchema.index({ guildId: 1, name: 1 }, { unique: true });
const ApplySection = mongoose.model('ApplySection', ApplySectionSchema);

const SpamTrackerSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  messages: [{ content: String, timestamp: Date }],
}, { timestamps: true });
SpamTrackerSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const SpamTracker = mongoose.model('SpamTracker', SpamTrackerSchema);

const SuggestionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  messageId: String,
  threadId: String,
  yesCount: { type: Number, default: 0 },
  noCount: { type: Number, default: 0 },
  yesUsers: [String],
  noUsers: [String],
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
SuggestionSchema.index({ guildId: 1, createdAt: -1 });
const Suggestion = mongoose.model('Suggestion', SuggestionSchema);

const VoiceRoomSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  panelMessageId: { type: String, default: null },
  panelChannelId: { type: String, default: null },
  locked: { type: Boolean, default: false },
  userLimit: { type: Number, default: 0 },
  trustedUsers: { type: [String], default: [] },
  blockedUsers: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});
VoiceRoomSchema.index({ guildId: 1, channelId: 1 }, { unique: true });
VoiceRoomSchema.index({ guildId: 1, ownerId: 1 });
const VoiceRoom = mongoose.model('VoiceRoom', VoiceRoomSchema);

// ============================================================
// ========== دوال مساعدة ==========
// ============================================================

async function getGuildConfig(guildId) {
  let config = await Config.findOne({ guildId });
  if (!config) {
    config = new Config({ guildId });
    await config.save();
  }
  return config;
}

async function updateGuildConfig(guildId, data) {
  await Config.findOneAndUpdate({ guildId }, data, { upsert: true, new: true });
}

function getServerBrand(config, guild) {
  return config?.serverName || guild?.name || 'Server';
}

async function getUserData(guildId, userId) {
  let data = await User.findOne({ guildId, userId });
  if (!data) {
    data = new User({ guildId, userId });
    await data.save();
  }
  return data;
}

async function getTicketSettings(guildId) {
  let settings = await TicketSettings.findOne({ guildId });
  if (!settings) {
    settings = new TicketSettings({ guildId });
    await settings.save();
  }
  return settings;
}

async function saveTicketSettings(guildId, data) {
  await TicketSettings.findOneAndUpdate({ guildId }, {
    sections: data.sections,
    panelTitle: data.panelTitle,
    text: data.text,
    image: data.image,
    categoryId: data.categoryId || null,
  }, { upsert: true });
}

async function getTicketByChannel(guildId, channelId) {
  return await Ticket.findOne({ guildId, channelId });
}

async function setAutoLine(guildId, channelId, data) {
  await AutoLine.findOneAndUpdate({ guildId, channelId }, data, { upsert: true });
}

async function deleteAutoLine(guildId, channelId) {
  await AutoLine.deleteOne({ guildId, channelId });
}

async function getAutoReplies(guildId) {
  return await AutoReply.find({ guildId });
}

async function addAutoReply(guildId, keyword, reply, image = null) {
  const existing = await AutoReply.findOne({ guildId, keyword: { $regex: new RegExp(`^${keyword}$`, 'i') } });
  if (existing) {
    existing.reply = reply;
    existing.image = image;
    await existing.save();
    return false;
  }
  const newReply = new AutoReply({ guildId, keyword, reply, image });
  await newReply.save();
  return true;
}

async function removeAutoReply(guildId, keyword) {
  const result = await AutoReply.deleteOne({ guildId, keyword: { $regex: new RegExp(`^${keyword}$`, 'i') } });
  return result.deletedCount > 0;
}

async function findAutoReply(guildId, content) {
  const replies = await AutoReply.find({ guildId });
  return replies.find(r => content.toLowerCase().includes(r.keyword.toLowerCase()));
}

async function addWarn(guildId, userId, reason, moderator) {
  const warn = new Warn({ guildId, userId, reason, moderator });
  await warn.save();
  return await Warn.countDocuments({ guildId, userId });
}

async function clearWarns(guildId, userId) {
  await Warn.deleteMany({ guildId, userId });
}

async function isController(userId, guildId) {
  if (OWNER_ID && userId === OWNER_ID) return true;
  const c = await Controller.findOne({ guildId, userId });
  return !!c;
}

async function addController(guildId, userId) {
  const existing = await Controller.findOne({ guildId, userId });
  if (!existing) {
    const c = new Controller({ guildId, userId });
    await c.save();
    return true;
  }
  return false;
}

async function removeController(guildId, userId) {
  const result = await Controller.deleteOne({ guildId, userId });
  return result.deletedCount > 0;
}

async function getControllers(guildId) {
  const docs = await Controller.find({ guildId });
  return docs.map(d => d.userId);
}

async function hasPermission(member, guildId) {
  if (!member) return false;
  if (OWNER_ID && member.id === OWNER_ID) return true;
  return await isController(member.id, guildId);
}

async function setNameCooldown(userId) {
  await NameCooldown.findOneAndUpdate({ userId }, { timestamp: new Date() }, { upsert: true });
}

async function getNameCooldown(userId) {
  const cd = await NameCooldown.findOne({ userId });
  return cd ? cd.timestamp : null;
}

function getGeneralImage(guild, config) {
  if (config.generalImage) return config.generalImage;
  if (config.bannerImage) return config.bannerImage;
  if (guild.iconURL()) return guild.iconURL({ size: 1024 });
  return null;
}

function sanitizeChannelName(name) {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    .slice(0, 32) || 'ticket';
}

async function getApplySections(guildId) {
  return await ApplySection.find({ guildId }).sort({ order: 1, createdAt: 1 });
}

async function getApplySectionByName(guildId, name) {
  return await ApplySection.findOne({ guildId, name });
}

async function addApplySection(guildId, name, emoji = '📋') {
  const existing = await ApplySection.findOne({ guildId, name });
  if (existing) return false;
  const maxOrder = await ApplySection.findOne({ guildId }).sort({ order: -1 });
  const order = maxOrder ? maxOrder.order + 1 : 0;
  const section = new ApplySection({ guildId, name, emoji, order, questions: [] });
  await section.save();
  return true;
}

async function removeApplySection(guildId, name) {
  const result = await ApplySection.deleteOne({ guildId, name });
  return result.deletedCount > 0;
}

async function getBannedWords(guildId) {
  return await BannedWord.find({ guildId }).sort({ createdAt: -1 });
}

async function addBannedWord(guildId, word, addedBy = null) {
  const existing = await BannedWord.findOne({ guildId, word: word.toLowerCase() });
  if (existing) return false;
  const bw = new BannedWord({ guildId, word: word.toLowerCase(), addedBy });
  await bw.save();
  return true;
}

async function removeBannedWord(guildId, word) {
  const result = await BannedWord.deleteOne({ guildId, word: word.toLowerCase() });
  return result.deletedCount > 0;
}

async function checkSpam(guildId, userId, content, max, seconds) {
  try {
    let tracker = await SpamTracker.findOne({ guildId, userId });
    if (!tracker) {
      tracker = new SpamTracker({ guildId, userId, messages: [] });
    }
    const now = Date.now();
    const windowMs = seconds * 1000;
    tracker.messages = tracker.messages.filter(m => (now - m.timestamp.getTime()) < windowMs);
    const sameContent = tracker.messages.filter(m => m.content === content);
    tracker.messages.push({ content, timestamp: new Date() });
    if (tracker.messages.length > 20) tracker.messages = tracker.messages.slice(-20);
    await tracker.save();
    return sameContent.length + 1 >= max;
  } catch (e) {
    return false;
  }
}

function containsLink(content) {
  const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|www\.[^\s]+)/gi;
  return linkRegex.test(content);
}

async function containsBannedWord(guildId, content) {
  const words = await getBannedWords(guildId);
  const lower = content.toLowerCase();
  return words.find(w => lower.includes(w.word));
}

// ============================================================
// ========== دوال الإيموجي ==========
// ============================================================

function isValidEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return false;
  if (/^<a?:\w{2,32}:\d{17,20}>$/.test(emoji)) return true;
  try {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic}))*$/u;
    return emojiRegex.test(emoji) && emoji.length <= 8;
  } catch (e) {
    return false;
  }
}

function parseEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return null;
  const customMatch = emoji.match(/^<(a?):(\w{2,32}):(\d{17,20})>$/);
  if (customMatch) {
    return {
      animated: customMatch[1] === 'a',
      name: customMatch[2],
      id: customMatch[3],
    };
  }
  if (isValidEmoji(emoji)) return emoji;
  return null;
}

async function isEmojiAccessible(emoji, client) {
  const parsed = parseEmoji(emoji);
  if (!parsed) return false;
  if (typeof parsed === 'string') return true;
  try {
    const fetched = await client.emojis.fetch(parsed.id).catch(() => null);
    return !!fetched;
  } catch (e) {
    return false;
  }
}

async function prepareEmojiForSelect(emoji, client) {
  const accessible = await isEmojiAccessible(emoji, client);
  if (!accessible) return '🎭';
  const parsed = parseEmoji(emoji);
  return parsed || '🎭';
}

// ============================================================
// ========== إجراء الحماية ==========
// ============================================================

async function applyProtectionAction(message, member, guildId, config, violationType, reason) {
  let actionField, timeoutField;
  switch (violationType) {
    case 'spam':
      actionField = 'protectionActionSpam';
      timeoutField = 'protectionTimeoutSpam';
      break;
    case 'link':
      actionField = 'protectionActionLink';
      timeoutField = 'protectionTimeoutLink';
      break;
    case 'everyone':
      actionField = 'protectionActionEveryone';
      timeoutField = 'protectionTimeoutEveryone';
      break;
    case 'word':
      actionField = 'protectionActionWord';
      timeoutField = 'protectionTimeoutWord';
      break;
    default:
      actionField = 'protectionActionSpam';
      timeoutField = 'protectionTimeoutSpam';
  }

  const action = config[actionField] || 'delete_warn';
  const timeoutMinutes = config[timeoutField] || 10;
  const guild = member.guild;
  const brand = getServerBrand(config, guild);

  await message.delete().catch(() => {});

  let dmSent = false;
  let muted = false;

  if (action === 'delete_warn' || action === 'delete_warn_mute') {
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ تنبيه من الإدارة')
        .setColor(THEME.WARN)
        .setDescription(`**السيرفر:** ${guild.name}\n**السبب:** ${reason}\n\n_الرجاء الالتزام بقوانين السيرفر._`)
        .setFooter({ text: brand });
      await member.send({ embeds: [dmEmbed] });
      dmSent = true;
    } catch (e) {}
  }

  if (action === 'delete_mute' || action === 'delete_warn_mute') {
    try {
      const m = await guild.members.fetch(member.id).catch(() => null);
      if (m && m.moderatable) {
        const durationMs = timeoutMinutes * 60 * 1000;
        await m.timeout(durationMs, `حماية: ${reason}`).catch(() => {});
        muted = true;
      }
    } catch (e) {}
  }

  return { dmSent, muted, timeoutMinutes };
}

// ============================================================
// ========== الأوتو لاين ==========
// ============================================================

async function sendAutoLineOnly(channel, auto) {
  if (!auto || !auto.enabled) return false;
  if (auto.image) {
    try {
      await channel.send({ content: auto.image });
      return true;
    } catch (e) {
      return false;
    }
  }
  if (auto.text) {
    try {
      await channel.send({ content: auto.text });
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

// ============================================================
// ========== دوال Voice Master ==========
// ============================================================

// ✅ الدالة المُعدّلة: تعدّل اللوحة الموجودة بدل إرسال جديدة
async function createVoiceRoom(guild, member, config) {
  try {
    const category = config.voiceCategoryId
      ? guild.channels.cache.get(config.voiceCategoryId)
      : null;

    const channelName = `🔊 ${member.displayName || member.user.username}`;

    const voiceChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: category || null,
      permissionOverwrites: [
        {
          id: guild.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
        },
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.DeafenMembers,
          ],
        },
        {
          id: guild.client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.MoveMembers,
          ],
        },
      ],
      reason: `Voice Master • ${member.user.tag}`,
    });

    await member.voice.setChannel(voiceChannel).catch(() => {});

    const voiceRoomData = await VoiceRoom.create({
      guildId: guild.id,
      channelId: voiceChannel.id,
      ownerId: member.id,
    });

    // ✅ نبحث عن اللوحة الموجودة في روم اللوحة (الرسالة اللي أنت أرسلتها بـ !voice)
    const panelChannel = config.voicePanelChannelId
      ? guild.channels.cache.get(config.voicePanelChannelId)
      : null;

    if (panelChannel && panelChannel.isTextBased()) {
      let existingPanelMsg = null;
      try {
        const messages = await panelChannel.messages.fetch({ limit: 50 });
        // ندوّر على أي رسالة للبوت فيها زر vc_rename
        existingPanelMsg = messages.find(m =>
          m.author.id === guild.client.user.id &&
          m.components?.length > 0 &&
          m.components.some(row =>
            row.components?.some(c => c.customId === 'vc_rename')
          )
        );
      } catch (e) {}

      const panel = buildVoicePanel(voiceRoomData, voiceChannel, config, guild);

      if (existingPanelMsg) {
        // ✅ نعدل اللوحة الموجودة
        try {
          await existingPanelMsg.edit({
            content: `🎙️ **${voiceChannel.name}** — <@${member.id}>`,
            embeds: [panel.embed],
            components: panel.rows,
          });
          voiceRoomData.panelMessageId = existingPanelMsg.id;
          voiceRoomData.panelChannelId = panelChannel.id;
          await voiceRoomData.save();
        } catch (err) {
          console.error('❌ فشل تعديل لوحة الصوت:', err);
        }
      } else {
        // ⚠️ احتياطي: ننشئ لوحة جديدة
        try {
          const panelMsg = await panelChannel.send({
            content: `🎙️ **${voiceChannel.name}** — <@${member.id}>`,
            embeds: [panel.embed],
            components: panel.rows,
          });
          voiceRoomData.panelMessageId = panelMsg.id;
          voiceRoomData.panelChannelId = panelChannel.id;
          await voiceRoomData.save();
        } catch (err) {
          console.error('❌ فشل إرسال لوحة الصوت:', err);
        }
      }
    }

    return voiceChannel;
  } catch (err) {
    console.error('❌ خطأ في إنشاء الروم الصوتي:', err);
    return null;
  }
}

function buildVoicePanel(voiceData, voiceChannel, config, guild) {
  const brand = getServerBrand(config, guild);

  const embed = new EmbedBuilder()
    .setTitle(config.voicePanelTitle || '🎙️')
    .setDescription(
      `**🔊 الروم:** ${voiceChannel.name}\n` +
      `**👑 المالك:** <@${voiceData.ownerId}>\n` +
      `**👥 الحد:** ${voiceData.userLimit === 0 ? 'بلا حد' : voiceData.userLimit}\n` +
      `**🔒 الحالة:** ${voiceData.locked ? 'مقفل' : 'مفتوح'}\n` +
      `**✅ المسموح:** ${voiceData.trustedUsers.length} • **⛔ الممنوع:** ${voiceData.blockedUsers.length}\n\n` +
      `> ⚠️ **يقدر المالك أو المتحكمين يتحكموا في الروم.**`
    )
    .setColor(THEME.ORANGE)
    .setFooter({ text: brand });

  if (config.voicePanelImage) embed.setImage(config.voicePanelImage);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vc_rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_limit').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_unlock').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vc_permit').setEmoji('👤').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_reject').setEmoji('⛔').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_unblock').setEmoji('✅').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_kick').setEmoji('👢').setStyle(ButtonStyle.Secondary),
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vc_transfer').setEmoji('👑').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_claim').setEmoji('📌').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vc_delete').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  return { embed, rows: [row1, row2, row3] };
}

// ✅ الدالة المُعدّلة: ما تحذف اللوحة، بس ترجّعها للحالة العامة
async function deleteVoiceRoom(guild, channelId) {
  try {
    const voiceData = await VoiceRoom.findOne({ guildId: guild.id, channelId });
    const channel = guild.channels.cache.get(channelId);

    // ✅ نرجّع اللوحة للحالة العامة (بدل ما نحذفها)
    if (voiceData && voiceData.panelMessageId && voiceData.panelChannelId) {
      const panelCh = guild.channels.cache.get(voiceData.panelChannelId);
      if (panelCh) {
        try {
          const panelMsg = await panelCh.messages.fetch(voiceData.panelMessageId).catch(() => null);
          if (panelMsg) {
            const config = await getGuildConfig(guild.id);
            const brand = getServerBrand(config, guild);

            const embed = new EmbedBuilder()
              .setTitle(config.voicePanelTitle || '🎙️')
              .setDescription(
                '**للتحكم في رومك الصوتي:**\n\n' +
                '> ادخل قناة **🎙️ Creator Channel** لإنشاء رومك\n' +
                '> رح تنزل لك لوحة تحكم خاصة في روم اللوحة\n' +
                '> اضغط على الأزرار للتحكم في رومك'
              )
              .setColor(THEME.ORANGE)
              .setFooter({ text: brand });

            if (config.voicePanelImage) embed.setImage(config.voicePanelImage);

            const row1 = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('vc_rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_limit').setEmoji('👥').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_unlock').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
            );
            const row2 = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('vc_permit').setEmoji('👤').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_reject').setEmoji('⛔').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_unblock').setEmoji('✅').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_kick').setEmoji('👢').setStyle(ButtonStyle.Secondary),
            );
            const row3 = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('vc_transfer').setEmoji('👑').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_claim').setEmoji('📌').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId('vc_delete').setEmoji('❌').setStyle(ButtonStyle.Danger),
            );

            await panelMsg.edit({
              content: '',
              embeds: [embed],
              components: [row1, row2, row3],
            }).catch(() => {});
          }
        } catch (e) {}
      }
    }

    await VoiceRoom.deleteOne({ guildId: guild.id, channelId });

    if (channel) {
      await channel.delete('Voice Master • Room empty').catch(() => {});
    }
  } catch (err) {
    console.error('❌ خطأ في حذف الروم الصوتي:', err);
  }
}

async function getVoiceRoomForMember(interaction) {
  try {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (member) {
      const memberVoice = member.voice?.channel;
      if (memberVoice) {
        const voiceData = await VoiceRoom.findOne({
          guildId: interaction.guild.id,
          channelId: memberVoice.id,
        });
        if (voiceData) return voiceData;
      }
    }

    const ownedRoom = await VoiceRoom.findOne({
      guildId: interaction.guild.id,
      ownerId: interaction.user.id,
    });
    if (ownedRoom) {
      const ch = interaction.guild.channels.cache.get(ownedRoom.channelId);
      if (ch) return ownedRoom;
      await VoiceRoom.deleteOne({ guildId: interaction.guild.id, channelId: ownedRoom.channelId });
    }

    return null;
  } catch (e) {
    console.error('❌ خطأ في getVoiceRoomForMember:', e);
    return null;
  }
}

async function updateVoicePanel(client, voiceData) {
  try {
    if (!voiceData.panelMessageId || !voiceData.panelChannelId) return;
    const guild = client.guilds.cache.get(voiceData.guildId);
    if (!guild) return;

    const panelChannel = guild.channels.cache.get(voiceData.panelChannelId);
    if (!panelChannel) return;

    const voiceChannel = guild.channels.cache.get(voiceData.channelId);
    if (!voiceChannel) return;

    const config = await getGuildConfig(guild.id);
    const panel = buildVoicePanel(voiceData, voiceChannel, config, guild);

    try {
      const msg = await panelChannel.messages.fetch(voiceData.panelMessageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [panel.embed], components: panel.rows }).catch(() => {});
      }
    } catch (e) {}
  } catch (error) {
    console.error('❌ خطأ في تحديث لوحة الصوت:', error);
  }
}

// ============================================================
// ========== الأزرار ==========
// ============================================================

const BTN = {
  MAIN: ButtonStyle.Danger,
  ALT: ButtonStyle.Secondary,
};

// ============================================================
// ========== لوحة الحماية ==========
// ============================================================

async function buildProtectionPanel(guildId, guild) {
  const config = await getGuildConfig(guildId);
  const bannedWords = await getBannedWords(guildId);
  const brand = getServerBrand(config, guild);

  const statusEmoji = (b) => b ? '🟢' : '🔴';

  const actionLabels = {
    'delete': '🗑️ حذف',
    'delete_warn': '🗑️ + 📩 DM',
    'delete_mute': '🗑️ + 🔇 Timeout',
    'delete_warn_mute': '🗑️ + 📩 + 🔇',
  };

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ ${brand} | مركز الحماية`)
    .setDescription(
      `**الحالة:** ${statusEmoji(config.protectionEnabled)} ${config.protectionEnabled ? 'مفعّلة' : 'معطّلة'}\n\n` +
      `**⚙️ الإعدادات:**\n` +
      `${statusEmoji(config.antiSpamEnabled)} **منع التكرار:** ${config.antiSpamEnabled ? `مفعّل (${config.antiSpamMax}/${config.antiSpamSeconds}ث)` : 'معطّل'}\n` +
      `${statusEmoji(config.antiLinkEnabled)} **منع الروابط:** ${config.antiLinkEnabled ? 'مفعّل' : 'معطّل'}\n` +
      `${statusEmoji(config.antiEveryoneEnabled)} **منع المنشن:** ${config.antiEveryoneEnabled ? 'مفعّل' : 'معطّل'}\n` +
      `🚫 **الكلمات المحظورة:** ${bannedWords.length}\n\n` +
      `**⚖️ العقابات المخصصة:**\n` +
      `🔁 **التكرار:** ${actionLabels[config.protectionActionSpam]} (${config.protectionTimeoutSpam}د)\n` +
      `🔗 **الروابط:** ${actionLabels[config.protectionActionLink]} (${config.protectionTimeoutLink}د)\n` +
      `📢 **المنشن:** ${actionLabels[config.protectionActionEveryone]} (${config.protectionTimeoutEveryone}د)\n` +
      `🚫 **الكلمات:** ${actionLabels[config.protectionActionWord]} (${config.protectionTimeoutWord}د)\n\n` +
      `> **ملاحظة:** الحماية تشتغل على كل الأعضاء ما عدا **المتحكمين** و **الرتب المستثناة**.`
    )
    .setColor(THEME.ORANGE)
    .setFooter({ text: brand });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prot_toggle_main').setLabel(config.protectionEnabled ? '🛑 تعطيل' : '⚔️ تفعيل').setStyle(BTN.MAIN),
    new ButtonBuilder().setCustomId('prot_toggle_spam').setLabel(config.antiSpamEnabled ? '🔁 إيقاف' : '🔁 تفعيل').setStyle(BTN.MAIN),
    new ButtonBuilder().setCustomId('prot_toggle_link').setLabel(config.antiLinkEnabled ? '🔗 إيقاف' : '🔗 تفعيل').setStyle(BTN.MAIN),
    new ButtonBuilder().setCustomId('prot_toggle_everyone').setLabel(config.antiEveryoneEnabled ? '📢 إيقاف' : '📢 تفعيل').setStyle(BTN.MAIN),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prot_banned_words').setLabel('الكلمات').setStyle(BTN.ALT).setEmoji('🚫'),
    new ButtonBuilder().setCustomId('prot_actions_menu').setLabel('العقابات').setStyle(BTN.ALT).setEmoji('⚖️'),
    new ButtonBuilder().setCustomId('prot_bypass_roles').setLabel('الاستثناءات').setStyle(BTN.ALT).setEmoji('🎭'),
    new ButtonBuilder().setCustomId('prot_settings').setLabel('الإعدادات').setStyle(BTN.ALT).setEmoji('⚙️'),
  );

  return { embed, rows: [row1, row2] };
}

async function buildProtectionActionsPanel(guildId, guild) {
  const config = await getGuildConfig(guildId);
  const brand = getServerBrand(config, guild);

  const actionLabels = {
    'delete': '🗑️ حذف فقط',
    'delete_warn': '🗑️ + 📩 تحذير DM',
    'delete_mute': '🗑️ + 🔇 Timeout',
    'delete_warn_mute': '🗑️ + 📩 + 🔇',
  };

  const embed = new EmbedBuilder()
    .setTitle(`⚖️ ${brand} | العقابات المخصصة`)
    .setDescription(
      '**كل مخالفة لها عقاب مستقل ومدة Timeout خاصة.**\n\n' +
      `🔁 **منع التكرار:**\n> العقاب: ${actionLabels[config.protectionActionSpam]}\n> المدة: ${config.protectionTimeoutSpam} دقيقة\n\n` +
      `🔗 **منع الروابط:**\n> العقاب: ${actionLabels[config.protectionActionLink]}\n> المدة: ${config.protectionTimeoutLink} دقيقة\n\n` +
      `📢 **منع المنشن:**\n> العقاب: ${actionLabels[config.protectionActionEveryone]}\n> المدة: ${config.protectionTimeoutEveryone} دقيقة\n\n` +
      `🚫 **الكلمات المحظورة:**\n> العقاب: ${actionLabels[config.protectionActionWord]}\n> المدة: ${config.protectionTimeoutWord} دقيقة`
    )
    .setColor(THEME.ORANGE)
    .setFooter({ text: brand });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prot_edit_spam').setLabel('التكرار').setStyle(BTN.MAIN).setEmoji('🔁'),
    new ButtonBuilder().setCustomId('prot_edit_link').setLabel('الروابط').setStyle(BTN.MAIN).setEmoji('🔗'),
    new ButtonBuilder().setCustomId('prot_edit_everyone').setLabel('المنشن').setStyle(BTN.MAIN).setEmoji('📢'),
    new ButtonBuilder().setCustomId('prot_edit_word').setLabel('الكلمات').setStyle(BTN.MAIN).setEmoji('🚫'),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prot_refresh').setLabel('رجوع').setStyle(BTN.ALT).setEmoji('🔙')
  );

  return { embed, rows: [row, row2] };
}

// ✅ الدالة المُعدّلة: أضفنا خيار "إغلاق التذكرة" داخل القائمة
function buildTicketControlRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_control')
    .setPlaceholder('اختر إجراءً للتحكم في التذكرة')
    .addOptions([
      { label: 'استلام التذكرة', description: 'سجّل نفسك كمستلم', value: 'claim', emoji: '✋' },
      { label: 'إلغاء المطالبة', description: 'إلغاء استلامك', value: 'unclaim', emoji: '📌' },
      { label: 'إضافة عضو', description: 'أضف عضواً للتذكرة', value: 'add_member', emoji: '👤' },
      { label: 'تغيير اسم التذكرة', description: 'غيّر اسم القناة', value: 'rename', emoji: '✏️' },
      { label: '🔒 إغلاق التذكرة', description: 'إغلاق وحذف التذكرة', value: 'close', emoji: '🔒' },
      { label: '🗑️ حذف التذكرة', description: 'احذف القناة نهائياً', value: 'delete', emoji: '🗑️' },
    ]);
  return new ActionRowBuilder().addComponents(menu);
}

async function getSelfRoles(guildId) {
  return await SelfRole.find({ guildId }).sort({ order: 1, createdAt: 1 });
}

async function addSelfRole(guildId, roleId, label, emoji = '🎭', image = null, description = '') {
  if (!parseEmoji(emoji)) emoji = '🎭';
  const existing = await SelfRole.findOne({ guildId, roleId });
  const maxOrder = await SelfRole.findOne({ guildId }).sort({ order: -1 });
  const order = maxOrder ? maxOrder.order + 1 : 0;
  if (existing) {
    existing.label = label;
    existing.emoji = emoji;
    existing.image = image;
    existing.description = description;
    await existing.save();
    return false;
  }
  const newRole = new SelfRole({ guildId, roleId, label, emoji, image, description, order });
  await newRole.save();
  return true;
}

async function removeSelfRole(guildId, roleId) {
  const result = await SelfRole.deleteOne({ guildId, roleId });
  return result.deletedCount > 0;
}

async function updateSelfRole(guildId, roleId, data) {
  if (data.emoji !== undefined && !parseEmoji(data.emoji)) data.emoji = '🎭';
  return await SelfRole.findOneAndUpdate({ guildId, roleId }, data, { new: true });
}

async function buildSelfRolesPanel(guildId, guild, config) {
  const selfRoles = await getSelfRoles(guildId);
  if (!selfRoles.length) return null;

  const generalImage = getGeneralImage(guild, config);
  const panelText = config.rolesPanelText || 'اختر الرتب التي تناسبك من القائمة المنسدلة أدناه.\n\n**اضغط على الرتبة لإضافتها، واضغط مرة أخرى لإزالتها.**';
  const panelImage = config.rolesImage || null;
  const brand = getServerBrand(config, guild);

  const embed = new EmbedBuilder()
    .setTitle(`🎭 ${brand} | الرتب الذاتية`)
    .setDescription(panelText)
    .setColor(THEME.ORANGE)
    .setFooter({ text: brand });

  if (panelImage) embed.setImage(panelImage);
  else if (generalImage) embed.setThumbnail(generalImage);

  const options = [];
  const rolesToShow = selfRoles.slice(0, 24);

  for (const r of rolesToShow) {
    const opt = {
      label: r.label.slice(0, 100),
      value: r.roleId,
    };
    const preparedEmoji = await prepareEmojiForSelect(r.emoji, guild.client);
    opt.emoji = preparedEmoji;
    if (r.description) opt.description = r.description.slice(0, 100);
    options.push(opt);
  }

  options.push({
    label: 'إعادة تعيين القائمة',
    value: 'SELF_ROLES_RESET',
    emoji: '🔄',
    description: 'إعادة إرسال القائمة',
  });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('self_roles_toggle')
      .setPlaceholder('اختر رتبتك...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options)
  );

  return { embed, row };
}

async function buildPigeonPanel(config, guild) {
  const title = config.pigeonTitle || '🕊️ الحمام الزاجل';
  const text = config.pigeonDescription || 'لإرسال رسالة خاصة عبر الحمام الزاجل، اضغط على الزر أدناه.';
  const image = config.pigeonImage || null;
  const brand = getServerBrand(config, guild);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(text)
    .setColor(THEME.ORANGE)
    .setFooter({ text: brand });

  if (image) embed.setImage(image);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pigeon_send').setLabel('إرسال زاجل').setStyle(BTN.MAIN).setEmoji('🕊️'),
    new ButtonBuilder().setCustomId('pigeon_myhistory').setLabel('سجل رسائلي').setStyle(BTN.ALT).setEmoji('📬')
  );

  return { embed, row };
}

async function buildApplyPanel(guildId, config, guild) {
  const title = config.applyPanelTitle || '📋 التقديمات';
  const text = config.applyPanelDescription || 'اختر القسم الذي ترغب بالتقديم عليه من القائمة المنسدلة أدناه.';
  const image = config.applyPanelImage || null;
  const brand = getServerBrand(config, guild);

  const sections = await getApplySections(guildId);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(text)
    .setColor(THEME.ORANGE)
    .setFooter({ text: brand });

  if (image) embed.setImage(image);

  if (!sections.length) {
    return { embed, row: null, empty: true };
  }

  const options = [];
  for (const s of sections.slice(0, 25)) {
    const opt = {
      label: s.name.slice(0, 100),
      value: s.name.slice(0, 100),
    };
    const preparedEmoji = await prepareEmojiForSelect(s.emoji, guild.client);
    opt.emoji = preparedEmoji;
    const qCount = s.questions?.length || 0;
    opt.description = `${qCount} سؤال${s.roleId ? ' • له رتبة' : ''}`.slice(0, 100);
    options.push(opt);
  }

  options.push({
    label: 'إعادة تعيين القائمة',
    value: 'APPLY_RESET',
    emoji: '🔄',
    description: 'إعادة إرسال البانل',
  });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('apply_section_select')
      .setPlaceholder('اختر قسم التقديم...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options)
  );

  return { embed, row, empty: false };
}

async function findMemberByName(guild, query) {
  if (!query || !guild) return null;

  let cleaned = query.trim();
  if (cleaned.startsWith('@')) cleaned = cleaned.slice(1);
  cleaned = cleaned.split('#')[0].trim();
  if (!cleaned) return null;

  if (/^\d{17,20}$/.test(cleaned)) {
    const byId = await guild.members.fetch(cleaned).catch(() => null);
    if (byId) return byId;
  }

  const mentionMatch = query.match(/^<@!?(\d{17,20})>$/);
  if (mentionMatch) {
    const byMention = await guild.members.fetch(mentionMatch[1]).catch(() => null);
    if (byMention) return byMention;
  }

  const lower = cleaned.toLowerCase();

  const cached = guild.members.cache.find(m =>
    m.user.username.toLowerCase() === lower ||
    (m.user.globalName && m.user.globalName.toLowerCase() === lower) ||
    (m.user.tag && m.user.tag.toLowerCase() === cleaned.toLowerCase()) ||
    m.displayName.toLowerCase() === lower ||
    m.user.username.toLowerCase().includes(lower) ||
    (m.user.globalName && m.user.globalName.toLowerCase().includes(lower)) ||
    m.displayName.toLowerCase().includes(lower)
  );
  if (cached) return cached;

  try {
    const allMembers = await guild.members.fetch();
    let found = allMembers.find(m =>
      m.user.username.toLowerCase() === lower ||
      (m.user.globalName && m.user.globalName.toLowerCase() === lower) ||
      (m.user.tag && m.user.tag.toLowerCase() === cleaned.toLowerCase()) ||
      m.displayName.toLowerCase() === lower
    );
    if (found) return found;
    found = allMembers.find(m =>
      m.user.username.toLowerCase().includes(lower) ||
      (m.user.globalName && m.user.globalName.toLowerCase().includes(lower)) ||
      m.displayName.toLowerCase().includes(lower)
    );
    if (found) return found;
  } catch (e) {}

  try {
    const user = await client.users.fetch(cleaned).catch(() => null);
    if (user) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member) return member;
    }
  } catch (e) {}

  return null;
}

// ========== العميل ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.once('ready', () => {
  console.log(`✅ البوت جاهز | ${client.user.tag}`);
  if (OWNER_ID) console.log(`👑 المالك: ${OWNER_ID}`);
  client.user.setActivity('The Kingdom Never Falls.', { type: ActivityType.Watching });
});
// ============================================================
// ========== نظام اللوق ==========
// ============================================================

const logQueue = [];
let logProcessing = false;

async function processLogQueue() {
  if (logProcessing) return;
  logProcessing = true;
  while (logQueue.length > 0) {
    const task = logQueue.shift();
    try { await task(); } catch (e) { console.error('❌ خطأ في اللوق:', e); }
    await new Promise(r => setTimeout(r, 200));
  }
  logProcessing = false;
}

function logToChannel(guildId, data) {
  logQueue.push(async () => {
    const config = await getGuildConfig(guildId);
    if (!config.logChannel) return;
    const channel = client.channels.cache.get(config.logChannel);
    if (!channel) return;
    const brand = getServerBrand(config, channel.guild);
    const embed = new EmbedBuilder()
      .setColor(data.color || THEME.BLACK)
      .setTitle(data.title || '📋 سجل')
      .setDescription(data.description || '')
      .setFooter({ text: brand });
    if (data.fields) for (const f of data.fields) embed.addFields(f);
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);
    await channel.send({ embeds: [embed] });
  });
  processLogQueue();
}

// ============================================================
// ========== نظام الترحيب ==========
// ============================================================

function drawDefaultBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0a0f');
  gradient.addColorStop(0.35, '#2a0000');
  gradient.addColorStop(0.5, '#8b0000');
  gradient.addColorStop(0.65, '#2a0000');
  gradient.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const radialGlow = ctx.createRadialGradient(
    width / 2, height / 2, 50,
    width / 2, height / 2, width * 0.7
  );
  radialGlow.addColorStop(0, 'rgba(212,175,55,0.08)');
  radialGlow.addColorStop(0.5, 'rgba(139,0,0,0.15)');
  radialGlow.addColorStop(1, 'rgba(10,10,15,0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(212,175,55,0.03)';
  ctx.lineWidth = 1;
  for (let x = -height; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
}

async function generateWelcomeImage(member, memberCount, background = null) {
  const width = 1200;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (background) {
    if (background.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i)) {
      try {
        const bgImage = await loadImage(background);
        ctx.drawImage(bgImage, 0, 0, width, height);
      } catch (e) { drawDefaultBackground(ctx, width, height); }
    } else {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    drawDefaultBackground(ctx, width, height);
  }

  ctx.strokeStyle = THEME.ORANGE_HEX;
  ctx.lineWidth = 6;
  const borderRadius = 20;
  const x = 30, y = 30, w = width - 60, h = height - 60;
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y);
  ctx.lineTo(x + w - borderRadius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
  ctx.lineTo(x + w, y + h - borderRadius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
  ctx.lineTo(x + borderRadius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
  ctx.lineTo(x, y + borderRadius);
  ctx.quadraticCurveTo(x, y, x + borderRadius, y);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + borderRadius + 8, y + 8);
  ctx.lineTo(x + w - borderRadius - 8, y + 8);
  ctx.quadraticCurveTo(x + w - 8, y + 8, x + w - 8, y + borderRadius + 8);
  ctx.lineTo(x + w - 8, y + h - borderRadius - 8);
  ctx.quadraticCurveTo(x + w - 8, y + h - 8, x + w - borderRadius - 8, y + h - 8);
  ctx.lineTo(x + borderRadius + 8, y + h - 8);
  ctx.quadraticCurveTo(x + 8, y + h - 8, x + 8, y + h - borderRadius - 8);
  ctx.lineTo(x + 8, y + borderRadius + 8);
  ctx.quadraticCurveTo(x + 8, y + 8, x + borderRadius + 8, y + 8);
  ctx.closePath();
  ctx.stroke();

  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    const radius = 140;
    const centerX = 250, centerY = 300;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = THEME.ORANGE_HEX;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212,175,55,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } catch (e) {}

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  const displayName = member.displayName || member.user.username;

  ctx.font = `bold 52px ${ARABIC_FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.fillText(`مرحباً ${displayName}`, 460, 190);

  ctx.font = `36px ${ARABIC_FONT}`;
  ctx.fillStyle = '#d4af37';
  ctx.shadowBlur = 10;
  ctx.fillText(`العضو رقم #${memberCount}`, 460, 270);

  ctx.font = `28px ${ARABIC_FONT}`;
  ctx.fillStyle = '#cccccc';
  ctx.shadowBlur = 5;
  ctx.fillText('نتمنى لك قضاء وقت ممتع! 🎉', 460, 340);

  ctx.textAlign = 'right';
  ctx.font = `22px ${ARABIC_FONT}`;
  ctx.fillStyle = THEME.ORANGE_HEX;
  ctx.shadowBlur = 0;
  ctx.fillText('مرحباً بك', width - 50, height - 40);

  return canvas.toBuffer('image/png');
}

client.on('guildMemberAdd', async (member) => {
  try {
    const config = await getGuildConfig(member.guild.id);
    const brand = getServerBrand(config, member.guild);

    if (!config.welcomeChannel) {
      logToChannel(member.guild.id, {
        title: '👋 عضو جديد',
        color: THEME.ORANGE,
        description: `**${member.user.tag}** انضم.`,
        thumbnail: member.user.displayAvatarURL(),
      });
      return;
    }

    const channel = member.guild.channels.cache.get(config.welcomeChannel);
    if (!channel) return;

    const memberCount = member.guild.memberCount;
    const imageBuffer = await generateWelcomeImage(member, memberCount, config.welcomeBackground);
    const generalImage = getGeneralImage(member.guild, config);

    const embed = new EmbedBuilder()
      .setTitle(config.welcomeTitle || `👑 مرحباً بك في ${brand}`)
      .setDescription(config.welcomeMessage || `أهلاً ${member} في السيرفر!`)
      .setColor(THEME.ORANGE)
      .setImage('attachment://welcome.png')
      .setFooter({ text: brand });

    if (config.welcomeImage) embed.setThumbnail(config.welcomeImage);
    if (generalImage) embed.setFooter({ text: `${brand} • العضو رقم ${memberCount}`, iconURL: generalImage });

    await channel.send({ content: `${member}`, embeds: [embed], files: [{ attachment: imageBuffer, name: 'welcome.png' }] });

    if (config.joinRole) {
      const role = member.guild.roles.cache.get(config.joinRole);
      if (role) await member.roles.add(role).catch(() => {});
    }

    logToChannel(member.guild.id, {
      title: '👋 عضو جديد',
      color: THEME.ORANGE,
      description: `**${member.user.tag}** انضم.`,
      thumbnail: member.user.displayAvatarURL(),
    });
  } catch (error) {}
});

client.on('guildMemberRemove', async (member) => {
  try {
    logToChannel(member.guild.id, {
      title: '🚪 عضو غادر',
      color: THEME.BLACK,
      description: `**${member.user.tag}** غادر.`,
      thumbnail: member.user.displayAvatarURL(),
    });
  } catch (error) {}
});

client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;
  try {
    let content = message.content;
    if (!content && message.partial) {
      try {
        const fetched = await message.fetch();
        content = fetched.content;
      } catch (e) {}
    }
    logToChannel(message.guild.id, {
      title: '🗑️ حذف رسالة',
      color: THEME.BLACK,
      description: `**${message.author?.tag || 'غير معروف'}** في **${message.channel.name}**\n**المحتوى:** ${content || 'غير مرئي'}`,
    });
  } catch (error) {}
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author?.bot) return;
  try {
    let oldContent = oldMessage.content;
    let newContent = newMessage.content;
    if (oldMessage.partial) {
      try {
        const fetched = await oldMessage.fetch();
        oldContent = fetched.content;
      } catch (e) {}
    }
    if (oldContent === newContent) return;
    logToChannel(oldMessage.guild.id, {
      title: '✏️ تعديل رسالة',
      color: THEME.BLACK,
      description: `**${oldMessage.author?.tag || 'غير معروف'}** في **${oldMessage.channel.name}**`,
      fields: [
        { name: '📜 القديم', value: oldContent || 'فارغ', inline: false },
        { name: '📝 الجديد', value: newContent || 'فارغ', inline: false },
      ],
    });
  } catch (error) {}
});

function isAdminCommand(cmd) {
  const adminCmds = [
    'حظر', 'برجلي', 'كتم', 'فك_كتم', 'تحذير', 'ابطال_تحذيرات',
    'مسح', 'قفل', 'فتح', 'نقل_كل',
    'حذف_قناة', 'تغيير_اسم_قناة'
  ];
  return adminCmds.includes(cmd);
}

// ============================================================
// ========== Voice State Update ==========
// ============================================================

client.on('voiceStateUpdate', async (oldState, newState) => {
  const guild = newState.guild || oldState.guild;
  if (!guild) return;

  try {
    const config = await getGuildConfig(guild.id);
    if (!config.voiceCreatorChannelId) return;

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    if (newState.channelId === config.voiceCreatorChannelId) {
      const existing = await VoiceRoom.findOne({ guildId: guild.id, ownerId: member.id });
      if (existing) {
        const existingCh = guild.channels.cache.get(existing.channelId);
        if (existingCh) {
          await member.voice.setChannel(existingCh).catch(() => {});
          return;
        } else {
          await VoiceRoom.deleteOne({ guildId: guild.id, ownerId: member.id });
        }
      }

      await createVoiceRoom(guild, member, config);
      return;
    }

    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const voiceData = await VoiceRoom.findOne({ guildId: guild.id, channelId: oldState.channelId });
      if (voiceData) {
        const oldChannel = guild.channels.cache.get(oldState.channelId);
        if (oldChannel && oldChannel.members.size === 0) {
          await deleteVoiceRoom(guild, oldState.channelId);
        }
      }
    }
  } catch (error) {
    console.error('❌ خطأ في voiceStateUpdate:', error);
  }
});
// ============================================================
// ========== المعالج الرئيسي لـ messageCreate ==========
// ============================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const isCommand = message.content.startsWith('!');
  const config = await getGuildConfig(guildId);
  const generalImage = getGeneralImage(message.guild, config);
  const brand = getServerBrand(config, message.guild);

  // ============================================================
  // ========== نظام الاقتراحات ==========
  // ============================================================
  if (config.suggestionsChannel && message.channel.id === config.suggestionsChannel) {
    if (!isCommand) {
      try {
        const content = message.content;
        if (!content || content.trim().length === 0) return;

        const authorTag = message.author.tag;
        const authorAvatar = message.author.displayAvatarURL({ dynamic: true });

        await message.delete().catch(() => {});

        const suggestEmbed = new EmbedBuilder()
          .setAuthor({ name: authorTag, iconURL: authorAvatar })
          .setTitle('💡 اقتراح جديد')
          .setDescription(`\`\`\`\n${content.slice(0, 2000)}\n\`\`\``)
          .setColor(THEME.ORANGE)
          .setFooter({ text: brand });

        const sentMsg = await message.channel.send({ embeds: [suggestEmbed] });

        let thread;
        try {
          thread = await sentMsg.startThread({
            name: 'نقاش',
            autoArchiveDuration: 1440,
          });
        } catch (e) {}

        if (thread) {
          try {
            const yesMsg = await thread.send('**✅ موافق** — تفاعل للتصويت');
            const noMsg = await thread.send('**❌ غير موافق** — تفاعل للتصويت');
            await yesMsg.react('✅');
            await noMsg.react('❌');
          } catch (e) {}

          try {
            await Suggestion.create({
              guildId,
              userId: message.author.id,
              content: content.slice(0, 2000),
              messageId: sentMsg.id,
              threadId: thread.id,
            });
          } catch (e) {}
        }

        logToChannel(guildId, {
          title: '💡 اقتراح جديد',
          color: THEME.ORANGE,
          description: `**${authorTag}**\n${content.slice(0, 500)}`,
        });
      } catch (error) {
        console.error('❌ خطأ في معالجة الاقتراح:', error);
      }
      return;
    }
  }

  // ============================================================
  // ========== نظام الحماية ==========
  // ============================================================
  if (!isCommand && config.protectionEnabled) {
    try {
      const member = message.member;
      if (!member) return;

      if (config.suggestionsChannel && message.channel.id === config.suggestionsChannel) return;

      const isExempt = await hasPermission(member, guildId);
      const hasBypassRole = config.protectionBypassRoles?.length
        ? member.roles.cache.some(r => config.protectionBypassRoles.includes(r.id))
        : false;
      const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!isExempt && !hasBypassRole && !isAdmin) {
        let violationReason = null;
        let violationType = null;

        if (config.antiLinkEnabled && containsLink(message.content)) {
          violationReason = 'إرسال روابط ممنوعة';
          violationType = 'link';
        }

        if (!violationReason) {
          const bannedWord = await containsBannedWord(guildId, message.content);
          if (bannedWord) {
            violationReason = `استخدام كلمة محظورة: \`${bannedWord.word}\``;
            violationType = 'word';
          }
        }

        if (!violationReason && config.antiEveryoneEnabled) {
          if (message.content.includes('@everyone') || message.content.includes('@here')) {
            violationReason = 'منشن جماعي ممنوع';
            violationType = 'everyone';
          }
        }

        if (!violationReason && config.antiSpamEnabled) {
          const isSpam = await checkSpam(guildId, userId, message.content, config.antiSpamMax || 5, config.antiSpamSeconds || 5);
          if (isSpam) {
            violationReason = `تكرار الرسالة ${config.antiSpamMax} مرات في ${config.antiSpamSeconds} ثواني`;
            violationType = 'spam';
          }
        }

        if (violationReason && violationType) {
          const result = await applyProtectionAction(message, member, guildId, config, violationType, violationReason);

          try {
            const warnMsg = await message.channel.send({ content: `${member} ⚠️ ${violationReason}` });
            setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
          } catch (e) {}

          logToChannel(guildId, {
            title: '🛡️ مخالفة حماية',
            color: THEME.WARN,
            description: `**${member.user.tag}** في ${message.channel}\n**النوع:** ${violationType}\n**السبب:** ${violationReason}\n**DM:** ${result.dmSent ? '✅' : '❌'}\n**Timeout:** ${result.muted ? `✅ (${result.timeoutMinutes}د)` : '❌'}`,
          });

          return;
        }
      }
    } catch (e) {
      console.error('❌ خطأ في نظام الحماية:', e);
    }
  }

  // ============================================================
  // ========== الأوامر النصية ==========
  // ============================================================
  if (isCommand) {
    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    const deleteDelay = isAdminCommand(cmd) ? 5000 : 0;
    let sentReply = null;

    const deleteAfter = (replyMsg) => {
      if (deleteDelay === 0) return;
      setTimeout(async () => {
        try { await message.delete(); } catch (e) {}
        if (replyMsg) {
          try { await replyMsg.delete(); } catch (e) {}
        }
      }, deleteDelay);
    };

    try {
      // ============================================================
      // ========== !مساعدة ==========
      // ============================================================
      if (cmd === 'مساعدة') {
        const embed = new EmbedBuilder()
          .setTitle(`📖 ${brand} | دليل الأوامر`)
          .setDescription(
            '**كل أدوات السيرفر بين يديك** 👑\n\n' +
            '`!` ← البادئة قبل كل أمر\n' +
            '> أوامر الإعدادات تحتاج صلاحية **متحكم**'
          )
          .setColor(THEME.ORANGE)
          .setThumbnail(message.guild.iconURL() || null)
          .addFields(
            {
              name: '━━━ 👑 نظام التحكم ━━━',
              value:
                '> `متحكم @شخص` — تعيين متحكم\n' +
                '> `الغاء_متحكم @شخص` — إلغاء متحكم\n' +
                '> `قائمة_المتحكمين` — عرض المتحكمين\n' +
                '> `اصلاح_رتب` — إصلاح الرتب الذاتية *(للمالك)*',
              inline: false,
            },
            {
              name: '━━━ 🎙️ الرومات الصوتية ━━━',
              value:
                '> `voice` / `صوت` — إرسال لوحة التحكم الصوتية\n' +
                '> `تعيين قناة_الصانع #قناة` — قناة الصانع\n' +
                '> `تعيين كاتقوري_صوتي #كاتقوري` — كاتقوري الرومات\n' +
                '> `تعيين روم_لوحة_صوت #قناة` — روم اللوحة\n' +
                '> `تعيين صورة_فويس [رابط]` — صورة اللوحة\n' +
                '> `تعيين عنوان_فويس [نص/إيموجي]` — عنوان اللوحة\n' +
                '> `فحص_روم [@شخص]` — تشخيص حالة الروم',
              inline: false,
            },
            {
              name: '━━━ 🛡️ الإشراف ━━━',
              value:
                '> `حظر @شخص [سبب]`\n' +
                '> `برجلي @شخص [سبب]` — طرد\n' +
                '> `كتم @شخص [سبب]`\n' +
                '> `فك_كتم @شخص`\n' +
                '> `تحذير @شخص [سبب]`\n' +
                '> `ابطال_تحذيرات @شخص`\n' +
                '> `مسح [عدد]`\n' +
                '> `قفل` • `فتح`',
              inline: false,
            },
            {
              name: '━━━ 🎭 إدارة الرتب ━━━',
              value:
                '> `اعطاء_رتبة @شخص @رتبة`\n' +
                '> `سحب_رتبة @شخص @رتبة`\n' +
                '> `عرض_رتب [@شخص]`',
              inline: false,
            },
            {
              name: '━━━ 📁 إدارة القنوات ━━━',
              value:
                '> `انشاء_قناة [اسم]`\n' +
                '> `حذف_قناة #قناة`\n' +
                '> `تغيير_اسم_قناة #قناة [اسم]`',
              inline: false,
            },
            {
              name: '━━━ 🔊 الصوت والرسائل ━━━',
              value:
                '> `نقل_كل #من #إلى`\n' +
                '> `تثبيت [آيدي]` • `الغاء_تثبيت [آيدي]`\n' +
                '> `قول [نص]` • `ايمبد [عنوان] ، [وصف]`\n' +
                '> `اعلان [نص]` • `اعلان here [نص]`',
              inline: false,
            },
            {
              name: '━━━ 📊 المستويات ━━━',
              value:
                '> `مستوى [@شخص]`\n' +
                '> `ترتيب`',
              inline: false,
            },
            {
              name: '━━━ 👋 الترحيب ━━━',
              value:
                '> `تعيين ترحيب #قناة`\n' +
                '> `تعيين رسالة_ترحيب` • `تعيين عنوان_ترحيب`\n' +
                '> `تعيين صورة_ترحيب` • `تعيين خلفية_ترحيب`\n' +
                '> `تعيين دور_دخول @دور`',
              inline: false,
            },
            {
              name: '━━━ 📋 اللوق والأوتو لاين ━━━',
              value:
                '> `تعيين سجلات #قناة` • `اختبار_لوق`\n' +
                '> `تعيين اوتر_لاين` • `تعيين صورة_اوترلاين`\n' +
                '> `تعيين تفعيل_اوترلاين` • `تعيين تعطيل_اوترلاين`\n' +
                '> `تعيين حذف_اوترلاين`',
              inline: false,
            },
            {
              name: '━━━ 💬 الردود التلقائية ━━━',
              value:
                '> `رد_تلقائي [كلمة] [رد]`\n' +
                '> `رد_تلقائي_صورة [كلمة] [رد] [رابط]`\n' +
                '> `حذف_رد_تلقائي [كلمة]`\n' +
                '> `عرض_الردود`',
              inline: false,
            },
            {
              name: '━━━ 🎫 التذاكر ━━━',
              value:
                '> `بانل` • `عرض_تذكرة`\n' +
                '> `تعيين تذكرة عنوان [عنوان]`\n' +
                '> `تعيين تذكرة إضافة [اسم] @رتبة :إيموجي:`\n' +
                '> `تعيين تذكرة تعيين_ايموجي [اسم] :إيموجي:`\n' +
                '> `تعيين تذكرة حذف [اسم]`\n' +
                '> `تعيين تذكرة نص [نص]`\n' +
                '> `تعيين تذكرة صورة [رابط]`\n' +
                '> `تعيين تكت_لوق #روم`\n' +
                '> `تعيين فئة_تكت #كاتقوري`',
              inline: false,
            },
            {
              name: '━━━ ⭐ التقييمات ━━━',
              value:
                '> `تقييمات`\n' +
                '> `تعيين تقييم [on/off]`\n' +
                '> `تعيين قناة_تقييم #قناة`',
              inline: false,
            },
            {
              name: '━━━ 🎭 الرتب الذاتية ━━━',
              value: '> `تعيين رتب`',
              inline: false,
            },
            {
              name: '━━━ 🕊️ الحمام الزاجل ━━━',
              value:
                '> `بانل_زاجل`\n' +
                '> `تعيين روم_زاجل` • `تعيين عنوان_زاجل`\n' +
                '> `تعيين نص_زاجل` • `تعيين صورة_زاجل`',
              inline: false,
            },
            {
              name: '━━━ 📋 التقديمات ━━━',
              value:
                '> `بانل_تقديم` • `تعيين_تقديمات`\n' +
                '> `نتيجة @عضو [قسم] [قبول/رفض]`\n' +
                '> `تعيين تقديم بانل_عنوان/بانل_وصف/بانل_صورة`\n' +
                '> `تعيين تقديم بانل_روم` • `تعيين تقديم لوق_نتائج`',
              inline: false,
            },
            {
              name: '━━━ 🛡️ الحماية ━━━',
              value: '> `حماية` — لوحة تحكم كاملة (مع عقابات مخصصة لكل نوع)',
              inline: false,
            },
            {
              name: '━━━ ✏️ الاسم ━━━',
              value: '> `تغيير_اسم`',
              inline: false,
            },
            {
              name: '━━━ ℹ️ المعلومات ━━━',
              value:
                '> `معلومات [@شخص]`\n' +
                '> `سيرفر` • `بينق`',
              inline: false,
            },
            {
              name: '━━━ 🏷️ اسم السيرفر ━━━',
              value: '> `تعيين اسم_السيرفر [الاسم]`',
              inline: false,
            },
            {
              name: '━━━ 🖼️ الصور العامة ━━━',
              value:
                '> `تعيين صورة_بنر` • `تعيين صورة_عامة`\n' +
                '> `تعيين صورة_بانل` • `تعيين صورة_رتب`',
              inline: false,
            },
            {
              name: '━━━ 📸 إنستغرام ━━━',
              value: '> `ig [رابط]`',
              inline: false,
            },
            {
              name: '━━━ 🛑 المالك ━━━',
              value: '> `إيقاف`',
              inline: false,
            }
          )
          .setFooter({ text: `${brand} • البادئة !` });

        if (generalImage) embed.setImage(generalImage);
        await message.channel.send({ embeds: [embed] });
        return;
      }

      // ============================================================
      // ========== 🎙️ !voice — لوحة الصوت ==========
      // ============================================================
      if (cmd === 'voice' || cmd === 'صوت' || cmd === 'لوحة_الصوت') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const voiceConfig = await getGuildConfig(guildId);

        if (!voiceConfig.voiceCreatorChannelId) {
          sentReply = await message.reply('⚠️ لم يتم تعيين قناة الصانع. استخدم `!تعيين قناة_الصانع #قناة`.');
          deleteAfter(sentReply);
          return;
        }

        if (!voiceConfig.voiceCategoryId) {
          sentReply = await message.reply('⚠️ لم يتم تعيين الكاتقوري الصوتي. استخدم `!تعيين كاتقوري_صوتي #كاتقوري`.');
          deleteAfter(sentReply);
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle(voiceConfig.voicePanelTitle || '🎙️')
          .setDescription(
            '**للتحكم في رومك الصوتي:**\n\n' +
            '> ادخل قناة **🎙️ Creator Channel** لإنشاء رومك\n' +
            '> رح تنزل لك لوحة تحكم خاصة في روم اللوحة\n' +
            '> اضغط على الأزرار للتحكم في رومك'
          )
          .setColor(THEME.ORANGE)
          .setFooter({ text: brand });

        if (voiceConfig.voicePanelImage) embed.setImage(voiceConfig.voicePanelImage);

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('vc_rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_limit').setEmoji('👥').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_unlock').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
        );

        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('vc_permit').setEmoji('👤').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_reject').setEmoji('⛔').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_unblock').setEmoji('✅').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_kick').setEmoji('👢').setStyle(ButtonStyle.Secondary),
        );

        const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('vc_transfer').setEmoji('👑').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_claim').setEmoji('📌').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('vc_delete').setEmoji('❌').setStyle(ButtonStyle.Danger),
        );

        let targetChannel = message.channel;
        if (voiceConfig.voicePanelChannelId) {
          const pc = message.guild.channels.cache.get(voiceConfig.voicePanelChannelId);
          if (pc) targetChannel = pc;
        }

        try {
          await targetChannel.send({
            embeds: [embed],
            components: [row1, row2, row3],
          });
          sentReply = await message.reply(`✅ تم إنشاء لوحة الصوت في ${targetChannel}.`);
          deleteAfter(sentReply);
        } catch (err) {
          sentReply = await message.reply(`❌ فشل الإنشاء: ${err.message}`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ========== 🔍 !فحص_روم ==========
      // ============================================================
      if (cmd === 'فحص_روم') {
        const member = message.mentions.members.first() || message.member;
        const voiceChannel = member.voice?.channel;

        let embed = new EmbedBuilder()
          .setTitle('🔍 فحص الروم الصوتي')
          .setColor(THEME.ORANGE)
          .setFooter({ text: brand });

        if (!voiceChannel) {
          embed.setDescription(`❌ **${member.user.tag}** مو داخل أي روم صوتي.`);
        } else {
          const voiceData = await VoiceRoom.findOne({ guildId, channelId: voiceChannel.id });
          const ownedRoom = await VoiceRoom.findOne({ guildId, ownerId: member.id });

          embed.setDescription(
            `**🔊 الروم الحالي:** ${voiceChannel.name}\n` +
            `**🆔 آيدي:** \`${voiceChannel.id}\`\n\n` +
            `**📊 في الداتابيس؟** ${voiceData ? '✅ نعم' : '❌ لا'}\n` +
            (voiceData ? `**👑 المالك:** <@${voiceData.ownerId}>\n**🔒 مقفل:** ${voiceData.locked ? 'نعم' : 'لا'}\n**👥 الحد:** ${voiceData.userLimit === 0 ? 'بلا حد' : voiceData.userLimit}\n**✅ مسموح:** ${voiceData.trustedUsers.length}\n**⛔ ممنوع:** ${voiceData.blockedUsers.length}\n` : '') +
            `\n**🏠 روم تملكه؟** ${ownedRoom ? `<#${ownedRoom.channelId}>` : '❌ لا'}\n` +
            `\n**🎙️ قناة الصانع:** ${config.voiceCreatorChannelId ? `<#${config.voiceCreatorChannelId}>` : '❌ غير محددة'}\n` +
            `**📁 الكاتقوري:** ${config.voiceCategoryId ? `<#${config.voiceCategoryId}>` : '❌ غير محددة'}\n` +
            `**📢 روم اللوحة:** ${config.voicePanelChannelId ? `<#${config.voicePanelChannelId}>` : '❌ غير محدد'}`
          );
        }

        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== إنستغرام ==========
      // ============================================================
      if (cmd === 'ig') {
        const url = args[0];
        if (!url) {
          sentReply = await message.reply('⚠️ أدخل رابط الريلز.');
          deleteAfter(sentReply);
          return;
        }
        const loadingMsg = await message.reply('⏳ جاري التحميل...');
        try {
          const instagramGetUrl = require('instagram-url-direct');
          const result = await instagramGetUrl(url);
          const videoUrl = Array.isArray(result) ? result[0]?.url : result.url;
          if (!videoUrl) throw new Error('تعذر استخراج الفيديو.');
          const response = await fetch(videoUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const buffer = Buffer.from(await response.arrayBuffer());
          await message.reply({ files: [{ attachment: buffer, name: 'reel.mp4' }] });
          await loadingMsg.delete().catch(() => {});
        } catch (error) {
          await loadingMsg.edit({ content: `❌ فشل التحميل.` }).catch(() => {});
        }
        return;
      }

      // ============================================================
      // ========== لوحة الحماية ==========
      // ============================================================
      if (cmd === 'حماية') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const panel = await buildProtectionPanel(guildId, message.guild);
        await message.channel.send({ embeds: [panel.embed], components: panel.rows });
        return;
      }

      // ============================================================
      // ========== لوحة تحكم التقديمات ==========
      // ============================================================
      if (cmd === 'تعيين_تقديمات' || cmd === 'تعيين_التقديمات') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const sections = await getApplySections(guildId);

        const embed = new EmbedBuilder()
          .setTitle(`📋 ${brand} | إدارة التقديمات`)
          .setDescription(
            `**الأقسام:** ${sections.length}\n\n` +
            `> اختر قسماً من القائمة المنسدلة لإدارته، أو أضف قسماً جديداً.`
          )
          .setColor(THEME.ORANGE)
          .setFooter({ text: brand });

        if (sections.length) {
          const secList = sections.map(s => `${s.emoji} **${s.name}** — ${s.questions.length} سؤال`).join('\n');
          embed.addFields({ name: '📌 الأقسام الحالية', value: secList.slice(0, 1024), inline: false });
        } else {
          embed.addFields({ name: '📌 الأقسام الحالية', value: 'لا توجد أقسام بعد.', inline: false });
        }

        const options = [];
        for (const s of sections.slice(0, 24)) {
          const opt = {
            label: s.name.slice(0, 100),
            value: `section:${s.name}`.slice(0, 100),
            description: `${s.questions.length} سؤال${s.roleId ? ' • له رتبة' : ''}`.slice(0, 100),
          };
          const preparedEmoji = await prepareEmojiForSelect(s.emoji, client);
          opt.emoji = preparedEmoji;
          options.push(opt);
        }

        options.push({
          label: '➕ إضافة قسم جديد',
          value: 'apply_add_section',
          emoji: '➕',
          description: 'إضافة قسم تقديم جديد',
        });

        const selectRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('apply_admin_select')
            .setPlaceholder('اختر قسماً أو أضف جديداً...')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options)
        );

        await message.channel.send({ embeds: [embed], components: [selectRow] });
        return;
      }

      // ============================================================
      // ========== أمر النتيجة ==========
      // ============================================================
      if (cmd === 'نتيجة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const member = message.mentions.members.first();
        const type = args[1];
        const result = args[2]?.toLowerCase();

        if (!member || !type || !result) {
          sentReply = await message.reply('⚠️ الاستخدام: `!نتيجة @عضو [اسم_القسم] [قبول/رفض]`');
          deleteAfter(sentReply);
          return;
        }

        if (!['قبول', 'رفض', 'accept', 'reject'].includes(result)) {
          sentReply = await message.reply('⚠️ النتيجة غير صحيحة.');
          deleteAfter(sentReply);
          return;
        }

        const section = await getApplySectionByName(guildId, type);
        if (!section) {
          sentReply = await message.reply(`⚠️ قسم **${type}** غير موجود.`);
          deleteAfter(sentReply);
          return;
        }

        const resultNormalized = (result === 'قبول' || result === 'accept') ? 'accept' : 'reject';
        const role = section.roleId ? message.guild.roles.cache.get(section.roleId) : null;
        const logChannel = section.logChannelId ? message.guild.channels.cache.get(section.logChannelId) : null;
        const resultLog = config.applyResultLog ? message.guild.channels.cache.get(config.applyResultLog) : null;

        if (resultNormalized === 'accept') {
          if (role && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            await member.roles.add(role).catch(() => {});
          }

          const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
            .setTitle(`✅ ${member.user.username} | مقبول`)
            .setDescription(`**تم قبولك في قسم ${section.name}**`)
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: brand })
            .setColor(THEME.SUCCESS);

          if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
          if (resultLog) await resultLog.send({ embeds: [embed] }).catch(() => {});
          await member.send(`✅ تم قبولك في قسم **${section.name}**.`).catch(() => {});

          await Application.findOneAndUpdate(
            { guildId, userId: member.id, type: section.name, status: 'pending' },
            { status: 'accepted', reviewedBy: message.author.id, reviewedAt: new Date() },
            { sort: { createdAt: -1 } }
          ).catch(() => {});

          sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.SUCCESS).setDescription(`✅ تم قبول ${member} في قسم **${section.name}**`)] });
          deleteAfter(sentReply);

        } else {
          const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
            .setTitle(`❌ ${member.user.username} | مرفوض`)
            .setDescription(`**تم رفضك في قسم ${section.name}**`)
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: brand })
            .setColor(THEME.ERROR);

          if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
          if (resultLog) await resultLog.send({ embeds: [embed] }).catch(() => {});
          await member.send(`❌ تم رفضك في قسم **${section.name}**.`).catch(() => {});

          await Application.findOneAndUpdate(
            { guildId, userId: member.id, type: section.name, status: 'pending' },
            { status: 'rejected', reviewedBy: message.author.id, reviewedAt: new Date() },
            { sort: { createdAt: -1 } }
          ).catch(() => {});

          sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ERROR).setDescription(`❌ تم رفض ${member} في قسم **${section.name}**`)] });
          deleteAfter(sentReply);
        }

        logToChannel(guildId, {
          title: '📋 نتيجة تقديم',
          color: resultNormalized === 'accept' ? THEME.SUCCESS : THEME.ERROR,
          description: `**${member.user.tag}** • **${section.name}** • ${resultNormalized === 'accept' ? '✅ قبول' : '❌ رفض'} • بواسطة ${message.author}`,
        });
        return;
      }

      // ============================================================
      // ========== نظام التحكم ==========
      // ============================================================
      if (cmd === 'متحكم') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        if (member.id === client.user.id) { sentReply = await message.reply('❌ لا يمكنني جعل نفسي متحكماً.'); deleteAfter(sentReply); return; }
        if (member.id === OWNER_ID) { sentReply = await message.reply('❌ هذا هو مالك البوت.'); deleteAfter(sentReply); return; }
        if (await isController(member.id, guildId)) { sentReply = await message.reply(`⚠️ ${member} متحكم بالفعل.`); deleteAfter(sentReply); return; }

        await addController(guildId, member.id);
        logToChannel(guildId, { title: '👑 تعيين متحكم', color: THEME.ORANGE, description: `**${message.author}** جعل ${member} متحكماً.` });
        sentReply = await message.reply(`✅ تم جعل ${member} متحكماً.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'الغاء_متحكم') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        if (member.id === OWNER_ID) { sentReply = await message.reply('❌ لا يمكن إزالة صلاحية المالك.'); deleteAfter(sentReply); return; }
        if (!(await isController(member.id, guildId))) { sentReply = await message.reply(`⚠️ ${member} ليس متحكماً.`); deleteAfter(sentReply); return; }

        await removeController(guildId, member.id);
        logToChannel(guildId, { title: '🔒 إلغاء متحكم', color: THEME.BLACK, description: `**${message.author}** ألغى صلاحية ${member}.` });
        sentReply = await message.reply(`✅ تم إلغاء صلاحية التحكم عن ${member}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'قائمة_المتحكمين') {
        const controllers = await getControllers(guildId);
        if (!controllers.length) {
          sentReply = await message.reply('📋 لا يوجد متحكمون.');
          deleteAfter(sentReply);
          return;
        }
        const list = controllers.map(id => `<@${id}>`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle(`👑 ${brand} | المتحكمين`)
          .setColor(THEME.ORANGE)
          .setDescription(list)
          .setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'اصلاح_رتب') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        const allRoles = await SelfRole.find({ guildId });
        let fixed = 0;
        let valid = 0;
        for (const r of allRoles) {
          if (!parseEmoji(r.emoji)) {
            r.emoji = '🎭';
            await r.save();
            fixed++;
          } else {
            valid++;
          }
        }
        sentReply = await message.reply(`✅ تم إصلاح **${fixed}** رتبة. السليمة: **${valid}**.`);
        deleteAfter(sentReply);
        return;
      }
            // ============================================================
      // ========== !تعيين ==========
      // ============================================================
      if (cmd === 'تعيين') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const sub = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        // ========== قائمة الإعدادات الرئيسية ==========
        if (!sub) {
          const embed = new EmbedBuilder()
            .setTitle(`⚙️ ${brand} | مركز الإعدادات`)
            .setDescription(
              '**كل الإعدادات في مكان واحد** 👑\n\n' +
              '`الصيغة:` `!تعيين [الخيار] [القيمة]`\n' +
              '> أوامر الإعدادات تحتاج صلاحية **متحكم**'
            )
            .setColor(THEME.ORANGE)
            .setThumbnail(message.guild.iconURL() || null)
            .addFields(
              { name: '━━━ 🏷️ اسم السيرفر ━━━', value: '> `اسم_السيرفر [الاسم]`', inline: false },
              { name: '━━━ 🎙️ الرومات الصوتية ━━━', value: '> `قناة_الصانع #قناة` • `كاتقوري_صوتي #كاتقوري`\n> `روم_لوحة_صوت #قناة` • `صورة_فويس [رابط]` • `عنوان_فويس [نص]`', inline: false },
              { name: '━━━ 👋 الترحيب ━━━', value: '> `ترحيب` • `رسالة_ترحيب` • `عنوان_ترحيب` • `صورة_ترحيب` • `خلفية_ترحيب` • `دور_دخول`', inline: false },
              { name: '━━━ 📋 اللوق ━━━', value: '> `سجلات #قناة`', inline: false },
              { name: '━━━ 📊 المستويات ━━━', value: '> `روم_ليفل #قناة`', inline: false },
              { name: '━━━ 🤖 الأوتو لاين ━━━', value: '> `اوتر_لاين` • `صورة_اوترلاين` • `تفعيل_اوترلاين` • `تعطيل_اوترلاين` • `حذف_اوترلاين`', inline: false },
              { name: '━━━ 🎫 التذاكر ━━━', value: '> `تذكرة` • `تكت_لوق` • `فئة_تكت`', inline: false },
              { name: '━━━ 🎭 الرتب الذاتية ━━━', value: '> `رتب`', inline: false },
              { name: '━━━ ⭐ التقييمات ━━━', value: '> `تقييم [on/off]` • `قناة_تقييم`', inline: false },
              { name: '━━━ 🕊️ الزاجل ━━━', value: '> `روم_زاجل` • `عنوان_زاجل` • `نص_زاجل` • `صورة_زاجل`', inline: false },
              { name: '━━━ 📋 التقديمات ━━━', value: '> `تقديم بانل_عنوان` • `تقديم بانل_وصف` • `تقديم بانل_صورة` • `تقديم بانل_روم` • `تقديم لوق_نتائج`', inline: false },
              { name: '━━━ 💡 الاقتراحات ━━━', value: '> `روم_اقتراحات #روم`', inline: false },
              { name: '━━━ 🖼️ الصور العامة ━━━', value: '> `صورة_بنر` • `صورة_عامة` • `صورة_بانل` • `صورة_رتب`', inline: false }
            )
            .setFooter({ text: `${brand} • SETTINGS HUB` });

          if (generalImage) embed.setImage(generalImage);
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        // ========== اسم السيرفر ==========
        if (sub === 'اسم_السيرفر') {
          if (!value) {
            await updateGuildConfig(guildId, { serverName: null });
            sentReply = await message.reply(`✅ تم إلغاء الاسم المخصص. سيُستخدم: **${message.guild.name}**`);
            deleteAfter(sentReply);
            return;
          }
          if (value.length > 50) {
            sentReply = await message.reply('⚠️ الاسم طويل جداً (الحد 50 حرف).');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { serverName: value });
          sentReply = await message.reply(`✅ تم تعيين اسم السيرفر إلى: **${value}**`);
          logToChannel(guildId, { title: '🏷️ تغيير اسم السيرفر', color: THEME.ORANGE, description: `**${message.author}** • الاسم: ${value}` });
          deleteAfter(sentReply);
          return;
        }

        // ========== 🎙️ قناة الصانع ==========
        if (sub === 'قناة_الصانع' || sub === 'قناة_صانع') {
          const voiceChannel = message.mentions.channels.first();
          if (!voiceChannel) {
            await updateGuildConfig(guildId, { voiceCreatorChannelId: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين قناة الصانع.');
            deleteAfter(sentReply);
            return;
          }
          if (voiceChannel.type !== ChannelType.GuildVoice) {
            sentReply = await message.reply('⚠️ يجب أن تمنشن **قناة صوتية**.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { voiceCreatorChannelId: voiceChannel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة الصانع إلى: **${voiceChannel.name}**\n\n> 🔓 أي عضو يدخل هذه القناة → سيتم إنشاء روم صوتي خاص به.`);
          logToChannel(guildId, { title: '🎙️ تعيين قناة الصانع', color: THEME.ORANGE, description: `**${message.author}** • القناة: ${voiceChannel.name}` });
          deleteAfter(sentReply);
          return;
        }

        // ========== 🎙️ الكاتقوري الصوتي ==========
        if (sub === 'كاتقوري_صوتي' || sub === 'كاتقوري_صوت') {
          const category = message.mentions.channels.first();
          if (!category) {
            await updateGuildConfig(guildId, { voiceCategoryId: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين الكاتقوري الصوتي.');
            deleteAfter(sentReply);
            return;
          }
          if (category.type !== ChannelType.GuildCategory) {
            sentReply = await message.reply('⚠️ يجب أن تمنشن **كاتقوري** (فئة).');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { voiceCategoryId: category.id });
          sentReply = await message.reply(`✅ تم تعيين الكاتقوري الصوتي إلى: **${category.name}**\n\n> 🎙️ الرومات المؤقتة ستُنشأ داخل هذه الفئة.`);
          logToChannel(guildId, { title: '🎙️ تعيين الكاتقوري الصوتي', color: THEME.ORANGE, description: `**${message.author}** • الفئة: ${category.name}` });
          deleteAfter(sentReply);
          return;
        }

        // ========== 🎙️ روم لوحة الصوت ==========
        if (sub === 'روم_لوحة_صوت') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { voicePanelChannelId: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين روم لوحة الصوت.');
            deleteAfter(sentReply);
            return;
          }
          if (!channel.isTextBased()) {
            sentReply = await message.reply('⚠️ يجب أن تمنشن **قناة نصية**.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { voicePanelChannelId: channel.id });
          sentReply = await message.reply(`✅ تم تعيين روم لوحة الصوت إلى: **${channel}**\n\n> 🎛️ سيتم إرسال لوحة التحكم في هذا الروم.`);
          deleteAfter(sentReply);
          return;
        }

        // ========== 🎙️ صورة لوحة الصوت ==========
        if (sub === 'صورة_فويس' || sub === 'صورة_لوحة_صوت') {
          if (!value) {
            await updateGuildConfig(guildId, { voicePanelImage: null });
            sentReply = await message.reply('✅ تم إلغاء صورة لوحة الصوت.');
            deleteAfter(sentReply);
            return;
          }
          if (!value.match(/^https?:\/\/.+/)) {
            sentReply = await message.reply('⚠️ الرابط غير صالح.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { voicePanelImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة لوحة الصوت.`);
          deleteAfter(sentReply);
          return;
        }

        // ========== 🎙️ عنوان لوحة الصوت ==========
        if (sub === 'عنوان_فويس' || sub === 'عنوان_لوحة_صوت') {
          if (!value) {
            await updateGuildConfig(guildId, { voicePanelTitle: '🎙️' });
            sentReply = await message.reply('✅ تم إعادة العنوان الافتراضي `🎙️`');
            deleteAfter(sentReply);
            return;
          }
          if (value.length > 30) {
            sentReply = await message.reply('⚠️ العنوان طويل جداً (الحد 30 حرف).');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { voicePanelTitle: value });
          sentReply = await message.reply(`✅ تم تعيين عنوان اللوحة إلى: **${value}**`);
          deleteAfter(sentReply);
          return;
        }

        // ========== فئة التكت ==========
        if (sub === 'فئة_تكت') {
          const category = message.mentions.channels.first();
          if (!category) {
            const settings = await getTicketSettings(guildId);
            settings.categoryId = null;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply('✅ تم إلغاء فئة التكت.');
            deleteAfter(sentReply);
            return;
          }
          if (category.type !== ChannelType.GuildCategory) {
            sentReply = await message.reply('⚠️ يجب أن تمنشن **كاتقوري** (فئة).');
            deleteAfter(sentReply);
            return;
          }
          const settings = await getTicketSettings(guildId);
          settings.categoryId = category.id;
          await saveTicketSettings(guildId, settings);
          sentReply = await message.reply(`✅ تم تعيين فئة التكت إلى: **${category.name}**`);
          deleteAfter(sentReply);
          return;
        }

        // ========== روم الاقتراحات ==========
        if (sub === 'روم_اقتراحات') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { suggestionsChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين روم الاقتراحات.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { suggestionsChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين روم الاقتراحات إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        // ========== تكت لوق ==========
        if (sub === 'تكت_لوق' || sub === 'تيكت_لوق') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { ticketLogChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين روم استلام التذاكر.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { ticketLogChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين روم استلام التذاكر إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        // ========== التقديمات ==========
        if (sub === 'تقديم') {
          const option = args[1]?.toLowerCase();
          const optionValue = args.slice(2).join(' ');

          if (!option) {
            const embed = new EmbedBuilder()
              .setTitle('📋 إعدادات التقديمات')
              .setColor(THEME.ORANGE)
              .addFields(
                { name: '📝 العنوان', value: '`تقديم بانل_عنوان [نص]`', inline: false },
                { name: '📄 الوصف', value: '`تقديم بانل_وصف [نص]`', inline: false },
                { name: '🖼️ الصورة', value: '`تقديم بانل_صورة [رابط]`', inline: false },
                { name: '📢 الروم', value: '`تقديم بانل_روم #روم`', inline: false },
                { name: '📥 روم النتائج', value: '`تقديم لوق_نتائج #روم`', inline: false }
              )
              .setFooter({ text: brand });
            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_عنوان') {
            if (!optionValue) { sentReply = await message.reply('⚠️ أدخل العنوان.'); deleteAfter(sentReply); return; }
            await updateGuildConfig(guildId, { applyPanelTitle: optionValue });
            sentReply = await message.reply(`✅ تم تعيين العنوان: "${optionValue}"`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_وصف') {
            if (!optionValue) { sentReply = await message.reply('⚠️ أدخل الوصف.'); deleteAfter(sentReply); return; }
            await updateGuildConfig(guildId, { applyPanelDescription: optionValue });
            sentReply = await message.reply(`✅ تم تعيين الوصف.`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_صورة') {
            if (!optionValue) {
              await updateGuildConfig(guildId, { applyPanelImage: null });
              sentReply = await message.reply('✅ تم إلغاء الصورة.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyPanelImage: optionValue });
            sentReply = await message.reply(`✅ تم تعيين الصورة.`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_روم') {
            const channel = message.mentions.channels.first();
            if (!channel) {
              await updateGuildConfig(guildId, { applyPanelChannel: null });
              sentReply = await message.reply('✅ تم إلغاء الروم.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyPanelChannel: channel.id });
            sentReply = await message.reply(`✅ تم تعيين الروم إلى ${channel}`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'لوق_نتائج') {
            const channel = message.mentions.channels.first();
            if (!channel) {
              await updateGuildConfig(guildId, { applyResultLog: null });
              sentReply = await message.reply('✅ تم إلغاء روم النتائج.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyResultLog: channel.id });
            sentReply = await message.reply(`✅ تم تعيين روم النتائج إلى ${channel}`);
            deleteAfter(sentReply);
            return;
          }

          sentReply = await message.reply('⚠️ خيار غير معروف.');
          deleteAfter(sentReply);
          return;
        }

        // ========== الزاجل ==========
        if (sub === 'روم_زاجل') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { pigeonChannel: null });
            sentReply = await message.reply('✅ تم إلغاء روم الزاجل.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { pigeonChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين روم الزاجل إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'عنوان_زاجل') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل العنوان.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { pigeonTitle: value });
          sentReply = await message.reply(`✅ تم تعيين العنوان: "${value}"`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'نص_زاجل') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل النص.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { pigeonDescription: value });
          sentReply = await message.reply(`✅ تم تعيين النص.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_زاجل') {
          if (!value) {
            await updateGuildConfig(guildId, { pigeonImage: null });
            sentReply = await message.reply('✅ تم إلغاء صورة الزاجل.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { pigeonImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة الزاجل.`);
          deleteAfter(sentReply);
          return;
        }

        // ========== الرتب الذاتية ==========
        if (sub === 'رتب') {
          const action = args[1]?.toLowerCase();
          const rest = args.slice(2);

          if (!action) {
            const selfRoles = await getSelfRoles(guildId);
            const listText = selfRoles.length
              ? selfRoles.map((r, i) => {
                  const role = message.guild.roles.cache.get(r.roleId);
                  return `**${i + 1}.** ${r.emoji} **${r.label}** ${role ? `→ ${role}` : '⚠️ (محذوفة)'}`;
                }).join('\n')
              : 'لا توجد رتب مسجلة بعد.';

            const embed = new EmbedBuilder()
              .setTitle(`🎭 ${brand} | إدارة الرتب الذاتية`)
              .setColor(THEME.ORANGE)
              .setDescription('نظام يسمح للأعضاء باختيار رتبهم بأنفسهم من قائمة منسدلة.')
              .addFields(
                { name: '➕ إضافة رتبة', value: '`!تعيين رتب اضافة @رتبة [الاسم] [الايموجي] [رابط_صورة]`', inline: false },
                { name: '✏️ تعديل رتبة', value: '`!تعيين رتب تعديل @رتبة [الاسم/الايموجي/الصورة/الوصف] [القيمة]`', inline: false },
                { name: '🗑️ حذف رتبة', value: '`!تعيين رتب حذف @رتبة`', inline: false },
                { name: '📋 عرض الرتب', value: '`!تعيين رتب عرض`', inline: false },
                { name: '📢 إرسال البانل', value: '`!تعيين رتب بانل [#قناة]`', inline: false },
                { name: '🖼️ صورة البانل', value: '`!تعيين رتب صورة_بانل [رابط]`', inline: false },
                { name: '📝 نص البانل', value: '`!تعيين رتب نص_بانل [النص]`', inline: false },
                { name: '🔢 ترتيب رتبة', value: '`!تعيين رتب ترتيب @رتبة [رقم]`', inline: false },
                { name: '📌 الرتب المسجلة', value: listText.slice(0, 1024), inline: false }
              )
              .setFooter({ text: `${brand} • ${selfRoles.length} رتبة مسجلة` });
            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'اضافة' || action === 'إضافة') {
            const role = message.mentions.roles.first();
            if (!role) {
              sentReply = await message.reply('⚠️ منشن الرتبة.\nالصيغة: `!تعيين رتب اضافة @رتبة [الاسم] [الايموجي] [رابط_صورة]`');
              deleteAfter(sentReply);
              return;
            }
            const label = rest[0] || role.name;
            let emoji = rest[1] || '🎭';
            const image = rest[2] && rest[2].match(/^https?:\/\//) ? rest[2] : null;
            const description = rest.slice(image ? 3 : 2).join(' ') || '';
            if (!parseEmoji(emoji)) emoji = '🎭';
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
              sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
              deleteAfter(sentReply);
              return;
            }
            if (role.position >= message.guild.members.me.roles.highest.position) {
              sentReply = await message.reply('❌ هذه الرتبة أعلى من رتبة البوت.');
              deleteAfter(sentReply);
              return;
            }
            const added = await addSelfRole(guildId, role.id, label, emoji, image, description);
            const embed = new EmbedBuilder()
              .setTitle(added ? '✅ تم إضافة الرتبة' : '🔄 تم تحديث الرتبة')
              .setColor(THEME.ORANGE)
              .addFields(
                { name: '🎭 الرتبة', value: `${role}`, inline: true },
                { name: '📝 الاسم', value: label, inline: true },
                { name: '😀 الإيموجي', value: emoji, inline: true }
              )
              .setFooter({ text: brand });
            if (image) embed.setImage(image);
            if (description) embed.addFields({ name: '📄 الوصف', value: description, inline: false });
            sentReply = await message.channel.send({ embeds: [embed] });
            logToChannel(guildId, { title: '🎭 إضافة رتبة', color: THEME.ORANGE, description: `**${message.author}** أضاف **${label}**` });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'تعديل') {
            const role = message.mentions.roles.first();
            if (!role) { sentReply = await message.reply('⚠️ منشن الرتبة.'); deleteAfter(sentReply); return; }
            const existing = await SelfRole.findOne({ guildId, roleId: role.id });
            if (!existing) { sentReply = await message.reply('⚠️ هذه الرتبة غير مسجلة.'); deleteAfter(sentReply); return; }
            const option = rest[0]?.toLowerCase();
            const newValue = rest.slice(1).join(' ');
            if (!option || !newValue) {
              sentReply = await message.reply('⚠️ الصيغة: `!تعيين رتب تعديل @رتبة [الاسم/الايموجي/الصورة/الوصف] [القيمة]`');
              deleteAfter(sentReply);
              return;
            }
            const updateData = {};
            if (option === 'الاسم') updateData.label = newValue;
            else if (option === 'الايموجي') {
              if (!parseEmoji(newValue)) { sentReply = await message.reply('⚠️ الإيموجي غير صالح.'); deleteAfter(sentReply); return; }
              updateData.emoji = newValue;
            }
            else if (option === 'الصورة') updateData.image = newValue;
            else if (option === 'الوصف') updateData.description = newValue;
            else { sentReply = await message.reply('⚠️ خيار غير معروف.'); deleteAfter(sentReply); return; }
            await updateSelfRole(guildId, role.id, updateData);
            sentReply = await message.reply(`✅ تم تعديل الرتبة.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'حذف') {
            const role = message.mentions.roles.first();
            if (!role) { sentReply = await message.reply('⚠️ منشن الرتبة.'); deleteAfter(sentReply); return; }
            const removed = await removeSelfRole(guildId, role.id);
            if (!removed) { sentReply = await message.reply('⚠️ هذه الرتبة غير مسجلة.'); deleteAfter(sentReply); return; }
            sentReply = await message.reply(`✅ تم حذف الرتبة **${role.name}**.`);
            logToChannel(guildId, { title: '🗑️ حذف رتبة', color: THEME.BLACK, description: `**${message.author}** حذف **${role.name}**` });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'عرض') {
            const selfRoles = await getSelfRoles(guildId);
            if (!selfRoles.length) { sentReply = await message.reply('📭 لا توجد رتب مسجلة.'); deleteAfter(sentReply); return; }
            const embed = new EmbedBuilder()
              .setTitle(`📋 ${brand} | الرتب المسجلة`)
              .setColor(THEME.ORANGE)
              .setFooter({ text: brand });
            for (const r of selfRoles) {
              const role = message.guild.roles.cache.get(r.roleId);
              let val = `**الاسم:** ${r.label}\n**الايموجي:** ${r.emoji}\n**الرتبة:** ${role ? role.toString() : '⚠️ محذوفة'}`;
              if (r.description) val += `\n**الوصف:** ${r.description}`;
              embed.addFields({ name: `${r.emoji} ${r.label}`, value: val, inline: false });
            }
            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'صورة_بانل') {
            const image = rest.join(' ');
            if (!image) {
              await updateGuildConfig(guildId, { rolesImage: null });
              sentReply = await message.reply('✅ تم إلغاء صورة البانل.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { rolesImage: image });
            sentReply = await message.reply(`✅ تم تعيين صورة البانل.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'نص_بانل') {
            const text = rest.join(' ');
            if (!text) { sentReply = await message.reply('⚠️ أدخل النص.'); deleteAfter(sentReply); return; }
            await updateGuildConfig(guildId, { rolesPanelText: text });
            sentReply = await message.reply(`✅ تم تعيين نص البانل.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'ترتيب') {
            const role = message.mentions.roles.first();
            const order = parseInt(rest[0]);
            if (!role || isNaN(order)) { sentReply = await message.reply('⚠️ الصيغة: `!تعيين رتب ترتيب @رتبة [رقم]`'); deleteAfter(sentReply); return; }
            const existing = await SelfRole.findOne({ guildId, roleId: role.id });
            if (!existing) { sentReply = await message.reply('⚠️ هذه الرتبة غير مسجلة.'); deleteAfter(sentReply); return; }
            await updateSelfRole(guildId, role.id, { order });
            sentReply = await message.reply(`✅ تم تعيين الترتيب.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'بانل') {
            const panel = await buildSelfRolesPanel(guildId, message.guild, config);
            if (!panel) { sentReply = await message.reply('⚠️ لا توجد رتب مسجلة.'); deleteAfter(sentReply); return; }
            const targetChannel = message.mentions.channels.first() || message.channel;
            try {
              await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
              logToChannel(guildId, { title: '📢 إرسال بانل الرتب', color: THEME.ORANGE, description: `**${message.author}** أرسل البانل في ${targetChannel}` });
              sentReply = await message.reply(`✅ تم إرسال البانل.`);
              deleteAfter(sentReply);
            } catch (err) {
              sentReply = await message.reply(`❌ فشل الإرسال.`);
              deleteAfter(sentReply);
            }
            return;
          }

          sentReply = await message.reply('⚠️ خيار غير معروف.');
          deleteAfter(sentReply);
          return;
        }

        // ========== الترحيب ==========
        if (sub === 'ترحيب') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { welcomeChannel: null });
            sentReply = await message.reply('✅ تم إلغاء قناة الترحيب.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة الترحيب إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'رسالة_ترحيب') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل النص.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { welcomeMessage: value });
          sentReply = await message.reply(`✅ تم تعيين نص الترحيب.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_ترحيب') {
          if (!value) {
            await updateGuildConfig(guildId, { welcomeImage: null });
            sentReply = await message.reply('✅ تم إلغاء صورة الترحيب.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة الترحيب.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'عنوان_ترحيب') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل العنوان.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { welcomeTitle: value });
          sentReply = await message.reply(`✅ تم تعيين العنوان.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'خلفية_ترحيب') {
          if (!value) {
            await updateGuildConfig(guildId, { welcomeBackground: null });
            sentReply = await message.reply('✅ تم إلغاء الخلفية.');
            deleteAfter(sentReply);
            return;
          }
          const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
          const isUrl = /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i.test(value);
          if (!isHex && !isUrl) { sentReply = await message.reply('⚠️ أدخل لون Hex أو رابط صورة.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { welcomeBackground: value });
          sentReply = await message.reply(`✅ تم تعيين الخلفية.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'سجلات') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { logChannel: null });
            sentReply = await message.reply('✅ تم إلغاء قناة اللوق.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { logChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة اللوق إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'روم_ليفل') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { levelChannelId: null });
            sentReply = await message.reply('✅ تم إلغاء قناة الليفل.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { levelChannelId: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة الليفل إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'اوتر_لاين') {
          const channel = message.mentions.channels.first();
          if (!channel) { sentReply = await message.reply('⚠️ منشن الروم.'); deleteAfter(sentReply); return; }
          const text = args.slice(2).join(' ');
          await setAutoLine(guildId, channel.id, { text: text || null, enabled: true });
          sentReply = await message.reply(`✅ تم تعيين الأوتو لاين في ${channel}.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_اوترلاين') {
          const channel = message.mentions.channels.first();
          if (!channel) { sentReply = await message.reply('⚠️ منشن الروم.'); deleteAfter(sentReply); return; }
          const imageUrl = args.slice(2).join(' ');
          if (!imageUrl) {
            await setAutoLine(guildId, channel.id, { image: null });
            sentReply = await message.reply(`✅ تم إزالة الصورة.`);
            deleteAfter(sentReply);
            return;
          }
          await setAutoLine(guildId, channel.id, { image: imageUrl });
          sentReply = await message.reply(`✅ تم تعيين الصورة.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تفعيل_اوترلاين') {
          const channel = message.mentions.channels.first();
          if (!channel) { sentReply = await message.reply('⚠️ منشن الروم.'); deleteAfter(sentReply); return; }
          await setAutoLine(guildId, channel.id, { enabled: true });
          sentReply = await message.reply(`✅ تم التفعيل.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تعطيل_اوترلاين') {
          const channel = message.mentions.channels.first();
          if (!channel) { sentReply = await message.reply('⚠️ منشن الروم.'); deleteAfter(sentReply); return; }
          await setAutoLine(guildId, channel.id, { enabled: false });
          sentReply = await message.reply(`⏹️ تم التعطيل.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'حذف_اوترلاين' || sub === 'حذف_اوتر_لاين') {
          const channel = message.mentions.channels.first();
          if (!channel) { sentReply = await message.reply('⚠️ منشن الروم.'); deleteAfter(sentReply); return; }
          await deleteAutoLine(guildId, channel.id);
          sentReply = await message.reply(`🗑️ تم الحذف.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'دور_دخول') {
          const role = message.mentions.roles.first();
          if (!role) { sentReply = await message.reply('⚠️ منشن الدور.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { joinRole: role.id });
          sentReply = await message.reply(`✅ تم تعيين دور الدخول.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_بانل') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل الرابط.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { ticketPanelImage: value });
          sentReply = await message.reply(`✅ تم التعيين.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_رتب') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل الرابط.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { rolesImage: value });
          sentReply = await message.reply(`✅ تم التعيين.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_بنر') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل الرابط.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { bannerImage: value });
          sentReply = await message.reply(`✅ تم التعيين.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_عامة') {
          if (!value) { sentReply = await message.reply('⚠️ أدخل الرابط.'); deleteAfter(sentReply); return; }
          await updateGuildConfig(guildId, { generalImage: value });
          sentReply = await message.reply(`✅ تم التعيين.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تقييم') {
          if (!value || !['on', 'off'].includes(value.toLowerCase())) {
            sentReply = await message.reply('⚠️ الصيغة: `!تعيين تقييم [on/off]`');
            deleteAfter(sentReply);
            return;
          }
          const enabled = value.toLowerCase() === 'on';
          await updateGuildConfig(guildId, { ticketRatingEnabled: enabled });
          sentReply = await message.reply(`✅ تم ${enabled ? 'تفعيل' : 'تعطيل'} التقييم.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'قناة_تقييم') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { ticketRatingChannel: null });
            sentReply = await message.reply('✅ تم إلغاء القناة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { ticketRatingChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين القناة إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        // ========== التذاكر ==========
        if (sub === 'تذكرة') {
          const settings = await getTicketSettings(guildId);
          const action = args[1]?.toLowerCase();
          const actionValue = args.slice(2).join(' ');

          if (!action) {
            const embed = new EmbedBuilder()
              .setTitle('🎫 إدارة التذاكر')
              .setColor(THEME.ORANGE)
              .addFields(
                { name: '📝 تغيير العنوان', value: '`!تعيين تذكرة عنوان [العنوان الجديد]`', inline: false },
                { name: '➕ إضافة قسم', value: '`!تعيين تذكرة إضافة [الاسم] @دور :ايموجي:`', inline: false },
                { name: '🎨 تعيين إيموجي', value: '`!تعيين تذكرة تعيين_ايموجي [الاسم] :ايموجي:`', inline: false },
                { name: '➖ حذف قسم', value: '`!تعيين تذكرة حذف [الاسم]`', inline: false },
                { name: '📝 تغيير النص', value: '`!تعيين تذكرة نص [النص]`', inline: false },
                { name: '🖼️ تغيير الصورة', value: '`!تعيين تذكرة صورة [رابط]`', inline: false },
                { name: '📂 الفئة', value: '`!تعيين فئة_تكت #كاتقوري`', inline: false },
                { name: '👀 عرض الأقسام', value: '`!عرض_تذكرة`', inline: false }
              )
              .setFooter({ text: brand });
            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'عنوان') {
            if (!actionValue) {
              sentReply = await message.reply('⚠️ الصيغة: `!تعيين تذكرة عنوان [العنوان الجديد]`');
              deleteAfter(sentReply);
              return;
            }
            settings.panelTitle = actionValue;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم تغيير العنوان إلى:\n**${actionValue}**`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'إضافة') {
            const parts = actionValue.match(/^(.+?)\s+<@&(\d+)>\s*(\S+)?$/);
            if (!parts) { sentReply = await message.reply('⚠️ الصيغة: `!تعيين تذكرة إضافة [الاسم] @دور :ايموجي:`'); deleteAfter(sentReply); return; }
            const sectionName = parts[1].trim();
            const roleId = parts[2];
            let emoji = parts[3] || '📌';
            if (!parseEmoji(emoji)) emoji = '📌';
            if (settings.sections.find(s => s.name === sectionName)) {
              sentReply = await message.reply(`⚠️ القسم موجود بالفعل.`);
              deleteAfter(sentReply);
              return;
            }
            settings.sections.push({ name: sectionName, roleId, emoji });
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم إضافة قسم **${sectionName}**.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'تعيين_ايموجي') {
            const parts = actionValue.match(/^(.+?)\s+(\S+)$/);
            if (!parts) { sentReply = await message.reply('⚠️ الصيغة غير صحيحة.'); deleteAfter(sentReply); return; }
            const sectionName = parts[1].trim();
            let emoji = parts[2];
            if (!parseEmoji(emoji)) emoji = '📌';
            const section = settings.sections.find(s => s.name === sectionName);
            if (!section) { sentReply = await message.reply(`⚠️ القسم غير موجود.`); deleteAfter(sentReply); return; }
            section.emoji = emoji;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم التعيين.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'حذف') {
            const sectionName = actionValue.trim();
            const index = settings.sections.findIndex(s => s.name === sectionName);
            if (index === -1) { sentReply = await message.reply(`⚠️ القسم غير موجود.`); deleteAfter(sentReply); return; }
            settings.sections.splice(index, 1);
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم الحذف.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'نص') {
            if (!actionValue) { sentReply = await message.reply('⚠️ أدخل النص.'); deleteAfter(sentReply); return; }
            settings.text = actionValue;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم التغيير.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'صورة') {
            if (!actionValue) { sentReply = await message.reply('⚠️ أدخل الرابط.'); deleteAfter(sentReply); return; }
            settings.image = actionValue;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم التغيير.`);
            deleteAfter(sentReply);
            return;
          }

          sentReply = await message.reply('⚠️ أمر غير معروف.');
          deleteAfter(sentReply);
          return;
        }

        sentReply = await message.reply('⚠️ خيار غير معروف. استخدم `!تعيين` لعرض القائمة.');
        deleteAfter(sentReply);
        return;
      }
            // ============================================================
      // ========== بانل الزاجل ==========
      // ============================================================
      if (cmd === 'بانل_زاجل') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const updatedConfig = await getGuildConfig(guildId);
        const panel = await buildPigeonPanel(updatedConfig, message.guild);

        let targetChannel = message.channel;
        if (updatedConfig.pigeonChannel) {
          const pChannel = message.guild.channels.cache.get(updatedConfig.pigeonChannel);
          if (pChannel) targetChannel = pChannel;
        }

        try {
          await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
          sentReply = await message.reply(`✅ تم إنشاء البانل في ${targetChannel}.`);
          deleteAfter(sentReply);
        } catch (err) {
          sentReply = await message.reply(`❌ فشل الإنشاء.`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ========== بانل التقديمات ==========
      // ============================================================
      if (cmd === 'بانل_تقديم') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const updatedConfig = await getGuildConfig(guildId);
        const panel = await buildApplyPanel(guildId, updatedConfig, message.guild);

        if (panel.empty) {
          sentReply = await message.reply('⚠️ لا توجد أقسام. استخدم `!تعيين_تقديمات`.');
          deleteAfter(sentReply);
          return;
        }

        let targetChannel = message.channel;
        if (updatedConfig.applyPanelChannel) {
          const applyCh = message.guild.channels.cache.get(updatedConfig.applyPanelChannel);
          if (applyCh) targetChannel = applyCh;
        }

        try {
          await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
          sentReply = await message.reply(`✅ تم الإنشاء في ${targetChannel}.`);
          deleteAfter(sentReply);
        } catch (err) {
          sentReply = await message.reply(`❌ فشل الإنشاء.`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ========== بانل التذاكر ==========
      // ============================================================
      if (cmd === 'بانل') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const settings = await getTicketSettings(guildId);
        const imageUrl = settings.image || null;
        const embed = new EmbedBuilder()
          .setTitle(settings.panelTitle || `🎫 ${brand} | مركز الدعم`)
          .setDescription(settings.text)
          .setColor(THEME.ORANGE)
          .setFooter({ text: brand });
        if (imageUrl) embed.setImage(imageUrl);
        if (generalImage) embed.setThumbnail(generalImage);

        const options = [];
        for (const s of settings.sections) {
          const opt = { label: s.name, value: s.name };
          const preparedEmoji = await prepareEmojiForSelect(s.emoji, client);
          opt.emoji = preparedEmoji;
          options.push(opt);
        }
        if (!options.length) {
          sentReply = await message.reply('⚠️ لا توجد أقسام.');
          deleteAfter(sentReply);
          return;
        }
        options.push({
          label: 'إعادة تعيين القائمة',
          value: 'TICKET_RESET',
          emoji: '🔄',
          description: 'إعادة التعيين',
        });
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId('ticket_menu').setPlaceholder('اختر القسم...').addOptions(options)
        );
        try {
          await message.channel.send({ embeds: [embed], components: [row] });
          sentReply = await message.reply('✅ تم الإنشاء.');
          deleteAfter(sentReply);
        } catch (err) {
          sentReply = await message.reply(`❌ فشل الإنشاء.`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ========== عرض التذكرة ==========
      // ============================================================
      if (cmd === 'عرض_تذكرة') {
        const settings = await getTicketSettings(guildId);
        const category = settings.categoryId ? message.guild.channels.cache.get(settings.categoryId) : null;
        const embed = new EmbedBuilder().setTitle('📋 إعدادات التذاكر').setColor(THEME.ORANGE)
          .setDescription(`**العنوان:** ${settings.panelTitle}\n**النص:** ${settings.text}`)
          .addFields(
            { name: '📌 الأقسام', value: settings.sections.map((s, i) => `${i+1}. ${s.emoji || '📌'} **${s.name}** ${s.roleId ? `<@&${s.roleId}>` : '(بدون دور)'}`).join('\n') || 'لا يوجد أقسام', inline: false },
            { name: '📂 فئة التكت', value: category ? category.toString() : '❌ غير محددة', inline: true },
            { name: '📥 روم استلام التذاكر', value: config.ticketLogChannel ? `<#${config.ticketLogChannel}>` : 'لم يتم التعيين', inline: true }
          )
          .setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== التقييمات ==========
      // ============================================================
      if (cmd === 'تقييمات' || cmd === 'عرض_التقييمات') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const allRatings = await TicketRating.find({ guildId, rating: { $exists: true, $ne: null } });
        const recentRatings = await TicketRating.find({ guildId }).sort({ createdAt: -1 }).limit(10);

        if (!allRatings.length && !recentRatings.length) {
          sentReply = await message.reply('📭 لا توجد تقييمات.');
          deleteAfter(sentReply);
          return;
        }

        const avg = allRatings.length
          ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(2)
          : '0';

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of allRatings) {
          if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++;
        }

        let desc = `**📊 متوسط التقييم:** ${avg}/5 ⭐\n`;
        desc += `**📈 إجمالي:** ${allRatings.length}\n\n`;
        desc += `**توزيع التقييمات:**\n`;
        for (let i = 5; i >= 1; i--) {
          const count = distribution[i];
          const bar = '█'.repeat(Math.min(count, 20));
          desc += `${'⭐'.repeat(i)} (${count}) ${bar}\n`;
        }
        desc += `\n**آخر 10 تقييمات:**\n\n`;

        for (const r of recentRatings) {
          const stars = r.rating ? '⭐'.repeat(r.rating) : '—';
          const user = await client.users.fetch(r.userId).catch(() => null);
          const name = user ? user.username : `مستخدم`;
          desc += `**${name}** - ${stars}${r.rating ? ` (${r.rating}/5)` : ''}\n`;
          if (r.section) desc += `> 📌 ${r.section}\n`;
          if (r.comment) desc += `> 💬 ${r.comment}\n`;
          desc += `\n`;
        }

        const embed = new EmbedBuilder()
          .setTitle(`⭐ ${brand} | تقييمات التذاكر`)
          .setColor(THEME.ORANGE)
          .setDescription(desc.slice(0, 4000))
          .setFooter({ text: `${brand} • إجمالي: ${allRatings.length}` });

        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== اختبار اللوق ==========
      // ============================================================
      if (cmd === 'اختبار_لوق') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!config.logChannel) {
          sentReply = await message.reply('⚠️ لم يتم تعيين قناة اللوق.');
          deleteAfter(sentReply);
          return;
        }
        const channel = message.guild.channels.cache.get(config.logChannel);
        if (!channel) {
          sentReply = await message.reply('❌ القناة غير موجودة.');
          deleteAfter(sentReply);
          return;
        }
        logToChannel(guildId, { title: '🧪 اختبار', color: THEME.ORANGE, description: `✅ اللوق يعمل!\n**المنفذ:** ${message.author}` });
        sentReply = await message.reply('✅ تم الإرسال.');
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== المستوى والترتيب ==========
      // ============================================================
      if (cmd === 'مستوى') {
        const member = message.mentions.members.first() || message.member;
        const userData = await getUserData(guildId, member.id);
        const embed = new EmbedBuilder()
          .setTitle(`📊 مستوى ${member.user.username}`)
          .setColor(THEME.ORANGE)
          .addFields(
            { name: 'المستوى', value: `${userData.level}`, inline: true },
            { name: 'XP', value: `${userData.xp}/${(userData.level + 1) * 100}`, inline: true },
            { name: 'الرسائل', value: `${userData.messages}`, inline: true }
          )
          .setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'ترتيب') {
        const top = await User.find({ guildId }).sort({ level: -1, xp: -1 }).limit(10);
        if (!top.length) {
          sentReply = await message.reply('📭 لا توجد بيانات.');
          deleteAfter(sentReply);
          return;
        }
        let desc = '';
        let rank = 1;
        for (const entry of top) {
          const member = message.guild.members.cache.get(entry.userId);
          const name = member ? member.user.username : `مستخدم`;
          desc += `#${rank} ${name} - المستوى ${entry.level} (XP: ${entry.xp})\n`;
          rank++;
        }
        const embed = new EmbedBuilder().setTitle(`🏆 ${brand} | الترتيب`).setColor(THEME.ORANGE).setDescription(desc).setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'معلومات') {
        const member = message.mentions.members.first() || message.member;
        const embed = new EmbedBuilder().setTitle(`ℹ️ ${member.user.username}`).setColor(THEME.ORANGE)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: '🎭 أعلى رتبة', value: member.roles.highest.toString(), inline: true },
            { name: '🔊 في روم صوتي', value: member.voice.channel ? member.voice.channel.name : 'لا', inline: true }
          )
          .setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'سيرفر') {
        const embed = new EmbedBuilder().setTitle(brand).setColor(THEME.ORANGE)
          .addFields(
            { name: '👥 الأعضاء', value: `${message.guild.memberCount}`, inline: true },
            { name: '💬 القنوات', value: `${message.guild.channels.cache.size}`, inline: true },
            { name: '👑 المالك', value: `<@${message.guild.ownerId}>`, inline: true }
          )
          .setThumbnail(message.guild.iconURL())
          .setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'بينق') {
        const embed = new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`🏓 البينق: ${client.ws.ping}ms`).setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== تغيير الاسم ==========
      // ============================================================
      if (cmd === 'تغيير_اسم') {
        const last = await getNameCooldown(userId);
        if (last instanceof Date && Date.now() - last.getTime() < 5 * 60 * 60 * 1000) {
          const remaining = Math.ceil((5 * 60 * 60 * 1000 - (Date.now() - last.getTime())) / (60 * 60 * 1000));
          sentReply = await message.reply(`⏳ يمكنك تغيير اسمك بعد ${remaining} ساعة.`);
          deleteAfter(sentReply);
          return;
        }
        const embed = new EmbedBuilder()
          .setTitle('✏️ تغيير الاسم')
          .setDescription('اضغط على الزر أدناه لتغيير اسمك.')
          .setColor(THEME.ORANGE)
          .setFooter({ text: 'يمكنك التغيير مرة كل 5 ساعات.' });
        if (generalImage) embed.setImage(generalImage);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_name_modal').setLabel('تغيير الاسم').setEmoji('✏️').setStyle(BTN.MAIN));
        sentReply = await message.channel.send({ embeds: [embed], components: [row] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== الردود التلقائية ==========
      // ============================================================
      if (cmd === 'رد_تلقائي') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const keyword = args[0];
        const reply = args.slice(1).join(' ');
        if (!keyword || !reply) {
          sentReply = await message.reply('⚠️ الصيغة: `!رد_تلقائي [الكلمة] [الرد]`');
          deleteAfter(sentReply);
          return;
        }
        const added = await addAutoReply(guildId, keyword, reply);
        sentReply = await message.reply(`✅ ${added ? 'تم الإضافة' : 'تم التحديث'}: **${keyword}**`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'رد_تلقائي_صورة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const keyword = args[0];
        const image = args[args.length - 1];
        const reply = args.slice(1, -1).join(' ');
        if (!keyword || !reply || !image) {
          sentReply = await message.reply('⚠️ الصيغة: `!رد_تلقائي_صورة [الكلمة] [الرد] [رابط_الصورة]`');
          deleteAfter(sentReply);
          return;
        }
        if (!image.match(/^https?:\/\/.+/)) {
          sentReply = await message.reply('⚠️ الرابط غير صالح.');
          deleteAfter(sentReply);
          return;
        }
        const added = await addAutoReply(guildId, keyword, reply, image);
        sentReply = await message.reply(`✅ ${added ? 'تم الإضافة' : 'تم التحديث'}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'حذف_رد_تلقائي') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const keyword = args.join(' ');
        if (!keyword) {
          sentReply = await message.reply('⚠️ اكتب الكلمة.');
          deleteAfter(sentReply);
          return;
        }
        const removed = await removeAutoReply(guildId, keyword);
        if (!removed) {
          sentReply = await message.reply(`⚠️ لا يوجد رد للكلمة.`);
          deleteAfter(sentReply);
          return;
        }
        sentReply = await message.reply(`✅ تم الحذف.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'عرض_الردود') {
        const replies = await getAutoReplies(guildId);
        if (!replies.length) {
          sentReply = await message.reply('📭 لا توجد ردود.');
          deleteAfter(sentReply);
          return;
        }
        const list = replies.map((r, i) => `${i+1}. **${r.keyword}** → ${r.reply}${r.image ? ' (🖼️)' : ''}`).join('\n');
        const embed = new EmbedBuilder().setTitle('💬 الردود التلقائية').setColor(THEME.ORANGE).setDescription(list).setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== قول / ايمبد / اعلان ==========
      // ============================================================
      if (cmd === 'قول') {
        const text = args.join(' ');
        if (!text) {
          sentReply = await message.reply('⚠️ اكتب النص.');
          deleteAfter(sentReply);
          return;
        }
        await message.channel.send(text);
        return;
      }

      if (cmd === 'ايمبد') {
        const fullText = args.join(' ');
        if (!fullText) {
          sentReply = await message.reply('⚠️ الصيغة: `!ايمبد [العنوان] ، [الوصف]`');
          deleteAfter(sentReply);
          return;
        }
        const parts = fullText.split(/[،,]\s*/).map(s => s.trim());
        let title = 'بدون عنوان', description = fullText;
        if (parts.length >= 2) { title = parts[0]; description = parts.slice(1).join(' ، '); }
        const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(THEME.ORANGE).setFooter({ text: brand });
        const imageMatch2 = description.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/i);
        if (imageMatch2) { embed.setImage(imageMatch2[1]); embed.setDescription(description.replace(imageMatch2[1], '').trim() || 'بدون وصف'); }
        if (generalImage) embed.setThumbnail(generalImage);
        await message.channel.send({ embeds: [embed] });
        return;
      }

      if (cmd === 'اعلان') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        let mentionType = 'everyone';
        let text = args.join(' ');
        if (args[0]?.toLowerCase() === 'here') { mentionType = 'here'; text = args.slice(1).join(' '); }
        if (!text) {
          sentReply = await message.reply('⚠️ اكتب النص.');
          deleteAfter(sentReply);
          return;
        }
        const embed = new EmbedBuilder()
          .setTitle(`📢 ${brand} | إعلان`)
          .setDescription(text)
          .setColor(THEME.ORANGE)
          .setFooter({ text: message.author.tag });
        if (generalImage) embed.setImage(generalImage);
        await message.channel.send({ content: mentionType === 'everyone' ? '@everyone' : '@here', embeds: [embed] });
        return;
      }

      // ============================================================
      // ========== إدارة الرتب ==========
      // ============================================================
      if (cmd === 'اعطاء_رتبة') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        const role = message.mentions.roles.first();
        if (!role) { sentReply = await message.reply('⚠️ منشن الرتبة.'); deleteAfter(sentReply); return; }
        if (role.position >= message.member.roles.highest.position && !(OWNER_ID && message.author.id === OWNER_ID)) {
          sentReply = await message.reply('❌ لا يمكنك إعطاء رتبة أعلى من رتبتك.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
          deleteAfter(sentReply);
          return;
        }
        await member.roles.add(role);
        sentReply = await message.reply(`✅ تم إعطاء ${role} لـ ${member}.`);
        logToChannel(guildId, { title: '🎭 إعطاء رتبة', color: THEME.ORANGE, description: `**${message.author}** • **${member.user.tag}** • ${role.name}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'سحب_رتبة') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        const role = message.mentions.roles.first();
        if (!role) { sentReply = await message.reply('⚠️ منشن الرتبة.'); deleteAfter(sentReply); return; }
        if (role.position >= message.member.roles.highest.position && !(OWNER_ID && message.author.id === OWNER_ID)) {
          sentReply = await message.reply('❌ لا يمكنك سحب رتبة أعلى من رتبتك.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
          deleteAfter(sentReply);
          return;
        }
        await member.roles.remove(role);
        sentReply = await message.reply(`✅ تم سحب ${role} من ${member}.`);
        logToChannel(guildId, { title: '🎭 سحب رتبة', color: THEME.BLACK, description: `**${message.author}** • **${member.user.tag}** • ${role.name}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'عرض_رتب') {
        const member = message.mentions.members.first() || message.member;
        const roles = member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).join(' ') || 'لا يوجد رتب';
        const embed = new EmbedBuilder().setTitle(`🎭 رتب ${member.user.username}`).setColor(THEME.ORANGE).setDescription(roles).setFooter({ text: brand });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== إنشاء / تثبيت قناة ==========
      // ============================================================
      if (cmd === 'انشاء_قناة') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.'); deleteAfter(sentReply); return; }
        const name = args.join(' ');
        if (!name) { sentReply = await message.reply('⚠️ أدخل الاسم.'); deleteAfter(sentReply); return; }
        const safeName = sanitizeChannelName(name);
        const channel = await message.guild.channels.create({ name: safeName, type: ChannelType.GuildText });
        sentReply = await message.reply(`✅ تم إنشاء ${channel}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تثبيت') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const msgId = args[0];
        if (!msgId) { sentReply = await message.reply('⚠️ أدخل المعرف.'); deleteAfter(sentReply); return; }
        try {
          const msg = await message.channel.messages.fetch(msgId);
          await msg.pin();
          sentReply = await message.reply(`📌 تم التثبيت: [رابط](${msg.url})`);
          deleteAfter(sentReply);
        } catch (e) {
          sentReply = await message.reply('❌ تأكد من المعرف.');
          deleteAfter(sentReply);
        }
        return;
      }

      if (cmd === 'الغاء_تثبيت') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const msgId = args[0];
        if (!msgId) { sentReply = await message.reply('⚠️ أدخل المعرف.'); deleteAfter(sentReply); return; }
        try {
          const msg = await message.channel.messages.fetch(msgId);
          await msg.unpin();
          sentReply = await message.reply(`📌 تم الإلغاء.`);
          deleteAfter(sentReply);
        } catch (e) {
          sentReply = await message.reply('❌ تأكد من المعرف.');
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ========== أوامر الإشراف ==========
      // ============================================================
      if (cmd === 'حظر') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) { sentReply = await message.reply('❌ لا أملك صلاحية الحظر.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        if (!member.bannable) { sentReply = await message.reply('❌ لا أستطيع حظره.'); deleteAfter(sentReply); return; }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        await member.ban({ reason });
        sentReply = await message.reply(`🔨 تم حظر **${member.user.tag}**.\n**السبب:** ${reason}`);
        logToChannel(guildId, { title: '🔨 حظر', color: THEME.ERROR, description: `**${message.author}** • **${member.user.tag}** • ${reason}` });
        deleteAfter(sentReply);
        return;
      }

      // ✅ !برجلي بدل !طرد
      if (cmd === 'برجلي') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) { sentReply = await message.reply('❌ لا أملك صلاحية الطرد.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        if (!member.kickable) { sentReply = await message.reply('❌ لا أستطيع طرده.'); deleteAfter(sentReply); return; }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        await member.kick(reason);
        sentReply = await message.reply(`🚪 تم طرد **${member.user.tag}**.\n**السبب:** ${reason}`);
        logToChannel(guildId, { title: '🚪 طرد', color: THEME.ERROR, description: `**${message.author}** • **${member.user.tag}** • ${reason}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'كتم') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        let muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
        if (!muteRole) {
          muteRole = await message.guild.roles.create({ name: 'Muted', permissions: [] });
          for (const [, ch] of message.guild.channels.cache) {
            await ch.permissionOverwrites.create(muteRole, { SendMessages: false }).catch(() => {});
          }
        }
        await member.roles.add(muteRole, reason);
        sentReply = await message.reply(`🔇 تم كتم **${member.user.tag}**.`);
        logToChannel(guildId, { title: '🔇 كتم', color: THEME.WARN, description: `**${message.author}** • **${member.user.tag}** • ${reason}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'فك_كتم') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
        if (!muteRole) { sentReply = await message.reply('⚠️ لا يوجد دور Muted.'); deleteAfter(sentReply); return; }
        await member.roles.remove(muteRole);
        sentReply = await message.reply(`🔊 تم فك الكتم عن **${member.user.tag}**.`);
        logToChannel(guildId, { title: '🔊 فك كتم', color: THEME.SUCCESS, description: `**${message.author}** • **${member.user.tag}**` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تحذير') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        const count = await addWarn(guildId, member.id, reason, message.author.id);
        sentReply = await message.reply(`⚠️ تم تحذير **${member.user.tag}**.\n**الإجمالي:** ${count}`);
        logToChannel(guildId, { title: '⚠️ تحذير', color: THEME.WARN, description: `**${message.author}** • **${member.user.tag}** • ${reason} • ${count}` });
        try {
          const dmEmbed = new EmbedBuilder().setTitle('⚠️ تم تحذيرك').setColor(THEME.WARN)
            .setDescription(`**السيرفر:** ${message.guild.name}\n**السبب:** ${reason}\n**إجمالي:** ${count}`)
            .setFooter({ text: brand });
          await member.send({ embeds: [dmEmbed] });
        } catch (e) {}
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'ابطال_تحذيرات') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        const member = message.mentions.members.first();
        if (!member) { sentReply = await message.reply('⚠️ منشن العضو.'); deleteAfter(sentReply); return; }
        await clearWarns(guildId, member.id);
        sentReply = await message.reply(`✅ تم إبطال تحذيرات **${member.user.tag}**.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'مسح') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرسائل.'); deleteAfter(sentReply); return; }
        let amount = parseInt(args[0]) || 5;
        if (amount > 100) amount = 100;
        if (amount < 1) amount = 1;
        const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
        const count = deleted ? deleted.size : 0;
        sentReply = await message.channel.send(`🧹 تم مسح ${count} رسالة.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'قفل') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.'); deleteAfter(sentReply); return; }
        await message.channel.permissionOverwrites.create(message.guild.id, { SendMessages: false });
        sentReply = await message.reply(`🔒 تم قفل ${message.channel}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'فتح') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.'); deleteAfter(sentReply); return; }
        await message.channel.permissionOverwrites.delete(message.guild.id);
        sentReply = await message.reply(`🔓 تم فتح ${message.channel}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'نقل_كل') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.MoveMembers)) { sentReply = await message.reply('❌ لا أملك صلاحية نقل الأعضاء.'); deleteAfter(sentReply); return; }
        if (message.mentions.channels.size < 2) { sentReply = await message.reply('⚠️ منشن رومين.'); deleteAfter(sentReply); return; }
        const from = message.mentions.channels.first();
        const to = message.mentions.channels.last();
        if (from.type !== ChannelType.GuildVoice || to.type !== ChannelType.GuildVoice) {
          sentReply = await message.reply('⚠️ يجب أن تكون القناتان صوتيتين.');
          deleteAfter(sentReply);
          return;
        }
        const members = from.members.filter(m => !m.user.bot);
        let count = 0;
        for (const m of members.values()) {
          await m.voice.setChannel(to).catch(() => {});
          count++;
        }
        sentReply = await message.reply(`🔊 تم نقل ${count} عضو.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'حذف_قناة') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.'); deleteAfter(sentReply); return; }
        const channel = message.mentions.channels.first();
        if (!channel) { sentReply = await message.reply('⚠️ منشن القناة.'); deleteAfter(sentReply); return; }
        const channelName = channel.name;
        await channel.delete();
        sentReply = await message.reply(`🗑️ تم حذف ${channelName}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تغيير_اسم_قناة') {
        if (!(await hasPermission(message.member, guildId))) { sentReply = await message.reply('❌ تحتاج صلاحية متحكم.'); deleteAfter(sentReply); return; }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) { sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.'); deleteAfter(sentReply); return; }
        const channel = message.mentions.channels.first();
        if (!channel) { sentReply = await message.reply('⚠️ منشن القناة.'); deleteAfter(sentReply); return; }
        const newName = args.slice(1).join(' ');
        if (!newName) { sentReply = await message.reply('⚠️ أدخل الاسم.'); deleteAfter(sentReply); return; }
        const safeName = sanitizeChannelName(newName);
        await channel.setName(safeName);
        sentReply = await message.reply(`✏️ تم التغيير إلى ${safeName}.`);
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== إيقاف البوت ==========
      // ============================================================
      if (cmd === 'إيقاف') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        await message.reply('🛑 جاري الإيقاف...');
        try {
          await mongoose.connection.close();
          client.destroy();
        } catch (e) {}
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ خطأ في تنفيذ الأمر:', error);
      try {
        sentReply = await message.reply('❌ حدث خطأ.');
        deleteAfter(sentReply);
      } catch (e) {}
    }
    return;
  }

  // ============================================================
  // ========== XP + الأوتو لاين + الردود التلقائية ==========
  // ============================================================
  try {
    let levelUpSentAutoLine = false;
    const isLevelNotifyChannel = config.levelChannelId && message.channel.id === config.levelChannelId;
    if (!isLevelNotifyChannel) {
      const userData = await getUserData(guildId, userId);
      userData.messages += 1;
      const gain = Math.floor(Math.random() * 15) + 5;
      userData.xp += gain;
      const requiredXP = (userData.level + 1) * 100;

      if (userData.xp >= requiredXP) {
        userData.level += 1;
        userData.xp = 0;
        await userData.save();

        const levelChannelId = config.levelChannelId || message.channel.id;
        const levelChannel = message.guild.channels.cache.get(levelChannelId);
        if (levelChannel) {
          const embed = new EmbedBuilder()
            .setTitle('👑 مستوى جديد')
            .setDescription(`${message.author} وصل إلى المستوى **${userData.level}**!`)
            .setColor(THEME.ORANGE)
            .setFooter({ text: brand });
          const generalImg = getGeneralImage(message.guild, config);
          if (generalImg) embed.setThumbnail(generalImg);
          await levelChannel.send({ content: `${message.author}`, embeds: [embed] }).catch(() => {});
        }

        const originalAutoLine = await AutoLine.findOne({ guildId, channelId: message.channel.id });
        if (originalAutoLine && originalAutoLine.enabled) {
          try {
            await sendAutoLineOnly(message.channel, originalAutoLine);
            levelUpSentAutoLine = true;
          } catch (e) {}
        }

        if (levelChannelId !== message.channel.id) {
          const levelAutoLine = await AutoLine.findOne({ guildId, channelId: levelChannelId });
          if (levelAutoLine && levelAutoLine.enabled) {
            const lvlCh = message.guild.channels.cache.get(levelChannelId);
            if (lvlCh) {
              try {
                await sendAutoLineOnly(lvlCh, levelAutoLine);
              } catch (e) {}
            }
          }
        }

        const levelRole = await LevelRole.findOne({ guildId, level: userData.level });
        if (levelRole) {
          const role = message.guild.roles.cache.get(levelRole.roleId);
          if (role && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            const member = await message.guild.members.fetch(userId).catch(() => null);
            if (member) await member.roles.add(role).catch(() => {});
          }
        }
      } else {
        await userData.save();
      }
    }

    if (!levelUpSentAutoLine) {
      const auto = await AutoLine.findOne({ guildId, channelId: message.channel.id });
      if (auto && auto.enabled) {
        const channel = client.channels.cache.get(message.channel.id);
        if (channel) {
          try {
            await sendAutoLineOnly(channel, auto);
          } catch (e) {}
        }
        return;
      }
    }

    const autoReply = await findAutoReply(guildId, message.content);
    if (autoReply) {
      try {
        if (autoReply.image) {
          const embed = new EmbedBuilder().setDescription(autoReply.reply).setColor(THEME.ORANGE).setImage(autoReply.image).setFooter({ text: brand });
          await message.reply({ embeds: [embed] });
        } else {
          await message.reply(autoReply.reply);
        }
      } catch (e) {
        await message.channel.send(autoReply.reply).catch(() => {});
      }
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة الرسالة:', error);
  }
});

// ============================================================
// ========== معالج التفاعلات ==========
// ============================================================

client.on('interactionCreate', async (interaction) => {
  try {
        // ============================================================
    // ========== 🎙️ Voice Master — الأزرار ==========
    // ============================================================

    if (interaction.isButton() && interaction.customId === 'vc_rename') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const ch = interaction.guild.channels.cache.get(voiceData.channelId);
      const currentName = ch ? ch.name.replace(/^🔊 /, '') : '';
      const modal = new ModalBuilder()
        .setCustomId('vc_rename_modal')
        .setTitle('تغيير اسم الروم')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(1).setMaxLength(90).setValue(currentName.slice(0, 90))
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_limit') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('vc_limit_modal')
        .setTitle('تغيير الحد الأقصى')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('new_limit').setLabel('الحد (0 = بلا حد | 1-99)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2).setValue(String(voiceData.userLimit || 0))
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_lock') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
        for (const userId of voiceData.trustedUsers) await channel.permissionOverwrites.edit(userId, { Connect: true }).catch(() => {});
        voiceData.locked = true;
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: '🔒 تم قفل الروم.', ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل القفل: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isButton() && interaction.customId === 'vc_unlock') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
        for (const userId of voiceData.blockedUsers) await channel.permissionOverwrites.edit(userId, { Connect: false }).catch(() => {});
        voiceData.locked = false;
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: '🔓 تم فتح الروم.', ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل الفتح: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isButton() && interaction.customId === 'vc_permit') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('vc_permit_modal')
        .setTitle('السماح لعضو بالدخول')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ahmed_2001')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_reject') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('vc_reject_modal')
        .setTitle('منع عضو من الدخول')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ahmed_2001')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_unblock') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      if (!voiceData.blockedUsers.length) return interaction.reply({ content: '📭 لا يوجد أعضاء ممنوعون.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('vc_unblock_modal')
        .setTitle('إلغاء المنع')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ahmed_2001')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_kick') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط مالك الروم أو المتحكمين.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('vc_kick_modal')
        .setTitle('طرد عضو')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ahmed_2001')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_transfer') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      if (voiceData.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ فقط المالك يقدر ينقل الملكية.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('vc_transfer_modal')
        .setTitle('نقل الملكية')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ahmed_2001')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'vc_claim') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const memberVoice = interaction.member.voice?.channel;
      if (!memberVoice || memberVoice.id !== voiceData.channelId) return interaction.reply({ content: '❌ لازم تكون داخل الروم لاستلامه.', ephemeral: true });
      const owner = interaction.guild.members.cache.get(voiceData.ownerId);
      const ownerInRoom = owner?.voice?.channelId === voiceData.channelId;
      if (ownerInRoom) return interaction.reply({ content: '❌ المالك الأصلي لا يزال موجوداً.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      await channel.permissionOverwrites.edit(voiceData.ownerId, { ManageChannels: null, MoveMembers: null, MuteMembers: null, DeafenMembers: null }).catch(() => {});
      await channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, Connect: true, ManageChannels: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true }).catch(() => {});
      voiceData.ownerId = interaction.user.id;
      await voiceData.save();
      await updateVoicePanel(interaction.client, voiceData);
      return interaction.reply({ content: `👑 تم نقل ملكية الروم إليك.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'vc_delete') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      await interaction.reply({ content: '🗑️ جاري حذف الروم...', ephemeral: true });
      await deleteVoiceRoom(interaction.guild, voiceData.channelId);
      return;
    }

    // ============================================================
    // ========== 🎙️ Voice Master — المودالات ==========
    // ============================================================

    if (interaction.isModalSubmit() && interaction.customId === 'vc_rename_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      const newName = interaction.fields.getTextInputValue('new_name').trim();
      if (!newName) return interaction.reply({ content: '⚠️ الاسم فارغ.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.setName(`🔊 ${newName}`.slice(0, 100));
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: `✏️ تم تغيير الاسم إلى: **${newName}**`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل التغيير: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'vc_limit_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      const limit = parseInt(interaction.fields.getTextInputValue('new_limit').trim());
      if (isNaN(limit) || limit < 0 || limit > 99) return interaction.reply({ content: '⚠️ الحد يجب أن يكون بين 0 و 99.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.setUserLimit(limit);
        voiceData.userLimit = limit;
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: limit === 0 ? '👥 تم إزالة الحد الأقصى.' : `👥 تم تعيين الحد إلى ${limit}.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'vc_permit_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      const query = interaction.fields.getTextInputValue('member_query').trim();
      const target = await findMemberByName(interaction.guild, query);
      if (!target) return interaction.reply({ content: '❌ لم أجد العضو.', ephemeral: true });
      if (target.id === interaction.user.id) return interaction.reply({ content: '⚠️ أنت المالك أصلاً.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.permissionOverwrites.edit(target.id, { ViewChannel: true, Connect: true });
        if (!voiceData.trustedUsers.includes(target.id)) voiceData.trustedUsers.push(target.id);
        voiceData.blockedUsers = voiceData.blockedUsers.filter(id => id !== target.id);
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: `✅ تم السماح لـ **${target.user.tag}** بالدخول.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'vc_reject_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      const query = interaction.fields.getTextInputValue('member_query').trim();
      const target = await findMemberByName(interaction.guild, query);
      if (!target) return interaction.reply({ content: '❌ لم أجد العضو.', ephemeral: true });
      if (target.id === interaction.user.id) return interaction.reply({ content: '⚠️ ما تقدر تمنع نفسك.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.permissionOverwrites.edit(target.id, { ViewChannel: true, Connect: false });
        if (target.voice?.channelId === voiceData.channelId) await target.voice.disconnect('تم منعه من الروم').catch(() => {});
        if (!voiceData.blockedUsers.includes(target.id)) voiceData.blockedUsers.push(target.id);
        voiceData.trustedUsers = voiceData.trustedUsers.filter(id => id !== target.id);
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: `⛔ تم منع **${target.user.tag}** من الروم.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'vc_unblock_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      const query = interaction.fields.getTextInputValue('member_query').trim();
      const target = await findMemberByName(interaction.guild, query);
      if (!target) return interaction.reply({ content: '❌ لم أجد العضو.', ephemeral: true });
      if (!voiceData.blockedUsers.includes(target.id)) return interaction.reply({ content: '⚠️ هذا العضو غير ممنوع.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.permissionOverwrites.edit(target.id, { Connect: null });
        voiceData.blockedUsers = voiceData.blockedUsers.filter(id => id !== target.id);
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: `✅ تم إلغاء منع **${target.user.tag}**.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'vc_kick_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      if (voiceData.ownerId !== interaction.user.id && !isAdmin) return interaction.reply({ content: '❌ فقط المالك أو المتحكمين.', ephemeral: true });
      const query = interaction.fields.getTextInputValue('member_query').trim();
      const target = await findMemberByName(interaction.guild, query);
      if (!target) return interaction.reply({ content: '❌ لم أجد العضو.', ephemeral: true });
      if (target.id === interaction.user.id) return interaction.reply({ content: '⚠️ ما تقدر تطرد نفسك.', ephemeral: true });
      if (target.voice?.channelId !== voiceData.channelId) return interaction.reply({ content: '⚠️ هذا العضو ليس في الروم.', ephemeral: true });
      try {
        await target.voice.disconnect('تم طرده من الروم');
        return interaction.reply({ content: `👢 تم طرد **${target.user.tag}** من الروم.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل: ${err.message}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'vc_transfer_modal') {
      const voiceData = await getVoiceRoomForMember(interaction);
      if (!voiceData) return interaction.reply({ content: '❌ لازم تكون داخل روم صوتي مؤقت أو مالكه.', ephemeral: true });
      if (voiceData.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ فقط المالك يقدر ينقل الملكية.', ephemeral: true });
      const query = interaction.fields.getTextInputValue('member_query').trim();
      const target = await findMemberByName(interaction.guild, query);
      if (!target) return interaction.reply({ content: '❌ لم أجد العضو.', ephemeral: true });
      if (target.id === interaction.user.id) return interaction.reply({ content: '⚠️ أنت المالك أصلاً.', ephemeral: true });
      if (target.voice?.channelId !== voiceData.channelId) return interaction.reply({ content: '⚠️ العضو لازم يكون داخل الروم.', ephemeral: true });
      const channel = interaction.guild.channels.cache.get(voiceData.channelId);
      if (!channel) return interaction.reply({ content: '❌ الروم غير موجود.', ephemeral: true });
      try {
        await channel.permissionOverwrites.edit(voiceData.ownerId, { ManageChannels: null, MoveMembers: null, MuteMembers: null, DeafenMembers: null }).catch(() => {});
        await channel.permissionOverwrites.edit(target.id, { ViewChannel: true, Connect: true, ManageChannels: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true }).catch(() => {});
        voiceData.ownerId = target.id;
        await voiceData.save();
        await updateVoicePanel(interaction.client, voiceData);
        return interaction.reply({ content: `👑 تم نقل ملكية الروم إلى **${target.user.tag}**.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل: ${err.message}`, ephemeral: true });
      }
    }

    // ============================================================
    // ========== 🛡️ معالجات لوحة الحماية ==========
    // ============================================================

    if (interaction.isButton() && interaction.customId === 'prot_refresh') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const panel = await buildProtectionPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && interaction.customId === 'prot_toggle_main') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      await updateGuildConfig(interaction.guild.id, { protectionEnabled: !config.protectionEnabled });
      const panel = await buildProtectionPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && interaction.customId === 'prot_toggle_spam') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      await updateGuildConfig(interaction.guild.id, { antiSpamEnabled: !config.antiSpamEnabled });
      const panel = await buildProtectionPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && interaction.customId === 'prot_toggle_link') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      await updateGuildConfig(interaction.guild.id, { antiLinkEnabled: !config.antiLinkEnabled });
      const panel = await buildProtectionPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && interaction.customId === 'prot_toggle_everyone') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      await updateGuildConfig(interaction.guild.id, { antiEveryoneEnabled: !config.antiEveryoneEnabled });
      const panel = await buildProtectionPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && interaction.customId === 'prot_actions_menu') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const panel = await buildProtectionActionsPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && ['prot_edit_spam', 'prot_edit_link', 'prot_edit_everyone', 'prot_edit_word'].includes(interaction.customId)) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const type = interaction.customId.replace('prot_edit_', '');
      const config = await getGuildConfig(interaction.guild.id);
      const fieldMap = {
        spam: { action: 'protectionActionSpam', timeout: 'protectionTimeoutSpam', title: 'عقاب منع التكرار' },
        link: { action: 'protectionActionLink', timeout: 'protectionTimeoutLink', title: 'عقاب منع الروابط' },
        everyone: { action: 'protectionActionEveryone', timeout: 'protectionTimeoutEveryone', title: 'عقاب منع المنشن' },
        word: { action: 'protectionActionWord', timeout: 'protectionTimeoutWord', title: 'عقاب الكلمات المحظورة' },
      };
      const fields = fieldMap[type];
      const modal = new ModalBuilder()
        .setCustomId(`prot_edit_${type}_modal`)
        .setTitle(fields.title)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('action_input').setLabel('العقاب (delete/delete_warn/delete_mute/delete_warn_mute)').setStyle(TextInputStyle.Short).setRequired(true).setValue(config[fields.action]).setMaxLength(50)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('timeout_input').setLabel('مدة Timeout بالدقائق').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(config[fields.timeout])).setMaxLength(4)
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('prot_edit_') && interaction.customId.endsWith('_modal')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const type = interaction.customId.replace('prot_edit_', '').replace('_modal', '');
      const action = interaction.fields.getTextInputValue('action_input').trim().toLowerCase();
      const timeout = parseInt(interaction.fields.getTextInputValue('timeout_input'));
      const validActions = ['delete', 'delete_warn', 'delete_mute', 'delete_warn_mute'];
      if (!validActions.includes(action)) return interaction.reply({ content: `⚠️ العقاب غير صالح. اختر من:\n\`delete\` \`delete_warn\` \`delete_mute\` \`delete_warn_mute\``, ephemeral: true });
      if (isNaN(timeout) || timeout < 1 || timeout > 1440) return interaction.reply({ content: '⚠️ المدة يجب أن تكون بين 1 و 1440 دقيقة (24 ساعة).', ephemeral: true });
      const fieldMap = {
        spam: { action: 'protectionActionSpam', timeout: 'protectionTimeoutSpam' },
        link: { action: 'protectionActionLink', timeout: 'protectionTimeoutLink' },
        everyone: { action: 'protectionActionEveryone', timeout: 'protectionTimeoutEveryone' },
        word: { action: 'protectionActionWord', timeout: 'protectionTimeoutWord' },
      };
      const fields = fieldMap[type];
      if (!fields) return interaction.reply({ content: '❌ نوع غير معروف.', ephemeral: true });
      await updateGuildConfig(interaction.guild.id, { [fields.action]: action, [fields.timeout]: timeout });
      const panel = await buildProtectionActionsPanel(interaction.guild.id, interaction.guild);
      return interaction.update({ embeds: [panel.embed], components: panel.rows });
    }

    if (interaction.isButton() && interaction.customId === 'prot_banned_words') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      const words = await getBannedWords(interaction.guild.id);
      const listText = words.length ? words.slice(0, 30).map((w, i) => `${i + 1}. \`${w.word}\``).join('\n') : 'لا توجد كلمات محظورة حتى الآن.';
      const embed = new EmbedBuilder().setTitle(`🚫 ${brand} | الكلمات المحظورة`).setDescription(`**الإجمالي:** ${words.length}\n\n**القائمة:**\n${listText.slice(0, 3500)}`).setColor(THEME.ORANGE).setFooter({ text: brand });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prot_word_add').setLabel('إضافة كلمة').setStyle(BTN.MAIN).setEmoji('➕'),
        new ButtonBuilder().setCustomId('prot_word_remove').setLabel('حذف كلمة').setStyle(BTN.MAIN).setEmoji('🗑️'),
        new ButtonBuilder().setCustomId('prot_word_clear').setLabel('حذف الكل').setStyle(BTN.MAIN).setEmoji('🧹'),
        new ButtonBuilder().setCustomId('prot_refresh').setLabel('رجوع').setStyle(BTN.ALT).setEmoji('🔄'),
      );
      return interaction.update({ embeds: [embed], components: [row] });
    }

    if (interaction.isButton() && interaction.customId === 'prot_word_add') {
      const modal = new ModalBuilder().setCustomId('prot_word_add_modal').setTitle('إضافة كلمة محظورة')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('word_input').setLabel('الكلمة المحظورة').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)));
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'prot_word_remove') {
      const modal = new ModalBuilder().setCustomId('prot_word_remove_modal').setTitle('حذف كلمة محظورة')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('word_input').setLabel('الكلمة للحذف').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)));
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'prot_word_clear') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      await BannedWord.deleteMany({ guildId: interaction.guild.id });
      return interaction.reply({ content: '✅ تم حذف كل الكلمات المحظورة.', ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId === 'prot_word_add_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const word = interaction.fields.getTextInputValue('word_input').trim();
      const added = await addBannedWord(interaction.guild.id, word, interaction.user.id);
      if (!added) return interaction.reply({ content: `⚠️ الكلمة \`${word}\` مضافة بالفعل.`, ephemeral: true });
      return interaction.reply({ content: `✅ تم إضافة الكلمة: \`${word}\``, ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId === 'prot_word_remove_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const word = interaction.fields.getTextInputValue('word_input').trim();
      const removed = await removeBannedWord(interaction.guild.id, word);
      if (!removed) return interaction.reply({ content: `⚠️ الكلمة \`${word}\` غير موجودة.`, ephemeral: true });
      return interaction.reply({ content: `✅ تم حذف الكلمة: \`${word}\``, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'prot_bypass_roles') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      const bypassRoles = config.protectionBypassRoles || [];
      const listText = bypassRoles.length ? bypassRoles.map(id => { const role = interaction.guild.roles.cache.get(id); return role ? `• ${role.toString()}` : `• \`${id}\` (محذوفة)`; }).join('\n') : 'لا توجد رتب مستثناة.';
      const embed = new EmbedBuilder().setTitle(`🎭 ${brand} | الرتب المستثناة`).setDescription(`**العدد:** ${bypassRoles.length}\n\nالرتب المستثناة + المتحكمون لا تُفحص رسائلهم.\n\n**القائمة:**\n${listText}`).setColor(THEME.ORANGE).setFooter({ text: brand });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prot_bypass_add').setLabel('إضافة رتبة').setStyle(BTN.MAIN).setEmoji('➕'),
        new ButtonBuilder().setCustomId('prot_bypass_remove').setLabel('حذف رتبة').setStyle(BTN.MAIN).setEmoji('🗑️'),
        new ButtonBuilder().setCustomId('prot_refresh').setLabel('رجوع').setStyle(BTN.ALT).setEmoji('🔄'),
      );
      return interaction.update({ embeds: [embed], components: [row] });
    }

    if (interaction.isButton() && interaction.customId === 'prot_bypass_add') {
      const modal = new ModalBuilder().setCustomId('prot_bypass_add_modal').setTitle('إضافة رتبة مستثناة')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('role_input').setLabel('آيدي الرتبة').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(25).setPlaceholder('123456789012345678')));
      return await interaction.showModal(modal);
    }

    if (interaction.isButton() && interaction.customId === 'prot_bypass_remove') {
      const modal = new ModalBuilder().setCustomId('prot_bypass_remove_modal').setTitle('حذف رتبة مستثناة')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('role_input').setLabel('آيدي الرتبة').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(25)));
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'prot_bypass_add_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const roleId = interaction.fields.getTextInputValue('role_input').trim();
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) return interaction.reply({ content: `❌ لم أجد رتبة بالآيدي: \`${roleId}\``, ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      if (!config.protectionBypassRoles.includes(roleId)) { config.protectionBypassRoles.push(roleId); await config.save(); }
      return interaction.reply({ content: `✅ تم إضافة ${role} إلى الرتب المستثناة.`, ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId === 'prot_bypass_remove_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const roleId = interaction.fields.getTextInputValue('role_input').trim();
      const config = await getGuildConfig(interaction.guild.id);
      const index = config.protectionBypassRoles.indexOf(roleId);
      if (index === -1) return interaction.reply({ content: `⚠️ الرتبة غير موجودة في القائمة.`, ephemeral: true });
      config.protectionBypassRoles.splice(index, 1);
      await config.save();
      return interaction.reply({ content: `✅ تم حذف الرتبة من القائمة.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'prot_settings') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      const embed = new EmbedBuilder().setTitle(`⚙️ ${brand} | إعدادات منع التكرار`).setDescription(`**الإعدادات الحالية:**\n• الحد الأقصى: **${config.antiSpamMax}** رسائل\n• المدة: **${config.antiSpamSeconds}** ثانية`).setColor(THEME.ORANGE).setFooter({ text: brand });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prot_settings_edit').setLabel('تعديل الإعدادات').setStyle(BTN.MAIN).setEmoji('✏️'),
        new ButtonBuilder().setCustomId('prot_refresh').setLabel('رجوع').setStyle(BTN.ALT).setEmoji('🔙')
      );
      return interaction.update({ embeds: [embed], components: [row] });
    }

    if (interaction.isButton() && interaction.customId === 'prot_settings_edit') {
      const config = await getGuildConfig(interaction.guild.id);
      const modal = new ModalBuilder().setCustomId('prot_settings_modal').setTitle('تعديل إعدادات منع التكرار')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('max_input').setLabel('الحد الأقصى (2-20)').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(config.antiSpamMax))),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('seconds_input').setLabel('المدة بالثواني (2-60)').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(config.antiSpamSeconds)))
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'prot_settings_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const max = parseInt(interaction.fields.getTextInputValue('max_input'));
      const seconds = parseInt(interaction.fields.getTextInputValue('seconds_input'));
      if (isNaN(max) || max < 2 || max > 20) return interaction.reply({ content: '⚠️ الحد الأقصى يجب أن يكون بين 2 و 20.', ephemeral: true });
      if (isNaN(seconds) || seconds < 2 || seconds > 60) return interaction.reply({ content: '⚠️ المدة يجب أن تكون بين 2 و 60 ثانية.', ephemeral: true });
      await updateGuildConfig(interaction.guild.id, { antiSpamMax: max, antiSpamSeconds: seconds });
      return interaction.reply({ content: `✅ تم التحديث: **${max}** رسائل / **${seconds}** ثانية.`, ephemeral: true });
    }

    // ============================================================
    // ========== 📋 لوحة تحكم التقديمات ============
    // ============================================================

    if (interaction.isStringSelectMenu() && interaction.customId === 'apply_admin_select') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      const selected = interaction.values[0];

      if (selected === 'apply_add_section') {
        const modal = new ModalBuilder().setCustomId('apply_add_section_modal').setTitle('إضافة قسم تقديم جديد')
          .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name_input').setLabel('اسم القسم').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50).setPlaceholder('مثال: ادارة')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('emoji_input').setLabel('الإيموجي (اختياري)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10).setPlaceholder('📋'))
          );
        return await interaction.showModal(modal);
      }

      if (selected.startsWith('section:')) {
        const sectionName = selected.replace('section:', '');
        const section = await getApplySectionByName(interaction.guild.id, sectionName);
        if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
        const role = section.roleId ? interaction.guild.roles.cache.get(section.roleId) : null;
        const logCh = section.logChannelId ? interaction.guild.channels.cache.get(section.logChannelId) : null;
        const embed = new EmbedBuilder().setTitle(`${section.emoji} ${brand} | إدارة قسم: ${section.name}`).setColor(THEME.ORANGE)
          .addFields(
            { name: '📝 عدد الأسئلة', value: `${section.questions.length}/5`, inline: true },
            { name: '🎭 رتبة القبول', value: role ? role.toString() : '❌ غير محددة', inline: true },
            { name: '📥 روم اللوق', value: logCh ? logCh.toString() : '❌ غير محدد', inline: true }
          ).setFooter({ text: brand });
        if (section.image) embed.setImage(section.image);
        if (section.questions.length) {
          const qList = section.questions.map((q, i) => `**${i + 1}.** ${q.label}`).join('\n');
          embed.addFields({ name: '📋 الأسئلة', value: qList.slice(0, 1024), inline: false });
        }
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`apply_section_addq:${section.name}`).setLabel('إضافة سؤال').setStyle(BTN.MAIN).setEmoji('➕'),
          new ButtonBuilder().setCustomId(`apply_section_delq:${section.name}`).setLabel('حذف سؤال').setStyle(BTN.MAIN).setEmoji('🗑️'),
        );
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`apply_section_img:${section.name}`).setLabel('صورة القسم').setStyle(BTN.ALT).setEmoji('🖼️'),
          new ButtonBuilder().setCustomId(`apply_section_role:${section.name}`).setLabel('رتبة القبول').setStyle(BTN.ALT).setEmoji('🎭'),
          new ButtonBuilder().setCustomId(`apply_section_log:${section.name}`).setLabel('روم اللوق').setStyle(BTN.ALT).setEmoji('📥'),
        );
        const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`apply_section_delete:${section.name}`).setLabel('حذف القسم').setStyle(BTN.MAIN).setEmoji('🗑️'),
          new ButtonBuilder().setCustomId('apply_admin_back').setLabel('رجوع').setStyle(BTN.ALT).setEmoji('🔙')
        );
        return interaction.update({ embeds: [embed], components: [row1, row2, row3] });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'apply_add_section_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const name = interaction.fields.getTextInputValue('name_input').trim();
      let emoji = interaction.fields.getTextInputValue('emoji_input')?.trim() || '📋';
      if (!parseEmoji(emoji)) emoji = '📋';
      const added = await addApplySection(interaction.guild.id, name, emoji);
      if (!added) return interaction.reply({ content: `⚠️ قسم **${name}** موجود بالفعل.`, ephemeral: true });
      return interaction.reply({ content: `✅ تم إضافة القسم **${emoji} ${name}**.\n\n> استخدم الأمر مرة أخرى لإضافة الأسئلة والصورة والرتبة واللوق.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'apply_admin_back') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      const sections = await getApplySections(interaction.guild.id);
      const embed = new EmbedBuilder().setTitle(`📋 ${brand} | إدارة التقديمات`).setDescription(`**الأقسام:** ${sections.length}\n\n> اختر قسماً لإدارته، أو أضف قسماً جديداً.`).setColor(THEME.ORANGE).setFooter({ text: brand });
      if (sections.length) {
        const secList = sections.map(s => `${s.emoji} **${s.name}** — ${s.questions.length} سؤال`).join('\n');
        embed.addFields({ name: '📌 الأقسام الحالية', value: secList.slice(0, 1024), inline: false });
      }
      const options = [];
      for (const s of sections.slice(0, 24)) {
        const opt = { label: s.name.slice(0, 100), value: `section:${s.name}`.slice(0, 100), description: `${s.questions.length} سؤال${s.roleId ? ' • له رتبة' : ''}`.slice(0, 100) };
        opt.emoji = await prepareEmojiForSelect(s.emoji, client);
        options.push(opt);
      }
      options.push({ label: 'إضافة قسم جديد', value: 'apply_add_section', emoji: '➕', description: 'إضافة قسم تقديم جديد' });
      const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('apply_admin_select').setPlaceholder('اختر قسماً أو أضف جديداً...').setMinValues(1).setMaxValues(1).addOptions(options)
      );
      return interaction.update({ embeds: [embed], components: [selectRow] });
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_section_addq:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      if (section.questions.length >= 5) return interaction.reply({ content: '⚠️ الحد الأقصى 5 أسئلة.', ephemeral: true });
      const modal = new ModalBuilder().setCustomId(`apply_addq_modal:${section.name}`).setTitle(`إضافة سؤال لقسم ${section.name}`.slice(0, 45))
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_label').setLabel('نص السؤال').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(45)));
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_addq_modal:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      const label = interaction.fields.getTextInputValue('q_label').trim();
      section.questions.push({ label, style: 'SHORT', required: true });
      await section.save();
      return interaction.reply({ content: `✅ تم إضافة السؤال رقم **${section.questions.length}**.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_section_delq:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      if (!section.questions.length) return interaction.reply({ content: '⚠️ لا توجد أسئلة للحذف.', ephemeral: true });
      const modal = new ModalBuilder().setCustomId(`apply_delq_modal:${section.name}`).setTitle(`حذف سؤال من ${section.name}`.slice(0, 45))
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_index').setLabel('رقم السؤال').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2)));
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_delq_modal:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      const index = parseInt(interaction.fields.getTextInputValue('q_index'));
      if (isNaN(index) || index < 1 || index > section.questions.length) return interaction.reply({ content: `⚠️ رقم غير صحيح. القسم فيه **${section.questions.length}** سؤال.`, ephemeral: true });
      const removed = section.questions.splice(index - 1, 1)[0];
      await section.save();
      return interaction.reply({ content: `✅ تم حذف السؤال: \`${removed.label}\``, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_section_img:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const modal = new ModalBuilder().setCustomId(`apply_img_modal:${sectionName}`).setTitle(`صورة قسم ${sectionName}`.slice(0, 45))
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('img_url').setLabel('رابط الصورة (فارغ للحذف)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500)));
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_img_modal:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      const url = interaction.fields.getTextInputValue('img_url')?.trim() || null;
      if (url && !url.match(/^https?:\/\/.+/)) return interaction.reply({ content: '⚠️ الرابط غير صالح.', ephemeral: true });
      section.image = url;
      await section.save();
      return interaction.reply({ content: url ? `✅ تم تعيين الصورة.` : `✅ تم حذف الصورة.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_section_role:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const modal = new ModalBuilder().setCustomId(`apply_role_modal:${sectionName}`).setTitle(`رتبة قبول قسم ${sectionName}`.slice(0, 45))
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('role_id').setLabel('آيدي الرتبة (فارغ للحذف)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(25)));
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_role_modal:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      const roleId = interaction.fields.getTextInputValue('role_id')?.trim() || null;
      if (roleId) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: `❌ لم أجد الرتبة.`, ephemeral: true });
      }
      section.roleId = roleId;
      await section.save();
      return interaction.reply({ content: roleId ? `✅ تم التعيين.` : `✅ تم الحذف.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_section_log:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const modal = new ModalBuilder().setCustomId(`apply_log_modal:${sectionName}`).setTitle(`لوق قسم ${sectionName}`.slice(0, 45))
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('log_id').setLabel('آيدي الروم (فارغ للحذف)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(25)));
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_log_modal:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const section = await getApplySectionByName(interaction.guild.id, sectionName);
      if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
      const logId = interaction.fields.getTextInputValue('log_id')?.trim() || null;
      if (logId) {
        const ch = interaction.guild.channels.cache.get(logId);
        if (!ch) return interaction.reply({ content: `❌ لم أجد الروم.`, ephemeral: true });
      }
      section.logChannelId = logId;
      await section.save();
      return interaction.reply({ content: logId ? `✅ تم التعيين.` : `✅ تم الحذف.`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_section_delete:')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه اللوحة للمتحكمين فقط.', ephemeral: true });
      const sectionName = interaction.customId.split(':')[1];
      const removed = await removeApplySection(interaction.guild.id, sectionName);
      if (!removed) return interaction.reply({ content: '❌ فشل الحذف.', ephemeral: true });
      return interaction.update({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم حذف القسم **${sectionName}**.`)], components: [] });
    }
        // ============================================================
    // ========== أزرار القبول/الرفض للتقديمات ============
    // ============================================================

    if (interaction.isButton() && interaction.customId.startsWith('apply_accept_')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذا الزر للمتحكمين فقط.', ephemeral: true });
      const parts = interaction.customId.split('_');
      const userId = parts[2];
      const sectionName = parts.slice(3).join('_');
      try {
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) return interaction.reply({ content: '❌ العضو لم يعد موجوداً في السيرفر.', ephemeral: true });
        const section = await getApplySectionByName(interaction.guild.id, sectionName);
        if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
        let roleAdded = false;
        if (section.roleId) {
          const role = interaction.guild.roles.cache.get(section.roleId);
          if (role && interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            if (role.position < interaction.guild.members.me.roles.highest.position) {
              await member.roles.add(role, 'قبول التقديم').catch(() => {});
              roleAdded = true;
            }
          }
        }
        await Application.findOneAndUpdate(
          { guildId: interaction.guild.id, userId: member.id, type: section.name, status: 'pending' },
          { status: 'accepted', reviewedBy: interaction.user.id, reviewedAt: new Date() },
          { sort: { createdAt: -1 } }
        ).catch(() => {});
        try {
          const dmEmbed = new EmbedBuilder().setTitle('✅ تم قبولك').setDescription(`**القسم:** ${section.name}\n**السيرفر:** ${interaction.guild.name}\n\n${roleAdded ? '> ✅ تم إعطاؤك رتبة القسم.' : '> ⚠️ لم يتم إعطاء رتبة (تحقق من الإعدادات).'}`).setColor(THEME.SUCCESS).setThumbnail(interaction.guild.iconURL()).setFooter({ text: getServerBrand(await getGuildConfig(interaction.guild.id), interaction.guild) });
          await member.send({ embeds: [dmEmbed] }).catch(() => {});
        } catch (e) {}
        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(THEME.SUCCESS).setTitle(`✅ ${member.user.username} | مقبول`).setDescription(`**تم قبولك في قسم ${section.name}**\n\n**بواسطة:** ${interaction.user}`).setFooter({ text: `✅ تم القبول بواسطة ${interaction.user.tag}` });
        await interaction.message.edit({ embeds: [updatedEmbed], components: [] }).catch(() => {});
        logToChannel(interaction.guild.id, { title: '✅ قبول تقديم', color: THEME.SUCCESS, description: `**${member.user.tag}** • **${section.name}** • بواسطة ${interaction.user}` });
        return interaction.reply({ content: `✅ تم قبول **${member.user.tag}** في قسم **${section.name}**.`, ephemeral: true });
      } catch (error) {
        console.error('❌ خطأ في قبول التقديم:', error);
        return interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
      }
    }

    if (interaction.isButton() && interaction.customId.startsWith('apply_reject_')) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذا الزر للمتحكمين فقط.', ephemeral: true });
      const parts = interaction.customId.split('_');
      const userId = parts[2];
      const sectionName = parts.slice(3).join('_');
      try {
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const section = await getApplySectionByName(interaction.guild.id, sectionName);
        if (!section) return interaction.reply({ content: '❌ القسم غير موجود.', ephemeral: true });
        await Application.findOneAndUpdate(
          { guildId: interaction.guild.id, userId, type: section.name, status: 'pending' },
          { status: 'rejected', reviewedBy: interaction.user.id, reviewedAt: new Date() },
          { sort: { createdAt: -1 } }
        ).catch(() => {});
        if (member) {
          try {
            const dmEmbed = new EmbedBuilder().setTitle('❌ تم رفضك').setDescription(`**القسم:** ${section.name}\n**السيرفر:** ${interaction.guild.name}\n\n> نقدّر لك التقديم، ونتمنى لك التوفيق في المستقبل.`).setColor(THEME.ERROR).setThumbnail(interaction.guild.iconURL()).setFooter({ text: getServerBrand(await getGuildConfig(interaction.guild.id), interaction.guild) });
            await member.send({ embeds: [dmEmbed] }).catch(() => {});
          } catch (e) {}
        }
        const username = member ? member.user.username : `مستخدم`;
        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(THEME.ERROR).setTitle(`❌ ${username} | مرفوض`).setDescription(`**تم رفض طلبك في قسم ${section.name}**\n\n**بواسطة:** ${interaction.user}`).setFooter({ text: `❌ تم الرفض بواسطة ${interaction.user.tag}` });
        await interaction.message.edit({ embeds: [updatedEmbed], components: [] }).catch(() => {});
        logToChannel(interaction.guild.id, { title: '❌ رفض تقديم', color: THEME.ERROR, description: `**${username}** • **${section.name}** • بواسطة ${interaction.user}` });
        return interaction.reply({ content: `❌ تم رفض **${username}** في قسم **${section.name}**.`, ephemeral: true });
      } catch (error) {
        console.error('❌ خطأ في رفض التقديم:', error);
        return interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
      }
    }

    // ============================================================
    // ========== اختيار قسم من بانل التقديمات ============
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'apply_section_select') {
      const selected = interaction.values[0];
      if (selected === 'APPLY_RESET') {
        try {
          const config = await getGuildConfig(interaction.guild.id);
          const panel = await buildApplyPanel(interaction.guild.id, config, interaction.guild);
          if (panel.empty || !panel.row) return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لا توجد أقسام.')], ephemeral: true });
          await interaction.message.edit({ components: [panel.row] }).catch(() => {});
          return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🔄 تم إعادة التعيين').setColor(THEME.ORANGE)], ephemeral: true });
        } catch (err) {
          return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل.`)], ephemeral: true });
        }
      }
      const section = await getApplySectionByName(interaction.guild.id, selected);
      if (!section) return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ القسم غير موجود.')], ephemeral: true });
      if (!section.questions.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`⚠️ لا توجد أسئلة.`)], ephemeral: true });
      const modal = new ModalBuilder().setCustomId(`apply_modal_${section.name.slice(0, 80)}`).setTitle(`تقديم: ${section.name}`.slice(0, 45));
      const rows = [];
      for (let i = 0; i < Math.min(section.questions.length, 5); i++) {
        const q = section.questions[i];
        rows.push(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId(`q_${i}`).setLabel(q.label.slice(0, 45)).setStyle(q.style === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(q.required !== false).setMaxLength(q.style === 'PARAGRAPH' ? 1000 : 200)
        ));
      }
      modal.addComponents(...rows);
      return await interaction.showModal(modal);
    }

    // ============================================================
    // ========== تقديم النموذج ============
    // ============================================================
    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_modal_')) {
      const sectionName = interaction.customId.replace('apply_modal_', '');
      const guildId = interaction.guild.id;
      const section = await getApplySectionByName(guildId, sectionName);
      if (!section) return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ القسم غير موجود.')], ephemeral: true });
      const config = await getGuildConfig(guildId);
      const brand = getServerBrand(config, interaction.guild);
      const answers = [];
      for (let i = 0; i < Math.min(section.questions.length, 5); i++) {
        const q = section.questions[i];
        const answer = interaction.fields.getTextInputValue(`q_${i}`);
        answers.push({ question: q.label, answer });
      }
      await Application.create({ guildId, userId: interaction.user.id, type: section.name, answers, status: 'pending' });
      if (section.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(section.logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder().setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }).setTitle(`📋 تقديم جديد - ${section.emoji} ${section.name}`).setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })).setColor(THEME.ORANGE).setFooter({ text: brand });
          const fields = answers.map(a => ({ name: a.question.slice(0, 250) || 'سؤال', value: `\`${(a.answer || 'لا يوجد').slice(0, 1020)}\``, inline: false }));
          fields.push({ name: '👤 المستخدم', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true });
          fields.push({ name: '🎭 رتبة القبول', value: section.roleId ? `<@&${section.roleId}>` : '❌ غير محددة', inline: true });
          logEmbed.addFields(...fields);
          if (section.image) logEmbed.setImage(section.image);
          const buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`apply_accept_${interaction.user.id}_${section.name}`).setLabel('قبول').setStyle(ButtonStyle.Danger).setEmoji('✅'),
            new ButtonBuilder().setCustomId(`apply_reject_${interaction.user.id}_${section.name}`).setLabel('رفض').setStyle(ButtonStyle.Secondary).setEmoji('❌')
          );
          await logChannel.send({ embeds: [logEmbed], components: [buttonsRow] }).catch(() => {});
        }
      }
      const confirmEmbed = new EmbedBuilder().setTitle('✅ تم إرسال تقديمك').setDescription(`مرحباً ${interaction.user}!\n\nتم استلام تقديمك لقسم **${section.emoji} ${section.name}**.\n\n> **عدد الأسئلة:** ${answers.length}\n> **الحالة:** ⏳ في انتظار المراجعة`).setColor(THEME.ORANGE).setFooter({ text: brand });
      if (section.image) confirmEmbed.setImage(section.image);
      return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
    }

    // ============================================================
    // ========== 🕊️ معالجات الزاجل ============
    // ============================================================

    if (interaction.isButton() && (interaction.customId === 'pigeon_send' || interaction.customId.startsWith('pigeon_send_again_'))) {
      const modal = new ModalBuilder().setCustomId('pigeon_send_modal').setTitle('إرسال رسالة زاجل')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pigeon_target').setLabel('اسم المستخدم (بدون @)').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(50).setPlaceholder('ahmed_2001')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pigeon_message').setLabel('نص الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(1).setMaxLength(1500))
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'pigeon_send_modal') {
      await interaction.deferReply({ ephemeral: true });
      const targetQuery = interaction.fields.getTextInputValue('pigeon_target');
      const content = interaction.fields.getTextInputValue('pigeon_message');
      const guild = interaction.guild;
      const config = await getGuildConfig(guild.id);
      const brand = getServerBrand(config, guild);
      if (!config.pigeonChannel) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لم يتم تعيين روم الزاجل.')] });
      const pigeonChannel = guild.channels.cache.get(config.pigeonChannel);
      if (!pigeonChannel) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ الروم غير موجود.')] });
      const target = await findMemberByName(guild, targetQuery);
      if (!target) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ لم أجد العضو: **${targetQuery}**`)] });
      if (target.user.bot) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ لا يمكن للبوتات.')] });
      if (target.id === interaction.user.id) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ لا يمكن لنفسك.')] });
      const pigeonEmbed = new EmbedBuilder().setTitle('🕊️ وصلتك رسالة زاجل').setDescription(`**📤 المُرسِل:** 🕵️ مجهول\n**📥 المُرسَل إليه:** ${target}\n\n_اضغط على زر **قراءة زاجل** للاطلاع على المحتوى._\n\n> 🔒 هوية المُرسِل مخفية عن الجميع ما عدا الإدارة.`).setColor(THEME.ORANGE).setFooter({ text: brand });
      if (config.pigeonImage) pigeonEmbed.setImage(config.pigeonImage);
      const readRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pigeon_read_${target.id}`).setLabel('قراءة زاجل').setStyle(BTN.MAIN).setEmoji('🕊️'),
        new ButtonBuilder().setCustomId(`pigeon_send_again_${interaction.user.id}`).setLabel('إرسال زاجل جديد').setStyle(BTN.ALT).setEmoji('📤')
      );
      let sentMsg;
      try {
        sentMsg = await pigeonChannel.send({ content: `📩 ${target}، وصلتك رسالة زاجل!`, embeds: [pigeonEmbed], components: [readRow] });
      } catch (err) {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل الإرسال.`)] });
      }
      try {
        await Pigeon.create({ guildId: guild.id, messageId: sentMsg.id, senderId: interaction.user.id, recipientId: target.id, content });
      } catch (e) {}
      try {
        const dmEmbed = new EmbedBuilder().setTitle('🕊️ وصلتك رسالة زاجل!').setDescription(`**📤 المُرسِل:** 🕵️ مجهول\n**🏠 السيرفر:** ${guild.name}\n\n> اذهب إلى <#${pigeonChannel.id}> واضغط على **قراءة زاجل**.`).setColor(THEME.ORANGE).setFooter({ text: brand });
        await target.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch (e) {}
      logToChannel(guild.id, { title: '🕊️ زاجل جديد', color: THEME.ORANGE, description: `**من:** ${interaction.user.tag}\n**إلى:** ${target.user.tag}` });
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setTitle('✅ تم إرسال الزاجل').setDescription(`تم إرسال زاجلك إلى **${target.user.tag}**.\n📬 في ${pigeonChannel}`)] });
    }

    if (interaction.isButton() && interaction.customId.startsWith('pigeon_read_')) {
      const recipientId = interaction.customId.replace('pigeon_read_', '');
      const isRecipient = interaction.user.id === recipientId;
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      if (!isRecipient && !isAdmin) return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ هذه الرسالة ليست لك!')], ephemeral: true });
      let pigeonData = await Pigeon.findOne({ guildId: interaction.guild.id, messageId: interaction.message.id });
      if (!pigeonData) pigeonData = await Pigeon.findOne({ guildId: interaction.guild.id, recipientId }).sort({ createdAt: -1 });
      if (!pigeonData) return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لم أجد المحتوى.')], ephemeral: true });
      const sender = await client.users.fetch(pigeonData.senderId).catch(() => null);
      const recipient = await client.users.fetch(pigeonData.recipientId).catch(() => null);
      let readEmbed;
      if (isAdmin && !isRecipient) {
        readEmbed = new EmbedBuilder().setTitle('📖 قراءة زاجل • عرض إداري').setDescription(`**📤 المُرسِل:** ${sender ? `${sender.tag}` : `مجهول`}\n**📥 المُرسَل إليه:** ${recipient ? recipient.tag : 'غير معروف'}\n\n**📜 المحتوى:**\n\`\`\`\n${pigeonData.content}\n\`\`\``).setColor(THEME.ORANGE).setFooter({ text: brand });
        if (sender) readEmbed.setThumbnail(sender.displayAvatarURL());
      } else {
        readEmbed = new EmbedBuilder().setTitle('📖 قراءة زاجل').setDescription(`**📤 المُرسِل:** 🕵️ مجهول\n**📥 المُرسَل إليه:** ${recipient ? recipient.tag : 'غير معروف'}\n\n**📜 المحتوى:**\n\`\`\`\n${pigeonData.content}\n\`\`\``).setColor(THEME.ORANGE).setFooter({ text: brand });
      }
      if (isRecipient && !pigeonData.read) {
        pigeonData.read = true;
        pigeonData.readAt = new Date();
        await pigeonData.save().catch(() => {});
      }
      return interaction.reply({ embeds: [readEmbed], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'pigeon_myhistory') {
      await interaction.deferReply({ ephemeral: true });
      const myId = interaction.user.id;
      const guildId = interaction.guild.id;
      const config = await getGuildConfig(guildId);
      const brand = getServerBrand(config, interaction.guild);
      const [sent, received] = await Promise.all([
        Pigeon.find({ guildId, senderId: myId }).sort({ createdAt: -1 }).limit(10),
        Pigeon.find({ guildId, recipientId: myId }).sort({ createdAt: -1 }).limit(10),
      ]);
      if (!sent.length && !received.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('📭 لا توجد زاجلات سابقة.')] });
      let desc = '';
      if (received.length) {
        desc += '**📥 المُستلمة (آخر 10):**\n';
        for (const p of received) {
          const status = p.read ? '✅' : '🆕';
          desc += `${status} من **مجهول**\n`;
        }
        desc += '\n';
      }
      if (sent.length) {
        desc += '**📤 المُرسَلة (آخر 10):**\n';
        for (const p of sent) {
          const r = await client.users.fetch(p.recipientId).catch(() => null);
          const name = r ? r.tag : 'مستخدم';
          const status = p.read ? '✅ قُرئت' : '⏳ لم تُقرأ';
          desc += `${status} إلى **${name}**\n`;
        }
        desc += '\n> 🔒 هويتك مخفية عن المُرسَل إليهم.';
      }
      return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`📜 ${brand} | سجل الزاجل`).setColor(THEME.ORANGE).setDescription(desc.slice(0, 4000)).setFooter({ text: brand })] });
    }

    // رتب الإشعارات القديمة
    if (interaction.isButton() && ['role_game', 'role_event', 'role_ajr'].includes(interaction.customId)) {
      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({ content: '❌ لا أملك صلاحية إدارة الرتب.', ephemeral: true });
      const roleMap = { role_game: 'Game Notice', role_event: 'Event Notice', role_ajr: 'Ajr Notice' };
      const roleName = roleMap[interaction.customId];
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (!role) return interaction.reply({ content: `❌ الرتبة غير موجودة.`, ephemeral: true });
      const member = interaction.member;
      if (member.roles.cache.has(role.id)) { await member.roles.remove(role); await interaction.reply({ content: `✅ تم الإزالة.`, ephemeral: true }); }
      else { await member.roles.add(role); await interaction.reply({ content: `✅ تم المنح.`, ephemeral: true }); }
    }

    // ============================================================
    // ========== الرتب الذاتية ============
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'self_roles_toggle') {
      await interaction.deferReply({ ephemeral: true });
      const selectedValue = interaction.values[0];
      if (selectedValue === 'SELF_ROLES_RESET') {
        try {
          const cfg = await getGuildConfig(interaction.guild.id);
          const panel = await buildSelfRolesPanel(interaction.guild.id, interaction.guild, cfg);
          if (panel) {
            await interaction.message.edit({ components: [panel.row] }).catch(() => {});
            return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🔄 تم إعادة التعيين').setColor(THEME.ORANGE)] });
          } else {
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لا توجد رتب.')] });
          }
        } catch (err) {
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل.`)] });
        }
      }
      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ لا أملك الصلاحية.')] });
      const role = interaction.guild.roles.cache.get(selectedValue);
      if (!role) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ الرتبة غير موجودة.')] });
      const selfRole = await SelfRole.findOne({ guildId: interaction.guild.id, roleId: selectedValue });
      if (!selfRole) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ الرتبة غير مسجلة.')] });
      const member = interaction.member;
      if (role.position >= interaction.guild.members.me.roles.highest.position) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ الرتبة أعلى من رتبتي.`)] });
      try {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'إزالة ذاتية');
          return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🗑️ تم إزالة الرتبة').setColor(THEME.ORANGE).setDescription(`${selfRole.emoji} **${selfRole.label}**`)] });
        } else {
          await member.roles.add(role, 'اختيار ذاتي');
          return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ تم إضافة الرتبة').setColor(THEME.ORANGE).setDescription(`${selfRole.emoji} **${selfRole.label}**`)] });
        }
      } catch (err) {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ حدث خطأ.`)] });
      }
    }

    // ============================================================
    // ========== التذاكر ==========
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_control') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه القائمة للمتحكمين فقط!', ephemeral: true });
      const config = await getGuildConfig(interaction.guild.id);
      const brand = getServerBrand(config, interaction.guild);
      const action = interaction.values[0];
      const channel = interaction.channel;
      const ticketData = await getTicketByChannel(interaction.guild.id, channel.id);
      if (!ticketData) return interaction.reply({ content: '❌ لم أجد بيانات التذكرة.', ephemeral: true });

      if (action === 'claim') {
        if (ticketData.claimedBy) return interaction.reply({ content: `⚠️ مستلمة من <@${ticketData.claimedBy}>`, ephemeral: true });
        ticketData.claimedBy = interaction.user.id;
        ticketData.claimedAt = new Date();
        await ticketData.save();
        await channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✋ **${interaction.user}** استلم التذكرة.`).setFooter({ text: brand })] });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم الاستلام.`)], ephemeral: true });
      }

      if (action === 'unclaim') {
        if (!ticketData.claimedBy) return interaction.reply({ content: '⚠️ غير مستلمة.', ephemeral: true });
        const oldClaimer = ticketData.claimedBy;
        ticketData.claimedBy = null;
        ticketData.claimedAt = null;
        await ticketData.save();
        await channel.send({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`📌 **${interaction.user}** ألغى مطالبة <@${oldClaimer}>.`)] });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم الإلغاء.`)], ephemeral: true });
      }

      if (action === 'add_member') {
        const modal = new ModalBuilder().setCustomId('ticket_add_member_modal').setTitle('إضافة عضو')
          .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ahmed_2001')));
        return await interaction.showModal(modal);
      }

      if (action === 'rename') {
        const modal = new ModalBuilder().setCustomId('ticket_rename_modal').setTitle('تغيير اسم التذكرة')
          .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(90).setValue(channel.name)));
        return await interaction.showModal(modal);
      }

      // ✅ خيار إغلاق التذكرة داخل القائمة
      if (action === 'close') {
        if (ticketData.closed) return interaction.reply({ content: '⚠️ مغلقة بالفعل.', ephemeral: true });
        ticketData.closed = true;
        ticketData.status = 'closed';
        await ticketData.save().catch(() => {});

        let ticketOwnerId = null;
        try {
          const allMsgs = await channel.messages.fetch({ limit: 100 });
          const firstMsg = allMsgs.last();
          if (firstMsg && firstMsg.mentions.users.first()) ticketOwnerId = firstMsg.mentions.users.first().id;
        } catch (e) {}

        const sectionName = channel.name.replace('تذكرة-', '').split('-')[0] || 'غير معروف';

        if (ticketOwnerId && config.ticketRatingEnabled !== false) {
          try {
            await TicketRating.findOneAndUpdate({ guildId: interaction.guild.id, ticketId: channel.id }, { guildId: interaction.guild.id, userId: ticketOwnerId, closedBy: interaction.user.id, section: sectionName, ticketId: channel.id }, { upsert: true, new: true });
          } catch (e) {}

          try {
            const owner = await interaction.guild.members.fetch(ticketOwnerId);
            const ratingEmbed = new EmbedBuilder().setTitle('⭐ قيّم تجربتك').setDescription(`مرحباً ${owner}!\n\nتم إغلاق تذكرتك في قسم **${sectionName}**.\nنرجو منك تقييم الخدمة.\n\n**⭐ = سيء جداً**\n**⭐⭐⭐⭐⭐ = ممتاز**`).setColor(THEME.ORANGE).setThumbnail(interaction.guild.iconURL() || null).setFooter({ text: brand });
            const ratingRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`rate_ticket_1_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐').setStyle(BTN.MAIN),
              new ButtonBuilder().setCustomId(`rate_ticket_2_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐').setStyle(BTN.MAIN),
              new ButtonBuilder().setCustomId(`rate_ticket_3_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐⭐').setStyle(BTN.MAIN),
              new ButtonBuilder().setCustomId(`rate_ticket_4_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐⭐⭐').setStyle(BTN.MAIN),
              new ButtonBuilder().setCustomId(`rate_ticket_5_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐⭐⭐⭐').setStyle(BTN.MAIN)
            );
            const commentRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`rate_ticket_comment_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('إضافة تعليق').setStyle(BTN.ALT).setEmoji('💬')
            );
            await owner.send({ embeds: [ratingEmbed], components: [ratingRow, commentRow] }).catch(() => {});
          } catch (e) {}
        }

        logToChannel(interaction.guild.id, { title: '🔒 إغلاق تذكرة', color: THEME.BLACK, description: `**${interaction.user}** • ${channel.name}` });
        await interaction.reply({ content: '🔒 جاري الإغلاق...', ephemeral: true });
        setTimeout(async () => { await channel.delete().catch(() => {}); }, 3000);
        return;
      }

      if (action === 'delete') {
        const modal = new ModalBuilder().setCustomId('ticket_delete_confirm_modal').setTitle('تأكيد الحذف')
          .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('confirm_text').setLabel('اكتب "حذف" للتأكيد').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('حذف')));
        return await interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'ticket_add_member_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه الميزة للمتحكمين فقط.', ephemeral: true });
      const query = interaction.fields.getTextInputValue('member_query');
      const target = await findMemberByName(interaction.guild, query);
      if (!target) return interaction.reply({ content: `❌ لم أجد العضو.`, ephemeral: true });
      try {
        await interaction.channel.permissionOverwrites.create(target.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        const ticketData = await getTicketByChannel(interaction.guild.id, interaction.channel.id);
        if (ticketData && !ticketData.addedMembers.includes(target.id)) { ticketData.addedMembers.push(target.id); await ticketData.save(); }
        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`👤 **${interaction.user}** أضاف ${target}.`)] });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم الإضافة.`)], ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل الإضافة.`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'ticket_rename_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه الميزة للمتحكمين فقط.', ephemeral: true });
      const newName = interaction.fields.getTextInputValue('new_name');
      const oldName = interaction.channel.name;
      try {
        const safeName = sanitizeChannelName(newName);
        await interaction.channel.setName(safeName);
        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✏️ **${interaction.user}** غيّر الاسم من **${oldName}** إلى **${safeName}**`)] });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم التغيير.`)], ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ فشل التغيير.`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'ticket_delete_confirm_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) return interaction.reply({ content: '❌ هذه الميزة للمتحكمين فقط.', ephemeral: true });
      const confirmText = interaction.fields.getTextInputValue('confirm_text').trim();
      if (confirmText !== 'حذف') return interaction.reply({ content: '❌ يجب كتابة "حذف".', ephemeral: true });
      const channelName = interaction.channel.name;
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`🗑️ جاري الحذف...`)], ephemeral: true });
      logToChannel(interaction.guild.id, { title: '🗑️ حذف تذكرة', color: THEME.BLACK, description: `**${interaction.user.tag}** • ${channelName}` });
      setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 2000);
      return;
    }

    if (interaction.isButton() && interaction.customId === 'open_name_modal') {
      const userId = interaction.user.id;
      const last = await getNameCooldown(userId);
      if (last instanceof Date && Date.now() - last.getTime() < 5 * 60 * 60 * 1000) {
        const remaining = Math.ceil((5 * 60 * 60 * 1000 - (Date.now() - last.getTime())) / (60 * 60 * 1000));
        return interaction.reply({ content: `⏳ يمكنك التغيير بعد ${remaining} ساعة.`, ephemeral: true });
      }
      const modal = new ModalBuilder().setCustomId('name_change_modal').setTitle('تغيير الاسم')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(32)));
      return await interaction.showModal(modal);
    }

    // ============================================================
    // ========== تقييم التذاكر ==========
    // ============================================================
    if (interaction.isButton() && interaction.customId.startsWith('rate_ticket_')) {
      const parts = interaction.customId.split('_');
      const isComment = parts[2] === 'comment';
      const ownerId = parts[3];
      const channelId = parts[4];
      const guildId = parts[5];
      const rating = isComment ? null : parseInt(parts[2]);
      if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ ليس لك.', ephemeral: true });
      if (isComment) {
        const modal = new ModalBuilder().setCustomId(`ticket_comment_modal_${ownerId}_${channelId}_${guildId}`).setTitle('إضافة تعليق')
          .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ticket_comment_text').setLabel('تعليقك').setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(3).setMaxLength(500)));
        return await interaction.showModal(modal);
      }
      if (rating >= 1 && rating <= 5) {
        await TicketRating.findOneAndUpdate({ guildId, ticketId: channelId }, { guildId, userId: ownerId, ticketId: channelId, rating }, { upsert: true, new: true });
        try {
          const config = await getGuildConfig(guildId);
          const brand = getServerBrand(config, interaction.guild);
          if (config.ticketRatingChannel) {
            const ratingChannel = interaction.client.channels.cache.get(config.ticketRatingChannel);
            if (ratingChannel) {
              const ratingData = await TicketRating.findOne({ guildId, ticketId: channelId });
              const stars = '⭐'.repeat(rating);
              const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
              const closedByMember = ratingData?.closedBy ? await interaction.guild.members.fetch(ratingData.closedBy).catch(() => null) : null;
              const ratingLogEmbed = new EmbedBuilder().setTitle('⭐ تقييم جديد').setColor(THEME.ORANGE).setThumbnail(member ? member.user.displayAvatarURL() : null)
                .addFields(
                  { name: '👤 صاحب التذكرة', value: member ? member.user.tag : 'مجهول', inline: true },
                  { name: '🎯 التقييم', value: `${stars} (${rating}/5)`, inline: true },
                  { name: '📌 القسم', value: ratingData?.section || 'غير معروف', inline: true },
                  { name: '🔒 أغلق بواسطة', value: closedByMember ? closedByMember.user.tag : 'غير معروف', inline: true }
                ).setFooter({ text: brand });
              if (ratingData?.comment) ratingLogEmbed.addFields({ name: '💬 التعليق', value: ratingData.comment, inline: false });
              await ratingChannel.send({ embeds: [ratingLogEmbed] }).catch(() => {});
            }
          }
        } catch (e) {}
        const stars = '⭐'.repeat(rating);
        const thanksEmbed = new EmbedBuilder().setTitle('✅ شكراً لتقييمك!').setDescription(`تم تسجيل تقييمك: ${stars} (${rating}/5)`).setColor(THEME.ORANGE);
        return interaction.update({ embeds: [thanksEmbed], components: [] });
      }
      return interaction.reply({ content: '❌ تقييم غير صالح.', ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_comment_modal_')) {
      const parts = interaction.customId.split('_');
      const ownerId = parts[3];
      const channelId = parts[4];
      const guildId = parts[5];
      if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ ليس لك.', ephemeral: true });
      const comment = interaction.fields.getTextInputValue('ticket_comment_text');
      await TicketRating.findOneAndUpdate({ guildId, ticketId: channelId }, { guildId, userId: ownerId, ticketId: channelId, comment }, { upsert: true, new: true });
      try {
        const config = await getGuildConfig(guildId);
        const brand = getServerBrand(config, interaction.guild);
        if (config.ticketRatingChannel) {
          const ratingChannel = interaction.client.channels.cache.get(config.ticketRatingChannel);
          if (ratingChannel) {
            const ratingData = await TicketRating.findOne({ guildId, ticketId: channelId });
            const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
            const commentEmbed = new EmbedBuilder().setTitle('💬 تعليق جديد').setColor(THEME.ORANGE).setThumbnail(member ? member.user.displayAvatarURL() : null)
              .addFields(
                { name: '👤 صاحب التذكرة', value: member ? member.user.tag : 'مجهول', inline: true },
                { name: '🎯 التقييم', value: ratingData?.rating ? `${'⭐'.repeat(ratingData.rating)} (${ratingData.rating}/5)` : 'لم يقيّم', inline: true },
                { name: '💬 التعليق', value: comment, inline: false }
              ).setFooter({ text: brand });
            await ratingChannel.send({ embeds: [commentEmbed] }).catch(() => {});
          }
        }
      } catch (e) {}
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('✅ تم استلام تعليقك!').setDescription(`شكراً لك:\n\n> ${comment}`).setColor(THEME.ORANGE)], ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId === 'name_change_modal') {
      const newName = interaction.fields.getTextInputValue('new_name');
      if (newName.length < 2 || newName.length > 32) return interaction.reply({ content: '⚠️ الاسم يجب أن يكون بين 2 و 32 حرفاً.', ephemeral: true });
      try {
        await interaction.member.setNickname(newName);
        await setNameCooldown(interaction.user.id);
        await interaction.reply({ content: `✅ تم تغيير اسمك إلى **${newName}**`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: '❌ لا أملك صلاحية التغيير.', ephemeral: true });
      }
    }

    // ============================================================
    // ========== قائمة التذاكر ==========
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
      await interaction.deferReply({ ephemeral: true });
      const selected = interaction.values[0];
      if (selected === 'TICKET_RESET') {
        try {
          const settings = await getTicketSettings(interaction.guild.id);
          const options = [];
          for (const s of settings.sections) {
            const opt = { label: s.name, value: s.name };
            opt.emoji = await prepareEmojiForSelect(s.emoji, client);
            options.push(opt);
          }
          options.push({ label: 'إعادة تعيين', value: 'TICKET_RESET', emoji: '🔄' });
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('ticket_menu').setPlaceholder('اختر القسم...').addOptions(options)
          );
          await interaction.message.edit({ components: [row] }).catch(() => {});
          return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🔄 تم إعادة التعيين').setColor(THEME.ORANGE).setDescription('تم إعادة تعيين القائمة.')] });
        } catch (err) {
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل.`)] });
        }
      }
      const guild = interaction.guild;
      const member = interaction.member;
      const config = await getGuildConfig(guild.id);
      const brand = getServerBrand(config, guild);
      const generalImage = getGeneralImage(guild, config);
      const settings = await getTicketSettings(guild.id);
      const section = settings.sections.find(s => s.name === selected);
      if (!section) return interaction.editReply({ content: '❌ القسم غير موجود.', ephemeral: true });
      const ticketName = sanitizeChannelName(`تذكرة-${member.user.username}`);
      try {
        const parentId = settings.categoryId || null;
        const channel = await guild.channels.create({
          name: ticketName,
          type: ChannelType.GuildText,
          parent: parentId,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
          ]
        });
        await Ticket.create({ guildId: guild.id, channelId: channel.id, ownerId: member.id, sectionName: selected, status: 'open', closed: false });
        const embed = new EmbedBuilder().setTitle(`🎫 تذكرة - ${selected}`).setDescription(`مرحباً ${member}!\n\n**📌 القسم:** ${selected}\n**👤 صاحب التذكرة:** ${member}\n\n> يرجى شرح مشكلتك بالتفصيل.`).setColor(THEME.ORANGE).setFooter({ text: brand });
        if (generalImage) embed.setThumbnail(generalImage);
        let mention = section.roleId ? `<@&${section.roleId}>` : '';
        const controlRow = buildTicketControlRow();
        await channel.send({ content: `${member} ${mention}`.trim(), embeds: [embed], components: [controlRow] });
        if (config.ticketLogChannel) {
          const logCh = guild.channels.cache.get(config.ticketLogChannel);
          if (logCh) {
            const logEmbed = new EmbedBuilder().setTitle('📥 تذكرة جديدة').setColor(THEME.ORANGE).setThumbnail(member.user.displayAvatarURL())
              .addFields(
                { name: '👤 صاحب التذكرة', value: `${member}`, inline: true },
                { name: '📌 القسم', value: selected, inline: true },
                { name: '🔗 الرابط', value: `${channel}`, inline: false }
              ).setFooter({ text: brand });
            await logCh.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }
        logToChannel(guild.id, { title: '🎫 فتح تذكرة', color: THEME.ORANGE, description: `**${member.user.tag}** • قسم **${selected}**` });
        await interaction.editReply({ content: `✅ تم إنشاء تذكرتك: ${channel}`, ephemeral: true });
      } catch (error) {
        console.error('❌ خطأ في إنشاء التذكرة:', error);
        await interaction.editReply({ content: '❌ حدث خطأ.', ephemeral: true });
      }
    }

  } catch (error) {
    console.error('❌ خطأ في معالج التفاعلات:', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
      }
    } catch (e) {}
  }
});

// ============================================================
// ========== معالجة الأخطاء العامة ==========
// ============================================================

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// ============================================================
// ========== تشغيل البوت ==========
// ============================================================

client.login(TOKEN).catch((err) => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
