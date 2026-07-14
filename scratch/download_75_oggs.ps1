$baseUrl = "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM"
$outDir = "d:\Projects\sound_grt\assets\sounds"
Remove-Item -Path "$outDir\*.mp3" -ErrorAction SilentlyContinue

$bassNotes = @('C1', 'Db1', 'D1', 'Eb1', 'E1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'B1', 'C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2', 'C3')
$guitarNotes = @('C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5')
$ukeNotes = @('C5', 'Db5', 'D5', 'Eb5', 'E5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', 'Db6', 'D6', 'Eb6', 'E6', 'F6', 'Gb6', 'G6', 'Ab6', 'A6', 'Bb6', 'B6', 'C7')

$uiNotes = @('c3', 'db3', 'd3', 'eb3', 'e3', 'f3', 'gb3', 'g3', 'ab3', 'a3', 'bb3', 'b3', 'c4', 'db4', 'd4', 'eb4', 'e4', 'f4', 'gb4', 'g4', 'ab4', 'a4', 'bb4', 'b4', 'c5')

Write-Host "Starting download of 75 OGG files..."

for ($i=0; $i -lt 25; $i++) {
    $uiNote = $uiNotes[$i]
    curl.exe -s -L -o "$outDir/bass_$uiNote.ogg" "$baseUrl/acoustic_bass-ogg/$($bassNotes[$i]).ogg"
    curl.exe -s -L -o "$outDir/guitar_$uiNote.ogg" "$baseUrl/acoustic_guitar_steel-ogg/$($guitarNotes[$i]).ogg"
    curl.exe -s -L -o "$outDir/ukulele_$uiNote.ogg" "$baseUrl/acoustic_guitar_nylon-ogg/$($ukeNotes[$i]).ogg"
}

Write-Host "OGG Download complete!"
