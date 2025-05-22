# Configuring Claude Desktop for Direct Local Connection

If the Railway + Supergateway method isn't working, you can use the local server approach as a fallback.

## Steps:

1. **Make sure your local server is running**:
   ```
   npm run local
   ```

2. **Configure Claude Desktop**:
   - Go to Settings → Integrations → Add Custom Integration
   - Name: "n8n Local"
   - URL: `http://localhost:3000`
   - Click "Test Connection"
   - Enable the tools you want to use

3. **Verify your .env file**:
   Make sure your `.env` file has your actual n8n API credentials:
   ```
   N8N_API_URL=https://your-actual-subdomain.n8n.cloud/api/v1
   N8N_API_KEY=your-actual-api-key
   ```

4. **Testing the connection**:
   - Start a new chat and try: "List my n8n workflows"
   - You should get a response with your workflows

## Why this works:
The local server approach doesn't require Supergateway and can be more reliable for testing. It connects directly to your n8n Cloud instance using the API credentials in your `.env` file.

The only drawback is you need to keep the local server running. 