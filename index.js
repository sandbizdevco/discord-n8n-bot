const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Bot configuration
const TOKEN = process.env.DISCORD_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const ALLOWED_CHANNEL_IDS = process.env.ALLOWED_CHANNEL_IDS?.split(',') || [];
const BOT_PREFIX = process.env.BOT_PREFIX || '!';

// Create bot instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Logging function
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...data }));
}

// When bot is ready
client.once('ready', () => {
  log('info', 'Bot is online', { 
    username: client.user.tag,
    serverCount: client.guilds.cache.size 
  });
  
  // Set bot status
  client.user.setActivity('Listening for messages', { type: 'LISTENING' });
});

// Handle messages
client.on('messageCreate', async (message) => {
  // Ignore bot's own messages
  if (message.author.bot) return;
  
  // Check if message is in allowed channels (if configured)
  if (ALLOWED_CHANNEL_IDS.length > 0 && !ALLOWED_CHANNEL_IDS.includes(message.channel.id)) {
    return;
  }
  
  // Check if message starts with prefix (if you want command-based interaction)
  const isCommand = message.content.startsWith(BOT_PREFIX);
  
  try {
    // Prepare webhook data
    const webhookData = {
      messageId: message.id,
      content: message.content,
      isCommand: isCommand,
      command: isCommand ? message.content.slice(BOT_PREFIX.length).split(' ')[0] : null,
      args: isCommand ? message.content.slice(BOT_PREFIX.length).split(' ').slice(1) : [],
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator,
        tag: message.author.tag,
        avatarURL: message.author.displayAvatarURL()
      },
      channel: {
        id: message.channel.id,
        name: message.channel.name,
        type: message.channel.type
      },
      guild: message.guild ? {
        id: message.guild.id,
        name: message.guild.name
      } : null,
      timestamp: message.createdTimestamp,
      attachments: []
    };
    
    // Process attachments
    if (message.attachments.size > 0) {
      webhookData.attachments = message.attachments.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        proxyURL: att.proxyURL,
        size: att.size,
        height: att.height,
        width: att.width,
        contentType: att.contentType,
        description: att.description
      }));
    }
     // Send to n8n webhook
    if (N8N_WEBHOOK_URL) {
      log('info', 'Sending to n8n', { 
        messageId: message.id,
        hasAttachments: message.attachments.size > 0 
      });
      
      // Add debug for the payload being sent
      console.log('DEBUG webhook payload:', JSON.stringify(webhookData, null, 2));
      console.log('DEBUG webhook URL:', N8N_WEBHOOK_URL);
      
      const response = await axios.post(N8N_WEBHOOK_URL, webhookData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      // Add debug for the response
      console.log('DEBUG n8n raw response:', JSON.stringify(response.data));
      console.log('DEBUG response status:', response.status);
      
      // Handle n8n response
      if (response.data) {
        // Simple text reply
        if (response.data.reply) {
          await message.reply(response.data.reply);
        }
        
        // Reply with embed (rich response)
        if (response.data.embed) {
          await message.reply({ embeds: [response.data.embed] });
        }
        
        // Reply with file
        if (response.data.file) {
          const attachment = new AttachmentBuilder(
            Buffer.from(response.data.file.data, 'base64'),
            { name: response.data.file.name }
          );
          await message.reply({ files: [attachment] });
        }
        
        // Add reaction
        if (response.data.reaction) {
          await message.react(response.data.reaction);
        }
        
        // Send to different channel
        if (response.data.channelMessage && response.data.channelId) {
          const channel = client.channels.cache.get(response.data.channelId);
          if (channel) {
            await channel.send(response.data.channelMessage);
          }
        }
      }
      
      log('info', 'n8n response processed', { 
        messageId: message.id,
        hasReply: !!response.data.reply 
      });
    }
  } catch (error) {
    log('error', 'Error processing message', { 
      error: error.message,
      messageId: message.id 
    });
    
    // Optionally send error message to user
    if (process.env.SHOW_ERRORS === 'true') {
      await message.reply('Sorry, I encountered an error processing your message.');
    }
  }
});

// Handle voice state updates (for voice channel events)
client.on('voiceStateUpdate', async (oldState, newState) => {
  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    const webhookData = {
      event: 'voice_join',
      user: {
        id: newState.member.id,
        username: newState.member.user.username
      },
      channel: {
        id: newState.channelId,
        name: newState.channel.name
      },
      timestamp: Date.now()
    };
    
    if (N8N_WEBHOOK_URL) {
      await axios.post(N8N_WEBHOOK_URL, webhookData).catch(err => 
        log('error', 'Failed to send voice event', { error: err.message })
      );
    }
  }
});

// Handle slash commands (if you want to use them)
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const webhookData = {
    type: 'slash_command',
    commandName: interaction.commandName,
    options: interaction.options.data,
    user: {
      id: interaction.user.id,
      username: interaction.user.username
    },
    channel: {
      id: interaction.channelId
    },
    timestamp: Date.now()
  };
  
  try {
    if (N8N_WEBHOOK_URL) {
      const response = await axios.post(N8N_WEBHOOK_URL, webhookData);
      
      if (response.data && response.data.reply) {
        await interaction.reply(response.data.reply);
      } else {
        await interaction.reply('Command received!');
      }
    }
  } catch (error) {
    log('error', 'Failed to process slash command', { error: error.message });
    await interaction.reply('An error occurred processing your command.');
  }
});

// Error handling
client.on('error', error => {
  log('error', 'Discord client error', { error: error.message });
});

process.on('unhandledRejection', error => {
  log('error', 'Unhandled promise rejection', { error: error.message });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  client.destroy();
  process.exit(0);
});

// Login bot
client.login(TOKEN).catch(error => {
  log('error', 'Failed to login', { error: error.message });
  process.exit(1);
});

