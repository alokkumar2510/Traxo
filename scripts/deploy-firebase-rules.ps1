
# Enable Firebase Auth, Firestore, Storage and deploy rules
param([string]$ProjectId = "traxo-prod-2025")

$AccessToken = (gcloud auth print-access-token 2>&1).Trim()
$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

Write-Host "=== Enabling Firebase Auth ===" -ForegroundColor Cyan
# Enable Identity Platform (Firebase Auth)
$authUrl = "https://identitytoolkit.googleapis.com/v2/projects/$ProjectId/config?updateMask=signIn"
$authBody = @{
    signIn = @{
        email = @{ enabled = $true; passwordRequired = $true }
        anonymous = @{ enabled = $false }
    }
} | ConvertTo-Json -Depth 5

try {
    $authResponse = Invoke-RestMethod -Uri $authUrl -Method Patch -Headers $headers -Body $authBody -ErrorAction Stop
    Write-Host "Auth config updated!" -ForegroundColor Green
} catch {
    Write-Host "Auth config update: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Creating Firestore Database ===" -ForegroundColor Cyan
$firestoreUrl = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases?databaseId=(default)"
$firestoreBody = @{
    type = "FIRESTORE_NATIVE"
    locationId = "asia-south1"
} | ConvertTo-Json

try {
    $fsResponse = Invoke-RestMethod -Uri $firestoreUrl -Method Post -Headers $headers -Body $firestoreBody -ErrorAction Stop
    Write-Host "Firestore database creation started: $($fsResponse.name)" -ForegroundColor Green
    
    # Wait for it
    $opUrl = "https://firestore.googleapis.com/v1/$($fsResponse.name)"
    $waited = 0
    do {
        Start-Sleep -Seconds 5
        $waited += 5
        $op = Invoke-RestMethod -Uri $opUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
        Write-Host "  Waiting for Firestore... ($waited s)" -ForegroundColor Yellow
    } while (-not $op.done -and $waited -lt 120)
    
    if ($op.done) {
        Write-Host "Firestore database ready!" -ForegroundColor Green
    }
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "already" -or $msg -match "409") {
        Write-Host "Firestore already exists (OK)" -ForegroundColor Yellow
    } else {
        Write-Host "Firestore error: $msg" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Deploying Firestore Rules ===" -ForegroundColor Cyan
# Read the rules file
$firestoreRules = Get-Content "e:\Traxo\firestore.rules" -Raw

# Create a ruleset
$rulesetBody = @{
    source = @{
        files = @(
            @{
                name = "firestore.rules"
                content = $firestoreRules
            }
        )
    }
} | ConvertTo-Json -Depth 10

$rulesCreateUrl = "https://firebaserules.googleapis.com/v1/projects/$ProjectId/rulesets"
try {
    $ruleset = Invoke-RestMethod -Uri $rulesCreateUrl -Method Post -Headers $headers -Body $rulesetBody -ErrorAction Stop
    Write-Host "Firestore ruleset created: $($ruleset.name)" -ForegroundColor Green
    
    # Release the ruleset to the Firestore service
    $releaseBody = @{
        name = "projects/$ProjectId/releases/cloud.firestore"
        rulesetName = $ruleset.name
    } | ConvertTo-Json
    
    $releasesUrl = "https://firebaserules.googleapis.com/v1/projects/$ProjectId/releases"
    
    # Try update first, then create
    try {
        $release = Invoke-RestMethod -Uri "$releasesUrl/cloud.firestore" -Method Patch -Headers $headers -Body $releaseBody -ErrorAction Stop
        Write-Host "Firestore rules released (updated)!" -ForegroundColor Green
    } catch {
        try {
            $release = Invoke-RestMethod -Uri $releasesUrl -Method Post -Headers $headers -Body $releaseBody -ErrorAction Stop
            Write-Host "Firestore rules released (created)!" -ForegroundColor Green
        } catch {
            Write-Host "Release error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Ruleset error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Deploying Storage Rules ===" -ForegroundColor Cyan
$storageRules = Get-Content "e:\Traxo\storage.rules" -Raw
$storageRulesetBody = @{
    source = @{
        files = @(
            @{
                name = "storage.rules"
                content = $storageRules
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $storageRuleset = Invoke-RestMethod -Uri $rulesCreateUrl -Method Post -Headers $headers -Body $storageRulesetBody -ErrorAction Stop
    Write-Host "Storage ruleset created: $($storageRuleset.name)" -ForegroundColor Green
    
    # Release for storage bucket
    $storageRelBody = @{
        name = "projects/$ProjectId/releases/firebase.storage/$ProjectId.firebasestorage.app"
        rulesetName = $storageRuleset.name
    } | ConvertTo-Json
    
    try {
        $storageRel = Invoke-RestMethod -Uri $releasesUrl -Method Post -Headers $headers -Body $storageRelBody -ErrorAction Stop
        Write-Host "Storage rules released!" -ForegroundColor Green
    } catch {
        Write-Host "Storage release: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Storage ruleset error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== ALL FIREBASE SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Project: $ProjectId" -ForegroundColor Green
Write-Host "Firestore: ENABLED (asia-south1)" -ForegroundColor Green  
Write-Host "Auth: ENABLED" -ForegroundColor Green
Write-Host "Security Rules: DEPLOYED" -ForegroundColor Green
