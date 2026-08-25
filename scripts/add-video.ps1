<#
.SYNOPSIS
  向作品集 data/projects.json 追加一个视频条目。
.DESCRIPTION
  用法示例：
    .\scripts\add-video.ps1 -Project "国风系列款式" -Title "龙 317" -Url "https://<桶名>.cos.<地域>.myqcloud.com/videos/guofeng/long317.mp4"
  也可用项目 id：-Project "guofeng"
  若项目不存在，加 -NewProject 自动创建。
.EXAMPLE
  .\scripts\add-video.ps1 -Project "国风系列款式" -Title "新作品" -Url "https://xxx.cos.ap-shanghai.myqcloud.com/videos/guofeng/new.mp4"
#>
param(
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Url,
    [string]$DataFile = "data\projects.json",
    [switch]$NewProject
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DataFile)) { throw "找不到数据文件: $DataFile" }
if ($Url -notmatch '^https?://') { throw "Url 必须是 http(s) 直链" }

$data = Get-Content -Raw -Encoding UTF8 $DataFile | ConvertFrom-Json

$proj = $data.projects | Where-Object { $_.id -eq $Project -or $_.name -eq $Project } | Select-Object -First 1

if (-not $proj) {
    if (-not $NewProject) {
        $names = ($data.projects | ForEach-Object { $_.name }) -join "、"
        throw "项目 '$Project' 不存在。可用项目：$names。确认无误可加 -NewProject 自动创建。"
    }
    $id = ($Project -replace '[^\w-]', '')
    if (-not $id) { $id = "project" + ($data.projects.Count + 1) }
    $proj = [PSCustomObject]@{ id = $id; name = $Project; videos = @() }
    $data.projects += $proj
    Write-Host "已创建新项目: $Project (id=$id)"
}

$exists = $proj.videos | Where-Object { $_.url -eq $Url }
if ($exists) { Write-Warning "该 URL 已存在，跳过。"; exit 0 }

$video = [PSCustomObject]@{ title = $Title; url = $Url }
$proj.videos += $video

$data | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 $DataFile
$total = ($data.projects | ForEach-Object { $_.videos.Count } | Measure-Object -Sum).Sum
Write-Host "已追加: [$($proj.name)] $Title"
Write-Host "当前项目视频数: $($proj.videos.Count)，全站共 $total 个"
