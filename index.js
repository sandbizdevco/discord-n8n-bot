{
  "name": "Discord Bot Integration",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "discord",
        "options": {}
      },
      "id": "webhook-discord",
      "name": "Discord Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "fields": {
          "values": [
            {
              "name": "reply",
              "value": "=Hello {{ $json.author.username }}! I received your message: \"{{ $json.content }}\"\n\nProcessed at: {{ $now.toLocaleString() }}"
            },
            {
              "name": "reaction",
              "value": "✅"
            }
          ]
        },
        "options": {}
      },
      "id": "set-response",
      "name": "Prepare Response",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.isCommand }}",
              "value2": true
            }
          ]
        }
      },
      "id": "if-command",
      "name": "Is Command?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "fields": {
          "values": [
            {
              "name": "reply",
              "value": "=Command recognized: {{ $json.command }}\nArguments: {{ $json.args.join(', ') || 'none' }}"
            }
          ]
        },
        "options": {}
      },
      "id": "command-response",
      "name": "Command Response",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [850, 200]
    },
    {
      "parameters": {
        "table": {
          "value": "discord_messages"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "message_id": "={{ $json.messageId }}",
            "content": "={{ $json.content }}",
            "author_id": "={{ $json.author.id }}",
            "author_username": "={{ $json.author.username }}",
            "channel_id": "={{ $json.channel.id }}",
            "channel_name": "={{ $json.channel.name }}",
            "has_attachments": "={{ $json.attachments.length > 0 }}",
            "timestamp": "={{ new Date($json.timestamp).toISOString() }}"
          }
        }
      },
      "id": "save-to-supabase",
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [450, 500],
      "credentials": {
        "supabaseApi": {
          "id": "1",
          "name": "Supabase account"
        }
      }
    }
  ],
  "connections": {
    "Discord Webhook": {
      "main": [
        [
          {
            "node": "Prepare Response",
            "type": "main",
            "index": 0
          },
          {
            "node": "Save to Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Response": {
      "main": [
        [
          {
            "node": "Is Command?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Command?": {
      "main": [
        [
          {
            "node": "Command Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
