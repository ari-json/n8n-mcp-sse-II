# Generate Base64 credentials and automatically update files
# Run this script in PowerShell

# Replace these values with your actual Railway environment variables
$webhookUsername = "anyname" # Your N8N_WEBHOOK_USERNAME value
$n8nApiKey = "your_n8n_api_key_here" # Your N8N_API_KEY value

# Generate the Base64 string
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${webhookUsername}:${n8nApiKey}"))

# Output the generated credentials
Write-Output "`nGenerated Base64 credentials: $credentials`n"

# Update start-supergateway.bat
$batFile = "start-supergateway.bat"
if (Test-Path $batFile) {
    $batContent = Get-Content $batFile -Raw
    $updatedBatContent = $batContent -replace 'Authorization: Basic [^"]*', "Authorization: Basic $credentials"
    Set-Content -Path $batFile -Value $updatedBatContent
    Write-Output "Updated $batFile successfully"
} else {
    Write-Output "Warning: $batFile not found"
}

# Update claude-desktop-config.json
$jsonFile = "claude-desktop-config.json"
if (Test-Path $jsonFile) {
    $jsonContent = Get-Content $jsonFile -Raw
    $updatedJsonContent = $jsonContent -replace 'Authorization: Basic [^"]*', "Authorization: Basic $credentials"
    Set-Content -Path $jsonFile -Value $updatedJsonContent
    Write-Output "Updated $jsonFile successfully"
} else {
    Write-Output "Warning: $jsonFile not found"
}

Write-Output "`nCredentials have been updated in all files."
Write-Output "Now you can run start-supergateway.bat and restart Claude Desktop."
Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 