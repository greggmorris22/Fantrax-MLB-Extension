# PowerShell script to create a comprehensive player lookup from razzball.csv
# Maps by FantraxID (most accurate) and by Name+Position (fallback)

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$razzballFile = Join-Path $baseDir "razzball.csv"

# Main data structures
$byFantraxId = @{}
$byName = @{}

function Get-NormalizedPos {
    param($pos)
    if (-not $pos) { return "" }
    $pos = $pos.Trim().ToUpper()
    if ($pos -match "(SP|RP|^P$)") {
        return "P"
    }
    return "H"  # Hitter
}

# Load Razzball data using manual CSV parsing
Write-Host "Loading Razzball database..."
if (Test-Path $razzballFile) {
    $lines = Get-Content -Path $razzballFile
    $header = $lines[0] -split ","
    
    # Find column indices
    $nameIdx = [Array]::IndexOf($header, "Name")
    $fgIdIdx = [Array]::IndexOf($header, "FanGraphsID")
    $fantraxIdIdx = [Array]::IndexOf($header, "FantraxID")
    $teamIdx = [Array]::IndexOf($header, "Team")
    $posIdx = [Array]::IndexOf($header, "STD_POS")
    
    Write-Host "Columns: Name=$nameIdx, FanGraphsID=$fgIdIdx, FantraxID=$fantraxIdIdx, Team=$teamIdx, STD_POS=$posIdx"
    
    $razzCount = 0
    for ($i = 1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if (-not $line -or $line.Trim() -eq "") { continue }
        
        # Parse CSV line (simple split, handles most cases)
        $cols = $line -split ","
        
        $name = if ($nameIdx -ge 0 -and $nameIdx -lt $cols.Count) { $cols[$nameIdx] } else { "" }
        $fgId = if ($fgIdIdx -ge 0 -and $fgIdIdx -lt $cols.Count) { $cols[$fgIdIdx] } else { "" }
        $fantraxId = if ($fantraxIdIdx -ge 0 -and $fantraxIdIdx -lt $cols.Count) { $cols[$fantraxIdIdx] } else { "" }
        $team = if ($teamIdx -ge 0 -and $teamIdx -lt $cols.Count) { $cols[$teamIdx] } else { "" }
        $pos = if ($posIdx -ge 0 -and $posIdx -lt $cols.Count) { $cols[$posIdx] } else { "" }
        
        if (-not $fgId -or -not $name) { continue }
        
        $normalizedPos = Get-NormalizedPos -pos $pos
        
        $entry = @{
            fgId = $fgId
            name = $name
            pos = $normalizedPos
            team = $team
        }
        
        # Add to FantraxID index if available
        if ($fantraxId -and $fantraxId -ne "") {
            $byFantraxId[$fantraxId] = $entry
        }
        
        # Add to Name index
        if ($byName.ContainsKey($name)) {
            $exists = $false
            foreach ($existing in $byName[$name]) {
                if ($existing.fgId -eq $fgId) {
                    $exists = $true
                    break
                }
            }
            if (-not $exists) {
                $byName[$name] += $entry
            }
        } else {
            $byName[$name] = @($entry)
        }
        
        $razzCount++
    }
    
    Write-Host "Razzball: $razzCount entries loaded, $($byFantraxId.Count) with FantraxID"
} else {
    Write-Host "Error: Razzball file not found at $razzballFile"
}

# Load SFBB database for additional coverage
Write-Host "Loading SFBB database..."
$sfbbFile = Join-Path $baseDir "sfbb_player_ids.csv"
if (Test-Path $sfbbFile) {
    $sfbbLines = Get-Content -Path $sfbbFile
    $sfbbHeader = $sfbbLines[0] -split ","
    
    $sfbbNameIdx = [Array]::IndexOf($sfbbHeader, "mlb_name")
    $sfbbFgIdIdx = [Array]::IndexOf($sfbbHeader, "fg_id")
    $sfbbPosIdx = [Array]::IndexOf($sfbbHeader, "mlb_pos")
    
    $sfbbNew = 0
    for ($i = 1; $i -lt $sfbbLines.Count; $i++) {
        $line = $sfbbLines[$i]
        if (-not $line) { continue }
        
        $cols = $line -split ","
        $name = if ($sfbbNameIdx -ge 0 -and $sfbbNameIdx -lt $cols.Count) { $cols[$sfbbNameIdx] } else { "" }
        $fgId = if ($sfbbFgIdIdx -ge 0 -and $sfbbFgIdIdx -lt $cols.Count) { $cols[$sfbbFgIdIdx] } else { "" }
        $pos = if ($sfbbPosIdx -ge 0 -and $sfbbPosIdx -lt $cols.Count) { $cols[$sfbbPosIdx] } else { "" }
        
        if (-not $fgId -or -not $name) { continue }
        
        if (-not $byName.ContainsKey($name)) {
            $normalizedPos = Get-NormalizedPos -pos $pos
            $byName[$name] = @(@{
                fgId = $fgId
                name = $name
                pos = $normalizedPos
                team = ""
            })
            $sfbbNew++
        }
    }
    
    Write-Host "SFBB: Added $sfbbNew new players"
}

# Add manual entries
Write-Host "Adding manual entries..."
$manualPlayers = @(
    @{ name = "Yoshinobu Yamamoto"; fgId = "33825"; pos = "P"; team = "LAD" },
    @{ name = "Jung Hoo Lee"; fgId = "34019"; pos = "H"; team = "SF" },
    @{ name = "Shota Imanaga"; fgId = "33857"; pos = "P"; team = "CHC" },
    @{ name = "Ben Rice"; fgId = "26730"; pos = "H"; team = "NYY" },
    @{ name = "James Wood"; fgId = "sa3017770"; pos = "H"; team = "WSH" },
    @{ name = "Vinnie Pasquantino"; fgId = "24716"; pos = "H"; team = "KC" },
    @{ name = "Bryce Eldridge"; fgId = "29013"; pos = "H"; team = "SF" },
    @{ name = "Sebastian Walcott"; fgId = "sa3023994"; pos = "H"; team = "TEX" },
    @{ name = "Rainiel Rodriguez"; fgId = "sa3023987"; pos = "H"; team = "STL" },
    @{ name = "Jackson Chourio"; fgId = "sa3016951"; pos = "H"; team = "MIL" },
    @{ name = "Jackson Holliday"; fgId = "sa3018095"; pos = "H"; team = "BAL" },
    @{ name = "Junior Caminero"; fgId = "sa3018113"; pos = "H"; team = "TB" },
    @{ name = "Wyatt Langford"; fgId = "sa3018115"; pos = "H"; team = "TEX" },
    @{ name = "Jasson Dominguez"; fgId = "sa3009689"; pos = "H"; team = "NYY" },
    @{ name = "Travis Bazzana"; fgId = "sa3022776"; pos = "H"; team = "CLE" },
    @{ name = "Charlie Condon"; fgId = "sa3017879"; pos = "H"; team = "COL" },
    @{ name = "Roki Sasaki"; fgId = "35151"; pos = "P"; team = "LAD" }
)

foreach ($player in $manualPlayers) {
    if (-not $byName.ContainsKey($player.name)) {
        $byName[$player.name] = @(@{
            fgId = $player.fgId
            name = $player.name
            pos = $player.pos
            team = $player.team
        })
    }
}

# Create the combined output
$output = @{
    byFantraxId = $byFantraxId
    byName = $byName
}

$outputFile = Join-Path $baseDir "player_lookup.json"
$output | ConvertTo-Json -Depth 4 | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Created $outputFile"
Write-Host "  - FantraxID entries: $($byFantraxId.Count)"
Write-Host "  - Name entries: $($byName.Count)"
