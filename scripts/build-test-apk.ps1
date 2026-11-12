# Run only when an Android test build is explicitly requested. Plant app only.
param(
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9._-]*\.apk$')]
    [string]$OutputName = ('plantas-rio-' + (Get-Date -Format 'yyyy-MM-dd') + '-teste.apk')
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$workspaceRoot = Split-Path $projectRoot -Parent
$nodeBin = Join-Path $workspaceRoot '.tools\node\node-v22.14.0-win-x64'
$pythonBin = Join-Path $workspaceRoot '.tools\python'
$env:JAVA_HOME = Join-Path $workspaceRoot '.tools\java17\jdk-17.0.21.0.2+1'
$env:ANDROID_HOME = Join-Path $workspaceRoot '.tools\android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = Join-Path $workspaceRoot '.g'
$env:PATH = $nodeBin + ';' + $pythonBin + ';' + (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
$env:CI = '1'
$env:NODE_ENV = 'production'
$env:PYTHONUTF8 = '1'
$configuration = Get-Content -LiteralPath (Join-Path $projectRoot 'app.json') -Raw | ConvertFrom-Json
if ($configuration.expo.android.package -ne 'br.com.avesdosbrasis.plantasdorio') { throw 'Unexpected Android project.' }
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath 'android\gradlew.bat')) {
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Plant Android prebuild failed.' }
}
$appGradlePath = Join-Path $projectRoot 'android\app\build.gradle'
$appGradle = Get-Content -LiteralPath $appGradlePath -Raw
if (-not $appGradle.Contains('plantas-native')) {
    # This local staging directory avoids generated C++ paths over 260 characters.
    # No bird native folder, environment file, signing key or backend is imported.
    $stagingBlock = @'

// Short native build path for the standalone plant app on Windows.
android {
    externalNativeBuild {
        cmake {
            buildStagingDirectory file("${rootDir}/../../.b/plantas-native")
        }
    }
}
'@
    [IO.File]::WriteAllText($appGradlePath, $appGradle + $stagingBlock, [Text.UTF8Encoding]::new($false))
}
$appGradle = Get-Content -LiteralPath $appGradlePath -Raw
if (-not $appGradle.Contains('Track plant catalog JSON')) {
    $catalogInputBlock = @'

// Track plant catalog JSON in the Android JS bundle.
tasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach {
    inputs.files(fileTree("../../src/data") { include "**/*.json" })
}
'@
    [IO.File]::WriteAllText($appGradlePath, $appGradle + $catalogInputBlock, [Text.UTF8Encoding]::new($false))
}
$logDirectory = Join-Path $projectRoot 'backups\photo-selection'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logPath = Join-Path $logDirectory 'apk-build-retry.log'
Set-Location -LiteralPath (Join-Path $projectRoot 'android')
$buildErrorPreference = $ErrorActionPreference
try {
    # Windows PowerShell represents native stderr warnings as error records.
    # Gradle's exit status determines success, including harmless SDK warnings.
    $ErrorActionPreference = 'Continue'
    Write-Host "Building the Android test APK. Progress is also saved to $logPath"
    & .\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a' --no-daemon --max-workers=2 --console=plain 2>&1 | Tee-Object -FilePath $logPath
    $gradleExitCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $buildErrorPreference
}
if ($gradleExitCode -ne 0) { throw "Android build failed; inspect $logPath" }
Set-Location -LiteralPath $projectRoot
$outputDirectory = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$apkPath = Join-Path $outputDirectory $OutputName
$builtApkPath = (Resolve-Path -LiteralPath 'android\app\build\outputs\apk\release\app-release.apk').Path
if (-not $builtApkPath.StartsWith($projectRoot+'\') -or -not $apkPath.StartsWith($projectRoot+'\dist\')) { throw 'Unexpected APK output path.' }
Move-Item -LiteralPath $builtApkPath -Destination $apkPath -Force
& (Join-Path $pythonBin 'python.exe') scripts\verify_test_apk.py $apkPath --output (Join-Path $outputDirectory 'apk-verification.json')
if ($LASTEXITCODE -ne 0) { throw 'APK catalog/image verification failed.' }
$buildTools = Join-Path $env:ANDROID_HOME 'build-tools\36.0.0'
try {
    $ErrorActionPreference = 'Continue'
    & (Join-Path $buildTools 'apksigner.bat') verify --verbose $apkPath > (Join-Path $outputDirectory 'apk-signature.txt')
    $signatureExitCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $buildErrorPreference
}
if ($signatureExitCode -ne 0) { throw 'APK signature verification failed.' }
$badging = & (Join-Path $buildTools 'aapt.exe') dump badging $apkPath
if ($LASTEXITCODE -ne 0 -or -not ($badging -join "`n").Contains("package: name='br.com.avesdosbrasis.plantasdorio'")) { throw 'APK package identity mismatch.' }
$badging | Set-Content -LiteralPath (Join-Path $outputDirectory 'apk-identity.txt') -Encoding UTF8
Write-Output "Verified test APK: $apkPath"
