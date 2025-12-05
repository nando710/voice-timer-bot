require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN não encontrado no .env');
  process.exit(1);
}

// Guarda eventos por canal para evitar duplicação
const activeEvents = new Map();

// Conta humanos no canal
function getHumanCount(channel) {
  if (!channel) return 0;
  return channel.members.filter((m) => !m.user.bot).size;
}

// Criar evento de voz no Discord
async function criarEvento(channel) {
  try {
    const guild = channel.guild;

    // Verifica se já existe evento aberto para esse canal
    if (activeEvents.has(channel.id)) {
      console.log(`⚠️ Evento já existe para ${channel.name}`);
      return;
    }

    console.log(`🟢 Criando evento para o canal ${channel.name}...`);

    const evento = await guild.scheduledEvents.create({
      name: `${channel.name} — Em chamada`,
      scheduledStartTime: new Date(Date.now() + 3000),
      privacyLevel: 2, // GUILD_ONLY
      entityType: 2, // VOICE
      channel: channel.id
    });

    activeEvents.set(channel.id, evento.id);

    console.log(`✅ Evento criado: ${evento.id} (${channel.name})`);
  } catch (error) {
    console.error('❌ Erro ao criar evento:', error);
  }
}

// Finalizar evento de voz
async function finalizarEvento(channel) {
  try {
    const guild = channel.guild;
    const eventId = activeEvents.get(channel.id);

    if (!eventId) {
      console.log(`⚠️ Nenhum evento ativo para ${channel.name}`);
      return;
    }

    console.log(`🔴 Finalizando evento do canal ${channel.name}...`);

    const evento = await guild.scheduledEvents.fetch(eventId);
    await evento.setStatus(3); // 3 = Completed

    activeEvents.delete(channel.id);

    console.log(`🧨 Evento finalizado (${eventId})`);
  } catch (error) {
    console.error('❌ Erro ao finalizar evento:', error);
  }
}

client.once('ready', () => {
  console.log(`🔥 Bot logado como ${client.user.tag}`);
});

client.once('clientReady', () => {
  console.log(`🔥 (clientReady) Bot logado como ${client.user.tag}`);
});

// Detectar entrada/saída de canais de voz
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Ignora bots
  if (oldState.member?.user.bot || newState.member?.user.bot) return;

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  if (oldChannel === newChannel) return;

  console.log('🎧 Evento de voz detectado');
  console.log(`old=${oldChannel?.name ?? 'nenhum'} | new=${newChannel?.name ?? 'nenhum'}`);

  const oldCount = getHumanCount(oldChannel);
  const newCount = getHumanCount(newChannel);

  // Usuário saiu do canal
  if (oldChannel && (!newChannel || oldChannel.id !== newChannel.id)) {
    console.log(`👋 Saiu de ${oldChannel.name} | membros: ${oldCount}`);

    if (oldCount === 0) {
      console.log(`🔴 Canal ${oldChannel.name} ficou vazio → finalizando evento`);
      await finalizarEvento(oldChannel);
    }
  }

  // Usuário entrou no canal
  if (newChannel && (!oldChannel || oldChannel.id !== newChannel.id)) {
    console.log(`✅ Entrou em ${newChannel.name} | membros: ${newCount}`);

    if (newCount === 1) {
      console.log(`🟢 Canal ${newChannel.name} estava vazio → criando evento`);
      await criarEvento(newChannel);
    }
  }
});

client.login(TOKEN).catch((err) => {
  console.error('❌ Erro ao logar:', err);
  process.exit(1);
});

