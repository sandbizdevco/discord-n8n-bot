# Discord n8n Bot

This bot connects Discord to your n8n workflows, allowing you to process messages, files, and commands through automation.

## Features

- 📨 Forwards all messages to n8n webhooks
- 📎 Handles file attachments (images, documents, audio)
- 🤖 Command system with prefix support
- 💬 Supports rich responses (embeds, files, reactions)
- 🎤 Voice channel event tracking
- 📊 Automatic Supabase logging

## Setup Instructions

### 1. Deploy to Railway

1. Create a new GitHub repository
2. Upload these files: `index.js`, `package.json`, `.env.example`
3. In Railway, create new service → Deploy from GitHub repo
4. Select your repository

### 2. Configure Environment Variables

In Railway service settings, add these variables:

```env
DISCORD_TOKEN=your_bot_token_here
N8N_WEBHOOK_URL=https://your-n8n.railway.app/webhook/discord
ALLOWED_CHANNEL_IDS=  # Optional: comma-separated channel IDs
BOT_PREFIX=!          # Optional: default is !
SHOW_ERRORS=false     # Optional: show errors to users
```

### 3. Set Up Supabase Table

Run the SQL script in your Supabase SQL editor to create the necessary tables.

### 4. Import n8n Workflow

1. In n8n, go to Workflows → Import
2. Paste the workflow JSON
3. Update the webhook path if needed
4. Configure Supabase credentials

### 5. Test Your Bot

1. Type a message in Discord
2. Check n8n execution history
3. Bot should respond based on your workflow

## Bot Commands

The bot responds to:
- Regular messages (all forwarded to n8n)
- Commands starting with prefix (e.g., `!help`)
- File attachments
- Voice channel events

## n8n Response Format

Your n8n workflow can return:

```json
{
  "reply": "Text message to send back",
  "embed": { 
    "title": "Rich embed",
    "description": "With formatting"
  },
  "reaction": "👍",
  "file": {
    "name": "result.txt",
    "data": "base64_encoded_content"
  }
}
```

## Troubleshooting

1. **Bot not responding**: Check Railway logs
2. **Webhook errors**: Verify N8N_WEBHOOK_URL is correct
3. **Permission errors**: Ensure bot has message read/send permissions
4. **Database errors**: Check Supabase credentials in n8n

## Extending the Bot

- Add slash commands support
- Implement voice recording
- Add user permission checks
- Create admin commands
- Add AI processing workflows
