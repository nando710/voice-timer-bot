require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Armazenaremos aqui o ID do evento ativo por servidor
let activeEvents = new Map();

client.once("ready", () => {
  console.log(`🔥 Bot logado como ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const guild = newState.guild;

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  // LOG básico
  console.log("🎧 Evento de voz detectado");
  console.log(`old=${oldChannel?.name || "nenhum"} | new=${newChannel?.name || "nenhum"}`);

  // ================
  // 1) USUÁRIO ENTROU EM UM CANAL DE VOZ
  // ================
  if (!oldChannel && newChannel && newChannel.type === ChannelType.GuildVoice) {
    const total = newChannel.members.size;
    console.log(`👉 Usuário entrou no canal ${newChannel.name} | membros: ${total}`);

    // Se ele for o primeiro (canal estava vazio), cria o evento
    if (total === 1) {
      console.log("🟢 Canal estava vazio → criando evento...");

      try {
        const event = await guild.scheduledEvents.create({
          name: "Networking Aberto",
          scheduledStartTime: new Date(Date.now() + 60_000), // começa em 1 minuto
          privacyLevel: 2,
          entityType: 2, // Voice
          channel: newChannel.id,
          description: "Evento automático iniciado quando alguém entrou no canal."
        });

        activeEvents.set(guild.id, event.id);
        console.log(`✅ Evento criado! ID: ${event.id}`);

      } catch (err) {
        console.error("❌ Erro ao criar evento:", err);
      }
    }
  }

  // ================
  // 2) USUÁRIO SAIU DO CANAL → talvez o canal ficou vazio
  // ================
  if (oldChannel && oldChannel.type === ChannelType.GuildVoice) {
    const remaining = oldChannel.members.size;

    console.log(`👋 Usuário saiu de ${oldChannel.name} | membros restantes: ${remaining}`);

    if (remaining === 0) {
      console.log("🔴 Canal ficou vazio → finalizando evento...");

      const eventId = activeEvents.get(guild.id);
      if (!eventId) return console.log("⚠ Nenhum evento ativo registrado.");

      try {
        const event = await guild.scheduledEvents.fetch(eventId);

        if (event && event.status !== 3) { // 3 = completed
          await event.delete();
          console.log("🧨 Evento finalizado com sucesso!");
        }

        activeEvents.delete(guild.id);

      } catch (err) {
        console.error("❌ Erro ao finalizar evento:", err);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
