# Royal Kuberaa - Assets and Launcher Icon Generator
Write-Host "Creating assets/images directory and copying logo..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\mlm_flutter_app\assets\images" | Out-Null
Copy-Item "$PSScriptRoot\mlm_webapp\public\royal-kuberaa-logo.jpg" "$PSScriptRoot\mlm_flutter_app\assets\images\logo.jpg" -Force

Write-Host "Generating Android Launcher Icons from royal-kuberaa-logo.jpg..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Drawing
$srcPath = "$PSScriptRoot\mlm_webapp\public\royal-kuberaa-logo.jpg"
if (Test-Path $srcPath) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $sizes = @{
        "mipmap-mdpi" = 48
        "mipmap-hdpi" = 72
        "mipmap-xhdpi" = 96
        "mipmap-xxhdpi" = 144
        "mipmap-xxxhdpi" = 192
    }

    foreach ($folder in $sizes.Keys) {
        $dim = $sizes[$folder]
        $destBmp = New-Object System.Drawing.Bitmap($dim, $dim)
        $g = [System.Drawing.Graphics]::FromImage($destBmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($src, 0, 0, $dim, $dim)
        $g.Dispose()
        $destFolder = "$PSScriptRoot\mlm_flutter_app\android\app\src\main\res\$folder"
        if (!(Test-Path $destFolder)) { New-Item -ItemType Directory -Force -Path $destFolder | Out-Null }
        $destPath = "$destFolder\ic_launcher.png"
        $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $destBmp.Dispose()
        Write-Host "  -> Generated $folder\ic_launcher.png ($dim x $dim)" -ForegroundColor Green
    }
    $src.Dispose()
    Write-Host "All launcher icons generated successfully!" -ForegroundColor Green
} else {
    Write-Host "Error: Logo image not found at $srcPath" -ForegroundColor Red
}
