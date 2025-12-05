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
  console.log(`Bot logado como ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  try {
    const joinedChannel = newState.channel;
    const leftChannel = oldState.channel;

    // Usuário entrou em canal
    if (!oldState.channelId && joinedChannel && joinedChannel.type === 2) {

      // Se o canal ficou com 1 pessoa, cria evento
      if (joinedChannel.members.size === 1) {

        // Verifica se já tem evento ativo
        const existingEvents = await joinedChannel.guild.scheduledEvents.fetch();
        const activeForChannel = existingEvents.find(ev =>
          ev.channelId === joinedChannel.id &&
          (ev.status === 1 || ev.status === 2)
        );

        if (activeForChannel) return;

        // Cria evento de voz
        await joinedChannel.guild.scheduledEvents.create({
          name: "Networking Aberto",
          scheduledStartTime: new Date(),
          privacyLevel: 2,
          entityType: 2,
          channel: joinedChannel.id,
          description: "Evento automático quando alguém entra na call."
        });

        console.log("Evento criado!");
      }
    }

    // Canal ficou vazio → encerrar evento
    if (leftChannel && leftChannel.type === 2 && leftChannel.members.size === 0) {
      const events = await leftChannel.guild.scheduledEvents.fetch();
      const activeEvent = events.find(ev =>
        ev.channelId === leftChannel.id &&
        ev.status === 2
      );

      if (activeEvent) {
        await activeEvent.setStatus(4);
        console.log("Evento encerrado.");
      }
    }

  } catch (error) {
    console.error("Erro:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
