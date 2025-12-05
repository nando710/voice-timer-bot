// index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// ✅ Cria o cliente com intents para voz
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 🔑 Token do bot (vem do .env / Coolify)
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('❌ ERRO: DISCORD_TOKEN não definido nas variáveis de ambiente.');
  process.exit(1);
}

// 👀 Helpers

/**
 * Conta quantos membros humanos existem em um canal de voz
 * @param {import('discord.js').VoiceChannel | null} channel
 * @returns {number}
 */
const getHumanCount = (channel) => {
  if (!channel) return 0;
  return channel.members.filter((m) => !m.user.bot).size;
};

/**
 * Lógica ao INICIAR um "evento" quando canal de voz passa de vazio -> 1 humano
 * @param {import('discord.js').VoiceChannel} channel
 */
const iniciarEvento = async (channel) => {
  try {
    console.log(`🟢 [INICIAR EVENTO] Canal: ${channel.name} (ID: ${channel.id})`);

    // 👉 Aqui você coloca o que quiser que aconteça quando o canal "começa"
    // Exemplo: logar em um canal de texto (se quiser)
    // const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
    // if (LOG_CHANNEL_ID) {
    //   const logChannel = await channel.guild.channels.fetch(LOG_CHANNEL_ID);
    //   if (logChannel && logChannel.isTextBased()) {
    //     await logChannel.send(`🟢 Evento iniciado em **${channel.name}**.`);
    //   }
    // }
  } catch (error) {
    console.error('❌ Erro ao iniciar evento:', error);
  }
};

/**
 * Lógica ao FINALIZAR um "evento" quando canal de voz fica vazio
 * @param {import('discord.js').VoiceChannel} channel
 */
const finalizarEvento = async (channel) => {
  try {
    console.log(`🔴 [FINALIZAR EVENTO] Canal: ${channel.name} (ID: ${channel.id})`);

    // 👉 Aqui você coloca o que quiser que aconteça quando o canal "termina"
    // Exemplo: enviar mensagem em canal de log
    // const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
    // if (LOG_CHANNEL_ID) {
    //   const logChannel = await channel.guild.channels.fetch(LOG_CHANNEL_ID);
    //   if (logChannel && logChannel.isTextBased()) {
    //     await logChannel.send(`🔴 Evento finalizado em **${channel.name}** (canal ficou vazio).`);
    //   }
    // }
  } catch (error) {
    console.error('❌ Erro ao finalizar evento:', error);
  }
};

// 🚀 Quando o bot estiver pronto
client.once('ready', () => {
  console.log(`🔥 Bot logado como ${client.user.tag}`);
});

// Também registra clientReady pra já ficar preparado p/ futuras versões
client.once('clientReady', () => {
  console.log(`🔥 (clientReady) Bot logado como ${client.user.tag}`);
});

// 🎧 Listener de eventos de voz
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    // Ignora bots
    if (oldState.member?.user.bot || newState.member?.user.bot) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // Se não houve mudança real de canal, ignora
    if (oldChannel === newChannel) return;

    console.log('🎧 Evento de voz detectado');
    console.log(`old=${oldChannel?.name ?? 'nenhum'} | new=${newChannel?.name ?? 'nenhum'}`);

    const oldCount = getHumanCount(oldChannel);
    const newCount = getHumanCount(newChannel);

    // 1) SAÍDA de canal (ou moveu de um canal para outro)
    if (oldChannel && (!newChannel || oldChannel.id !== newChannel.id)) {
      console.log(`👋 Usuário saiu de ${oldChannel.name} | membros após saída: ${oldCount}`);

      // Canal ficou vazio → FINALIZAR EVENTO
      if (oldCount === 0) {
        console.log(`🔴 ${oldChannel.name} ficou vazio → finalizando evento...`);
        await finalizarEvento(oldChannel);
      }
    }

    // 2) ENTRADA em canal (ou moveu de outro canal)
    if (newChannel && (!oldChannel || oldChannel.id !== newChannel.id)) {
      console.log(`✅ Usuário entrou em ${newChannel.name} | membros após entrada: ${newCount}`);

      // Canal estava vazio e agora tem exatamente 1 humano → INICIAR EVENTO
      if (newCount === 1) {
        console.log(`🟢 ${newChannel.name} estava vazio → iniciando evento...`);
        await iniciarEvento(newChannel);
      }
    }
  } catch (error) {
    console.error('❌ Erro em voiceStateUpdate:', error);
  }
});

// 🔌 Login do bot
client.login(TOKEN).catch((err) => {
  console.error('❌ Erro ao logar no Discord:', err);
  process.exit(1);
});
