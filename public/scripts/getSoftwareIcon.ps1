Param(
    [string]$exePath
)

Add-Type -AssemblyName System.Drawing

Function Get-IconAsBase64 {
    Param(
        [string]$exePath
    )

    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
    $bitmap = $icon.ToBitmap()
    $stream = New-Object System.IO.MemoryStream
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $stream.ToArray()
    $base64 = [Convert]::ToBase64String($bytes)

    return $base64
}

$iconBase64 = Get-IconAsBase64 -exePath $exePath

$iconBase64
