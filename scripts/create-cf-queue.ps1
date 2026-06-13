
# Create Cloudflare Queue via REST API
$OAuthToken = "cfoat_1mrTjfs0oLf1qtZWuOa6aaDwYG_63q5vHLzgTbEb2Mc.vnSFPcHPLxLyScib3k-JZG71LL-V0CJIgx_ROD9F2lA"
$AccountId = "5dac1c86f1af03f7db9b86d651c8fa3a"

$headers = @{
    "Authorization" = "Bearer $OAuthToken"
    "Content-Type"  = "application/json"
}

Write-Host "=== Creating Cloudflare Queue ===" -ForegroundColor Cyan
$queueBody = @{ queue_name = "traxo-scans" } | ConvertTo-Json
$queueUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/queues"

try {
    $queueResponse = Invoke-RestMethod -Uri $queueUrl -Method Post -Headers $headers -Body $queueBody -ErrorAction Stop
    Write-Host "Queue created: $($queueResponse.result.queue_id)" -ForegroundColor Green
    Write-Host "Queue name: $($queueResponse.result.queue_name)" -ForegroundColor Green
} catch {
    $errContent = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errContent.errors[0].code -eq 11001 -or ($errContent.errors.message -join "") -match "already") {
        Write-Host "Queue 'traxo-scans' already exists (OK)" -ForegroundColor Yellow
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# List queues to verify
Write-Host ""
Write-Host "=== Listing Queues ===" -ForegroundColor Cyan
$listResponse = Invoke-RestMethod -Uri $queueUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
if ($listResponse.result) {
    $listResponse.result | ForEach-Object { Write-Host "  Queue: $($_.queue_name) (ID: $($_.queue_id))" -ForegroundColor Green }
} else {
    Write-Host "No queues found or error listing" -ForegroundColor Yellow
}
