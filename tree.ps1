param(
    [string]$Path = ".",
    [string[]]$Exclude = @(
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        ".turbo",
        ".cache"
    ),
    [switch]$OutputFile
)

$lines = @()

function Show-Tree {
    param(
        [string]$CurrentPath,
        [string]$Indent = ""
    )

    $items = Get-ChildItem -LiteralPath $CurrentPath -Force |
        Where-Object {
            $Exclude -notcontains $_.Name
        } |
        Sort-Object @{Expression={$_.PSIsContainer};Descending=$true}, Name

    for ($i = 0; $i -lt $items.Count; $i++) {

        $item = $items[$i]

        $isLast = ($i -eq $items.Count - 1)

        if ($isLast) {
            $branch = "└── "
            $nextIndent = $Indent + "    "
        }
        else {
            $branch = "├── "
            $nextIndent = $Indent + "│   "
        }

        $line = "$Indent$branch$($item.Name)"
        Write-Host $line
        $script:lines += $line

        if ($item.PSIsContainer) {
            Show-Tree $item.FullName $nextIndent
        }
    }
}

Write-Host (Resolve-Path $Path)
$lines += (Resolve-Path $Path)

Show-Tree (Resolve-Path $Path)

if ($OutputFile) {
    $lines | Out-File tree.txt -Encoding UTF8
    Write-Host ""
    Write-Host "Saved to tree.txt"
}