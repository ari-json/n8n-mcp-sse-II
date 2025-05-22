# Simple Base64 encoder for Railway credentials
# Paste this into a PowerShell window to run it

$username = "anyname"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NDYzZWUwNS02OWMwLTRmYmUtYWRhYy0xNmMzZjNmYWZlYWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3ODg0MzE1fQ.7AsfPNSEDCuM3F2CtgnDUiU2Nxfa_eR6XR-8NBGl44o"
$pair = "$($username):$($apiKey)"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)
Write-Output $base64 