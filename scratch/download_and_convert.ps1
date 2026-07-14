$notes = @('C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5')

$instruments = @{
    'piano' = 'acoustic_grand_piano-mp3'
    'guitar' = 'acoustic_guitar_nylon-mp3'
    'bass' = 'electric_bass_finger-mp3'
    'ukulele' = 'acoustic_guitar_steel-mp3'
}

$baseUrl = "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM"
$outputDir = "d:\Projects\sound_grt\assets\sounds"

# Refresh path to ensure ffmpeg is available
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Clean up fake files
Write-Host "Cleaning up old corrupted files..."
Remove-Item -Path (Join-Path $outputDir "*.ogg") -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $outputDir "*.m4a") -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $outputDir "*.mp3") -ErrorAction SilentlyContinue

foreach ($inst in $instruments.GetEnumerator()) {
    $instName = $inst.Key
    $instRepoName = $inst.Value

    foreach ($note in $notes) {
        $noteLower = $note.ToLower()
        $mp3Name = "${instName}_${noteLower}.mp3"
        $m4aName = "${instName}_${noteLower}.m4a"
        $mp3Path = Join-Path $outputDir $mp3Name
        $m4aPath = Join-Path $outputDir $m4aName
        $url = "$baseUrl/$instRepoName/$note.mp3"

        try {
            Write-Host "Downloading $url..."
            Invoke-WebRequest -Uri $url -OutFile $mp3Path -UseBasicParsing -ErrorAction Stop
            
            Write-Host "Converting to $m4aName..."
            ffmpeg -y -v error -i $mp3Path -c:a aac -b:a 128k -movflags +faststart $m4aPath
            
            if (Test-Path $m4aPath) {
                Remove-Item $mp3Path -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Host "Failed to process $note for $instName" -ForegroundColor Red
        }
    }
}

Write-Host "All downloads and conversions complete!"
