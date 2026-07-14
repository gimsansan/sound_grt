git clone --depth 1 https://github.com/mcapodici/pianosounds.git d:\Projects\sound_grt\temp_pianosounds

$notes = @('C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5')

foreach ($note in $notes) {
    $src = "d:\Projects\sound_grt\temp_pianosounds\Piano.mf.$note.ogg"
    $destName = "piano_" + $note.ToLower() + ".ogg"
    $dest = "d:\Projects\sound_grt\assets\sounds\$destName"
    Copy-Item $src $dest -Force
}

Remove-Item -Recurse -Force d:\Projects\sound_grt\temp_pianosounds
