require("dotenv").config();

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`🔥 Bot logado como ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  console.log("🎧 Detectado voiceStateUpdate");

  const joinedChannel = newState.channel;

  if (!oldState.channelId && joinedChannel && joinedChannel.type === 2) {
    console.log(`👤 Usuário entrou no canal: ${joinedChannel.name}`);
    console.log(`👥 Pessoas na call: ${joinedChannel.members.size}`);

    if (joinedChannel.members.size === 1) {
      console.log("📢 Tentando criar evento...");

      try {
        await joinedChannel.guild.scheduledEvents.create({
          name: "Networking Aberto",
          scheduledStartTime: new Date(),
          privacyLevel: 2,
          entityType: 2,
          channel: joinedChannel.id,
          description: "Evento automático."
        });

        console.log("🎉 Evento criado com sucesso!");
      } catch (err) {
        console.error("❌ Erro ao criar evento:", err);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
