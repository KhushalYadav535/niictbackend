# PowerShell script to push failed results with 0.01 marks
Write-Host "Pushing failed results with 0.01 marks..." -ForegroundColor Green

$errorRollNumbers = @(
    'SK1274', 'SK1270', 'SK1246', 'SK1239', 'SK1237', 'SK1217', 'SK1210', 'SK1207', 'SK1204', 'SK1200',
    'SK1183', 'SK1178', 'SK1175', 'SK1170', 'SK1166', 'SK1164', 'SK1159', 'SK1151', 'SK1149', 'SK1145',
    'SK1133', 'SK1125', 'SK1121', 'SK1108', 'SK1082', 'SK1081', 'SK1080', 'SK1076', 'SK1074', 'SK1072',
    'SK1060', 'SK1056', 'SK1043', 'SK1033', 'SK1032', 'SK1030', 'SK1027', 'SK1020', 'SK1013'
)

$successCount = 0
$errorCount = 0

foreach ($rollNumber in $errorRollNumbers) {
    try {
        Write-Host "Processing ${rollNumber}..." -ForegroundColor Yellow
        
        # Get local data
        $localResult = Invoke-RestMethod -Uri "http://localhost:5000/api/results/search/${rollNumber}" -Method GET
        
        if ($localResult.success) {
            $data = $localResult.data
            
            # Create body with 0.01 marks instead of 0
            $body = @{
                rollNumber = $data.rollNumber
                name = $data.name
                fatherName = $data.fatherName
                subject = $data.subject
                marks = 0.01  # Fix: Use 0.01 instead of 0
                rank = $data.rank
                examDate = $data.examDate
                status = $data.status
                isPublished = $data.isPublished
            } | ConvertTo-Json
            
            # Push to production
            $response = Invoke-RestMethod -Uri "https://niictbackend.onrender.com/api/results/create" -Method POST -ContentType "application/json" -Body $body
            
            if ($response.success) {
                $successCount++
                Write-Host "✅ ${rollNumber} - $($data.name) - 0.01 marks" -ForegroundColor Green
            } else {
                $errorCount++
                Write-Host "❌ ${rollNumber} - $($data.name): $($response.message)" -ForegroundColor Red
            }
        } else {
            $errorCount++
            Write-Host "❌ ${rollNumber}: Not found locally" -ForegroundColor Red
        }
        
        # Small delay
        Start-Sleep -Milliseconds 200
        
    } catch {
        $errorCount++
        Write-Host "❌ ${rollNumber}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📊 Final Summary:" -ForegroundColor Magenta
Write-Host "- Successfully pushed: $successCount" -ForegroundColor Green
Write-Host "- Errors: $errorCount" -ForegroundColor Red
Write-Host "- Total processed: $($successCount + $errorCount)" -ForegroundColor Yellow

# Publish all results on production
Write-Host "`n📢 Publishing all results on production..." -ForegroundColor Green
try {
    $publishBody = @{ publishAll = $true } | ConvertTo-Json
    $publishResponse = Invoke-RestMethod -Uri "https://niictbackend.onrender.com/api/results/publish" -Method PATCH -ContentType "application/json" -Body $publishBody
    
    if ($publishResponse.success) {
        Write-Host "✅ Published $($publishResponse.modifiedCount) results on production" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to publish: $($publishResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to publish: $($_.Exception.Message)" -ForegroundColor Red
}

# Test a few of the previously failed results
Write-Host "`n🧪 Testing previously failed results..." -ForegroundColor Cyan
$testRollNumbers = @('SK1275', 'SK1274', 'SK1270', 'SK1246', 'SK1239')

foreach ($rollNumber in $testRollNumbers) {
    try {
        $testResponse = Invoke-RestMethod -Uri "https://niictbackend.onrender.com/api/results/search/${rollNumber}"
        if ($testResponse.success) {
            $data = $testResponse.data
            Write-Host "✅ ${rollNumber}: $($data.name) - $($data.marks) marks - Rank $($data.rank)" -ForegroundColor Green
        } else {
            Write-Host "❌ ${rollNumber}: $($testResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ ${rollNumber}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Failed results push completed!" -ForegroundColor Green
