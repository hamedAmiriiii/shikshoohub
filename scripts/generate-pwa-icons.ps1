Add-Type -AssemblyName System.Drawing

function Save-Png {
    param([string]$Path, [int]$Size)
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 31, 154, 209))
    $g.FillRectangle($brush, 0, 0, $Size, $Size)
    $fontSize = [int]($Size * 0.22)
    $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold)
    $text = 'W'
    $sf = $g.MeasureString($text, $font)
    $x = ($Size - $sf.Width) / 2
    $y = ($Size - $sf.Height) / 2 - ($Size * 0.02)
    $g.DrawString($text, $font, [System.Drawing.Brushes]::White, $x, $y)
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$publicDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'public'
Save-Png (Join-Path $publicDir 'icon-192.png') 192
Save-Png (Join-Path $publicDir 'icon-512.png') 512
Write-Host "Generated icon-192.png and icon-512.png in public/"
