
# Firebase Setup Script for Traxo
param(
    [string]$ProjectId = "traxo-prod-2025",
    [string]$AccessToken = ""
)

if (-not $AccessToken) {
    $AccessToken = (gcloud auth print-access-token 2>&1).Trim()
}

$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
    "X-Goog-User-Project" = $ProjectId
}

Write-Host "=== Step 1: Adding Firebase to GCP project ===" -ForegroundColor Cyan

$addFirebaseUrl = "https://firebase.googleapis.com/v1beta1/projects/$($ProjectId):addFirebase"
try {
    $addFirebaseResponse = Invoke-RestMethod -Uri $addFirebaseUrl -Method Post -Headers $headers -Body "{}" -ErrorAction Stop
    Write-Host "Firebase operation started: $($addFirebaseResponse.name)" -ForegroundColor Green
    
    # Poll for completion
    $opName = $addFirebaseResponse.name
    $opUrl = "https://firebase.googleapis.com/v1beta1/$opName"
    $maxWait = 60
    $waited = 0
    do {
        Start-Sleep -Seconds 3
        $waited += 3
        $op = Invoke-RestMethod -Uri $opUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
        Write-Host "  Waiting for Firebase setup... ($waited s)" -ForegroundColor Yellow
    } while (-not $op.done -and $waited -lt $maxWait)
    
    if ($op.done) {
        Write-Host "Firebase successfully added to project!" -ForegroundColor Green
    }
} catch {
    $errMsg = $_.Exception.Message
    if ($errMsg -match "already" -or $errMsg -match "409") {
        Write-Host "Firebase already added to project (OK)" -ForegroundColor Yellow
    } else {
        Write-Host "Error adding Firebase: $errMsg" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Step 2: Creating Web App ===" -ForegroundColor Cyan

$createAppUrl = "https://firebase.googleapis.com/v1beta1/projects/$($ProjectId)/webApps"
$appBody = @{ displayName = "Traxo Web" } | ConvertTo-Json
try {
    $createAppResponse = Invoke-RestMethod -Uri $createAppUrl -Method Post -Headers $headers -Body $appBody -ErrorAction Stop
    
    # Poll for operation
    if ($createAppResponse.name -match "^operations/") {
        $opUrl = "https://firebase.googleapis.com/v1beta1/$($createAppResponse.name)"
        $maxWait = 60
        $waited = 0
        do {
            Start-Sleep -Seconds 3
            $waited += 3
            $op = Invoke-RestMethod -Uri $opUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
            Write-Host "  Waiting for web app creation... ($waited s)" -ForegroundColor Yellow
        } while (-not $op.done -and $waited -lt $maxWait)
        $appId = $op.response.appId
    } else {
        $appId = $createAppResponse.appId
    }
    
    Write-Host "Web App created! App ID: $appId" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "=== Step 3: Getting Web App Config ===" -ForegroundColor Cyan
    
    Start-Sleep -Seconds 3
    $configUrl = "https://firebase.googleapis.com/v1beta1/projects/$($ProjectId)/webApps/$($appId)/config"
    $config = Invoke-RestMethod -Uri $configUrl -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host ""
    Write-Host "=== Firebase Config ===" -ForegroundColor Green
    Write-Host "apiKey: $($config.apiKey)"
    Write-Host "authDomain: $($config.authDomain)"
    Write-Host "projectId: $($config.projectId)"
    Write-Host "storageBucket: $($config.storageBucket)"
    Write-Host "messagingSenderId: $($config.messagingSenderId)"
    Write-Host "appId: $($config.appId)"
    
    # Save to env file format
    $envContent = @"
NEXT_PUBLIC_FIREBASE_API_KEY=$($config.apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$($config.authDomain)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$($config.projectId)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$($config.storageBucket)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($config.messagingSenderId)
NEXT_PUBLIC_FIREBASE_APP_ID=$($config.appId)
"@
    
    $envContent | Out-File -FilePath "e:\Traxo\.env.production" -Encoding UTF8
    Write-Host ""
    Write-Host "Saved to e:\Traxo\.env.production" -ForegroundColor Green
    
    # Return appId for further use
    return $config
} catch {
    Write-Host "Error creating web app: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to list existing apps
    Write-Host "Listing existing web apps..." -ForegroundColor Yellow
    $listUrl = "https://firebase.googleapis.com/v1beta1/projects/$($ProjectId)/webApps"
    try {
        $existingApps = Invoke-RestMethod -Uri $listUrl -Method Get -Headers $headers
        if ($existingApps.apps) {
            $app = $existingApps.apps[0]
            Write-Host "Found existing app: $($app.appId)" -ForegroundColor Green
            
            $configUrl = "https://firebase.googleapis.com/v1beta1/projects/$($ProjectId)/webApps/$($app.appId)/config"
            $config = Invoke-RestMethod -Uri $configUrl -Method Get -Headers $headers
            
            Write-Host "apiKey: $($config.apiKey)"
            Write-Host "authDomain: $($config.authDomain)"
            Write-Host "projectId: $($config.projectId)"
            Write-Host "storageBucket: $($config.storageBucket)"
            Write-Host "messagingSenderId: $($config.messagingSenderId)"
            Write-Host "appId: $($config.appId)"
            
            $envContent = @"
NEXT_PUBLIC_FIREBASE_API_KEY=$($config.apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$($config.authDomain)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$($config.projectId)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$($config.storageBucket)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($config.messagingSenderId)
NEXT_PUBLIC_FIREBASE_APP_ID=$($config.appId)
"@
            $envContent | Out-File -FilePath "e:\Traxo\.env.production" -Encoding UTF8
            Write-Host "Saved to e:\Traxo\.env.production" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error listing apps: $($_.Exception.Message)" -ForegroundColor Red
    }
}
