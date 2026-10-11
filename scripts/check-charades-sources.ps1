param([string]$SourceDirectory = '.artifacts/charades-sources', [switch]$SnapshotPatch)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskSourceRoot = [IO.Path]::GetFullPath((Join-Path $taskRoot $SourceDirectory))

# Read unchanged official XLSX files in their ZIPs. Never modify the workbooks.
function Read-MoeHeadwords([string]$ZipPath, [string]$Column) {
  $taskOuter = [IO.Compression.ZipFile]::OpenRead($ZipPath)
  $taskMemory = [IO.MemoryStream]::new()
  try {
    $taskXlsx = @($taskOuter.Entries | Where-Object FullName -Like '*.xlsx')
    if ($taskXlsx.Count -ne 1) { throw "Expected one workbook: $ZipPath" }
    $taskStream = $taskXlsx[0].Open()
    try { $taskStream.CopyTo($taskMemory) } finally { $taskStream.Dispose() }
    $taskMemory.Position = 0
    $taskBook = [IO.Compression.ZipArchive]::new($taskMemory, [IO.Compression.ZipArchiveMode]::Read, $true)
    try {
      $taskReader = [IO.StreamReader]::new($taskBook.GetEntry('xl/sharedStrings.xml').Open())
      try { [xml]$taskStringsXml = $taskReader.ReadToEnd() } finally { $taskReader.Dispose() }
      $taskStrings = @($taskStringsXml.sst.si | ForEach-Object { $_.InnerText })
      $taskReader = [IO.StreamReader]::new($taskBook.GetEntry('xl/worksheets/sheet1.xml').Open())
      try { [xml]$taskSheet = $taskReader.ReadToEnd() } finally { $taskReader.Dispose() }
      $taskResult = @{}
      foreach ($taskRow in $taskSheet.worksheet.sheetData.row) {
        if ([int]$taskRow.r -le 1) { continue }
        $taskCell = $taskRow.c | Where-Object r -EQ ($Column + $taskRow.r)
        if (!$taskCell) { continue }
        $taskTerm = [string]$taskCell.v
        if ($taskCell.t -eq 's') { $taskTerm = $taskStrings[[int]$taskCell.v] }
        if ($taskTerm -and !$taskResult.ContainsKey($taskTerm)) { $taskResult[$taskTerm] = [int]$taskRow.r }
      }
      return $taskResult
    } finally { $taskBook.Dispose() }
  } finally { $taskOuter.Dispose(); $taskMemory.Dispose() }
}

$taskIdiomZip = Join-Path $taskSourceRoot 'dict_idioms_2020_20260929.zip'
$taskConcisedZip = Join-Path $taskSourceRoot 'dict_concised_2014_20260929.zip'
$taskIdioms = Read-MoeHeadwords $taskIdiomZip 'B'
$taskConcised = Read-MoeHeadwords $taskConcisedZip 'A'
$taskChecks = [ordered]@{}
$taskErrors = [Collections.Generic.List[string]]::new()
$taskDataDirectory = Join-Path $taskRoot 'src/games/charades/data'
foreach ($taskCategory in @('animals','food','life','jobs','sports','things','characters','idioms','emotions','celebrities')) {
  $taskText = Get-Content -LiteralPath (Join-Path $taskDataDirectory ($taskCategory + '.ts')) -Raw -Encoding utf8
  foreach ($taskMatch in [regex]::Matches($taskText, '\b([afljstcien][0-9]{3}):([^\s`]+)')) {
    $taskId = 'charades-' + $taskMatch.Groups[1].Value
    $taskLabel = $taskMatch.Groups[2].Value
    if ($taskCategory -eq 'idioms') {
      if (!$taskIdioms.ContainsKey($taskLabel)) { $taskErrors.Add("Not an exact MOE idiom headword: $taskId $taskLabel"); continue }
      $taskChecks[$taskId] = [ordered]@{ term = $taskLabel; source = 'moe-idioms'; row = $taskIdioms[$taskLabel] }
    } elseif ($taskConcised.ContainsKey($taskLabel)) {
      $taskChecks[$taskId] = [ordered]@{ term = $taskLabel; source = 'moe-concised'; row = $taskConcised[$taskLabel] }
    }
  }
}
if ($taskErrors.Count) { $taskErrors | ForEach-Object { Write-Host $_ }; exit 1 }
$taskSources = [ordered]@{
  'moe-idioms' = [ordered]@{ version = '2020_20260929'; sha256 = (Get-FileHash -LiteralPath $taskIdiomZip -Algorithm SHA256).Hash.ToLowerInvariant() }
  'moe-concised' = [ordered]@{ version = '2014_20260929'; sha256 = (Get-FileHash -LiteralPath $taskConcisedZip -Algorithm SHA256).Hash.ToLowerInvariant() }
}
# One compact entry per line keeps the verification artifact reviewable.
$taskJsonLines = @('{', '  "checkedAt": "2026-10-11",', ('  "sources": ' + ($taskSources | ConvertTo-Json -Depth 3 -Compress) + ','), '  "entries": {')
$taskKeys = @($taskChecks.Keys)
for ($taskIndex = 0; $taskIndex -lt $taskKeys.Count; $taskIndex++) {
  $taskId = $taskKeys[$taskIndex]
  $taskComma = if ($taskIndex -lt $taskKeys.Count - 1) { ',' } else { '' }
  $taskJsonLines += ('    "' + $taskId + '": ' + ($taskChecks[$taskId] | ConvertTo-Json -Compress) + $taskComma)
}
$taskJsonLines += @('  }', '}')
if ($SnapshotPatch) {
  $taskOutput = 'src/games/charades/data/source-checks.json'
  $taskLines = @('*** Begin Patch')
  if (Test-Path -LiteralPath (Join-Path $taskRoot $taskOutput)) {
    $taskLines += "*** Update File: $taskOutput", '@@'
    $taskLines += (Get-Content -LiteralPath (Join-Path $taskRoot $taskOutput) -Encoding utf8 | ForEach-Object { '-' + $_ })
  } else { $taskLines += "*** Add File: $taskOutput" }
  $taskLines += ($taskJsonLines | ForEach-Object { '+' + $_ })
  $taskLines += '*** End Patch'
  $taskLines -join "`n"
} else {
  $taskStored = Get-Content -LiteralPath (Join-Path $taskDataDirectory 'source-checks.json') -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
  foreach ($taskSource in $taskSources.Keys) {
    if ($taskStored.sources[$taskSource].sha256 -ne $taskSources[$taskSource].sha256) { throw "Source checksum changed: $taskSource" }
  }
  if ($taskStored.entries.Count -ne $taskChecks.Count) { throw 'Source snapshot is stale; regenerate a patch with -SnapshotPatch.' }
  foreach ($taskId in $taskChecks.Keys) {
    $taskExpected = $taskChecks[$taskId]
    $taskActual = $taskStored.entries[$taskId]
    if (!$taskActual -or $taskActual.term -cne $taskExpected.term -or $taskActual.source -ne $taskExpected.source -or $taskActual.row -ne $taskExpected.row) { throw "Stale source record: $taskId" }
  }
  "MOE verification passed: $($taskChecks.Count) exact headwords; $(@($taskChecks.Values | Where-Object source -EQ 'moe-idioms').Count) idioms."
}
