
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
        
        # Ensure runtime is nodejs
        if ($content -notmatch "export const runtime") {
            $content = "export const runtime = 'nodejs';`n" + $content
        }
        
        # Ensure dynamic is force-static
        if ($content -notmatch "export const dynamic") {
            $content = "export const dynamic = 'force-static';`n" + $content
        }
        
        Set-Content -Path $route -Value $content -Encoding UTF8
        Write-Host "Updated route directives for: $route" -ForegroundColor Green
    } else {
        Write-Host "File not found: $route" -ForegroundColor Red
    }
}
