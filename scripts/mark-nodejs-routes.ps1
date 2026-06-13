
$apiRoutes = @(
    "e:\Traxo\src\app\api\scan\route.ts",
    "e:\Traxo\src\app\api\scan\schedule\route.ts",
    "e:\Traxo\src\app\api\export\route.ts",
    "e:\Traxo\src\app\api\developer\route.ts",
    "e:\Traxo\src\app\api\notifications\test\route.ts",
    "e:\Traxo\src\app\api\v1\trackers\route.ts",
    "e:\Traxo\src\app\api\webhooks\route.ts"
)

foreach ($route in $apiRoutes) {
    if (Test-Path $route) {
        $content = Get-Content $route -Raw
        if ($content -notmatch "export const runtime") {
            # Add nodejs runtime directive after first line
            $lines = $content -split "`n"
            $newContent = "export const runtime = 'nodejs';`n" + $content
            Set-Content -Path $route -Value $newContent -Encoding UTF8
            Write-Host "Added runtime=nodejs to: $route" -ForegroundColor Green
        } else {
            Write-Host "Already has runtime directive: $route" -ForegroundColor Yellow
        }
    } else {
        Write-Host "File not found: $route" -ForegroundColor Red
    }
}
