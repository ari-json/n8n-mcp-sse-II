# Generate Base64 credentials for Railway authentication
# Run this script in PowerShell

# Replace these values with your actual Railway environment variables
$webhookUsername = "anyname" # Your N8N_WEBHOOK_USERNAME value
$n8nApiKey = "your_n8n_api_key_here" # Your N8N_API_KEY value

# Generate the Base64 string
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${webhookUsername}:${n8nApiKey}"))

# Output the results
Write-Output "`nGenerated Base64 credentials:`n"
Write-Output $credentials
Write-Output "`n"

# Instructions for using the credentials
Write-Output "Copy this Base64 string and use it in:"
Write-Output "1. start-supergateway.bat"
Write-Output "2. claude-desktop-config.json"
Write-Output "Replace 'YW55bmFtZTpZT1VSX0FQSV9LRVlfSEVSRQ==' with your generated string"
Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 