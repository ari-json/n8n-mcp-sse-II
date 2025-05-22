# Railway Authentication Setup Guide

## Understanding Railway Authentication

The Railway deployment of this n8n MCP server uses Basic Authentication for the `/sse` and `/message` endpoints. It expects:

- Username: Your `N8N_WEBHOOK_USERNAME` (set in Railway variables)
- Password: Your `N8N_API_KEY` (set in Railway variables)

This is different from the webhook authentication used within n8n workflows!

## Creating the Correct Base64 Credentials

To create the correct Basic Auth header, follow these steps:

### Option 1: Using an Online Tool
1. Go to a Base64 encoder website like https://www.base64encode.org/
2. Enter your credentials in the format: `your_webhook_username:your_n8n_api_key`
3. Click Encode to get the Base64 string

### Option 2: Using PowerShell
```powershell
# Replace with your actual values
$username = "your_webhook_username"
$apiKey = "your_n8n_api_key"
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${apiKey}"))
Write-Output $credentials
```

## Updating the Supergateway Command

Once you have your Base64 encoded credentials, update:

1. The `start-supergateway.bat` file:
   ```
   --header "Authorization: Basic YOUR_BASE64_STRING_HERE"
   ```

2. The `claude-desktop-config.json` file:
   ```
   "--header", "Authorization: Basic YOUR_BASE64_STRING_HERE"
   ```

## Testing the Connection

After updating the credentials:
1. Run `start-supergateway.bat`
2. Restart Claude Desktop
3. Try using the n8n tools through Claude

If you still encounter authentication issues, double-check that the values in your Railway environment variables exactly match what you're using in your Base64 encoding. 