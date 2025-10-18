# PowerShell script to push all local results to production
Write-Host "Getting all local results..." -ForegroundColor Green

try {
    # Get all local results
    $localResults = Invoke-RestMethod -Uri "http://localhost:5000/api/results/all" -Method GET
    
    if (-not $localResults.success) {
        Write-Host "Failed to get local results: $($localResults.message)" -ForegroundColor Red
        exit 1
    }
    
    $results = $localResults.data
    Write-Host "Found $($results.Count) results to push" -ForegroundColor Yellow
    
    if ($results.Count -eq 0) {
        Write-Host "No results found to push" -ForegroundColor Red
        exit 1
    }
    
    # Show first 5 results
    Write-Host "`nFirst 5 results to be pushed:" -ForegroundColor Cyan
    for ($i = 0; $i -lt [Math]::Min(5, $results.Count); $i++) {
        $result = $results[$i]
        Write-Host "$($i + 1). $($result.rollNumber) - $($result.name) - $($result.marks) marks - Rank $($result.rank)" -ForegroundColor White
    }
    
    Write-Host "`nPushing all results to production..." -ForegroundColor Green
    
    $successCount = 0
    $errorCount = 0
    $batchSize = 10
    
    for ($i = 0; $i -lt $results.Count; $i += $batchSize) {
        $batch = $results[$i..([Math]::Min($i + $batchSize - 1, $results.Count - 1))]
        $batchNumber = [Math]::Floor($i / $batchSize) + 1
        $totalBatches = [Math]::Ceiling($results.Count / $batchSize)
        
        Write-Host "`nProcessing batch $batchNumber/$totalBatches ($($batch.Count) results)..." -ForegroundColor Yellow
        
        foreach ($result in $batch) {
            try {
                $body = @{
                    rollNumber = $result.rollNumber
                    name = $result.name
                    fatherName = $result.fatherName
                    subject = $result.subject
                    marks = $result.marks
                    rank = $result.rank
                    examDate = $result.examDate
                    status = $result.status
                    isPublished = $result.isPublished
                } | ConvertTo-Json
                
                $response = Invoke-RestMethod -Uri "https://niictbackend.onrender.com/api/results/create" -Method POST -ContentType "application/json" -Body $body
                
                if ($response.success) {
                    $successCount++
                    Write-Host "✅ $($result.rollNumber) - $($result.name)" -ForegroundColor Green
                } else {
                    $errorCount++
                    Write-Host "❌ $($result.rollNumber) - $($result.name): $($response.message)" -ForegroundColor Red
                }
                
                # Small delay to avoid overwhelming the server
                Start-Sleep -Milliseconds 100
                
            } catch {
                $errorCount++
                Write-Host "❌ $($result.rollNumber) - $($result.name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host "Batch $batchNumber completed. Success: $successCount, Errors: $errorCount" -ForegroundColor Cyan
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
    
    # Test a few results on production
    Write-Host "`n🧪 Testing results on production..." -ForegroundColor Cyan
    $testRollNumbers = @('SK1004', 'SK1158', 'SK1181', 'SK1099', 'SK1015')
    
    foreach ($rollNumber in $testRollNumbers) {
        try {
            $testResponse = Invoke-RestMethod -Uri "https://niictbackend.onrender.com/api/results/search/$rollNumber"
            if ($testResponse.success) {
                $data = $testResponse.data
                Write-Host "✅ $rollNumber`: $($data.name) - $($data.marks) marks - Rank $($data.rank)" -ForegroundColor Green
            } else {
                Write-Host "❌ $rollNumber`: $($testResponse.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ $rollNumber`: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🎉 All results pushed to production successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
