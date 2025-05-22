@echo off
echo Starting Supergateway bridge to n8n MCP on Railway...

:: Using correct credentials for Railway authentication
npx supergateway ^
  --sse https://n8n-mcp-sse-ii-production.up.railway.app/sse ^
  --message https://n8n-mcp-sse-ii-production.up.railway.app/message ^
  --port 5000 ^
  --logLevel debug ^
  --timeout 30000 ^
  --header "Authorization: Basic YW55bmFtZTpleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemRXSWlPaUkxTkRZelpXVXdOUzAyT1dNd0xUUm1ZbVV0WVdSaFl5MHhObU16WmpObVlXWmxZV0VpTENKcGMzTWlPaUp1T0c0aUxDSmhkV1FpT2lKd2RXSnNhV010WVhCcElpd2lhV0YwSWpveE56UTNPRGM0TXpFMWZRLjdBc2ZQTlNFREN1TTNGMkN0Z25EVWlVMk54ZmFfZVI2WFItOE5CR2w0NG8=" ^
  --header "Content-Type: application/json"

echo Press any key to exit...
pause > nul 