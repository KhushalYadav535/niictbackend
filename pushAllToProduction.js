const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Function to push all local data to production in batches
const pushAllToProduction = async () => {
  try {
    console.log('Getting all local results...');
    
    // Get all local results
    const localResponse = await fetch('http://localhost:5000/api/results/all');
    const localResult = await localResponse.json();
    
    if (!localResult.success) {
      console.error('Failed to get local results:', localResult.message);
      return;
    }
    
    const localResults = localResult.data;
    console.log(`Found ${localResults.length} local results to push`);
    
    if (localResults.length === 0) {
      console.log('No local results found to push');
      return;
    }
    
    // Push results in batches of 10
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < localResults.length; i += batchSize) {
      const batch = localResults.slice(i, i + batchSize);
      console.log(`\nPushing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(localResults.length/batchSize)} (${batch.length} results)...`);
      
      for (const result of batch) {
        try {
          const resultData = {
            rollNumber: result.rollNumber,
            name: result.name,
            fatherName: result.fatherName,
            subject: result.subject,
            marks: result.marks,
            rank: result.rank,
            examDate: result.examDate,
            status: result.status,
            isPublished: result.isPublished
          };
          
          const response = await fetch('https://niictbackend.onrender.com/api/results/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultData)
          });
          
          if (response.ok) {
            successCount++;
            console.log(`✅ ${result.rollNumber} - ${result.name}`);
          } else {
            errorCount++;
            const errorData = await response.json();
            console.log(`❌ ${result.rollNumber} - ${result.name}: ${errorData.message}`);
          }
          
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          errorCount++;
          console.log(`❌ ${result.rollNumber} - ${result.name}: ${error.message}`);
        }
      }
      
      console.log(`Batch completed. Success: ${successCount}, Errors: ${errorCount}`);
    }
    
    console.log(`\n📊 Final Summary:`);
    console.log(`- Successfully pushed: ${successCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${successCount + errorCount}`);
    
    // Publish all results on production
    console.log('\n📢 Publishing all results on production...');
    const publishResponse = await fetch('https://niictbackend.onrender.com/api/results/publish', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publishAll: true })
    });
    
    if (publishResponse.ok) {
      const publishResult = await publishResponse.json();
      console.log(`✅ Published ${publishResult.modifiedCount} results on production`);
    } else {
      const errorData = await publishResponse.json();
      console.error('❌ Failed to publish on production:', errorData.message);
    }
    
    // Test a few results on production
    console.log('\n🧪 Testing results on production...');
    const testRollNumbers = ['SK1004', 'SK1158', 'SK1181'];
    
    for (const rollNumber of testRollNumbers) {
      try {
        const testResponse = await fetch(`https://niictbackend.onrender.com/api/results/search/${rollNumber}`);
        if (testResponse.ok) {
          const testResult = await testResponse.json();
          if (testResult.success) {
            console.log(`✅ ${rollNumber}: ${testResult.data.name} - ${testResult.data.marks} marks - Rank ${testResult.data.rank}`);
          } else {
            console.log(`❌ ${rollNumber}: ${testResult.message}`);
          }
        } else {
          console.log(`❌ ${rollNumber}: HTTP ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ ${rollNumber}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Data push to production completed!');
    
  } catch (error) {
    console.error('Error pushing to production:', error);
  }
};

// Run the push operation
if (require.main === module) {
  pushAllToProduction();
}

module.exports = { pushAllToProduction };
