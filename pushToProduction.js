const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Function to push local data to production
const pushToProduction = async () => {
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
    
    // Show first 5 results that will be pushed
    console.log('\nFirst 5 results to be pushed:');
    localResults.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
    });
    
    console.log(`\nPushing ${localResults.length} results to production...`);
    
    // Push to production using bulk create
    const productionResponse = await fetch('https://niictbackend.onrender.com/api/results/bulk-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ results: localResults })
    });
    
    if (productionResponse.ok) {
      const productionResult = await productionResponse.json();
      console.log(`Successfully pushed ${productionResult.created} results to production`);
      
      if (productionResult.errors && productionResult.errors.length > 0) {
        console.log(`Errors: ${productionResult.errors.length}`);
        console.log('First 5 errors:', productionResult.errors.slice(0, 5));
      }
    } else {
      const errorData = await productionResponse.json();
      console.error('Failed to push to production:', errorData.message);
      return;
    }
    
    // Publish all results on production
    console.log('\nPublishing all results on production...');
    const publishResponse = await fetch('https://niictbackend.onrender.com/api/results/publish', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publishAll: true })
    });
    
    if (publishResponse.ok) {
      const publishResult = await publishResponse.json();
      console.log(`Published ${publishResult.modifiedCount} results on production`);
    } else {
      const errorData = await publishResponse.json();
      console.error('Failed to publish on production:', errorData.message);
    }
    
    // Test SK1004 on production
    console.log('\nTesting SK1004 on production...');
    const testResponse = await fetch('https://niictbackend.onrender.com/api/results/search/SK1004');
    if (testResponse.ok) {
      const testResult = await testResponse.json();
      if (testResult.success) {
        console.log('✅ SK1004 found on production:', testResult.data.name, '-', testResult.data.marks, 'marks - Rank', testResult.data.rank);
      } else {
        console.log('❌ SK1004 not found on production:', testResult.message);
      }
    } else {
      console.log('❌ Failed to test SK1004 on production');
    }
    
    // Test AJAY on production
    console.log('\nTesting AJAY (SK1158) on production...');
    const ajayResponse = await fetch('https://niictbackend.onrender.com/api/results/search/SK1158');
    if (ajayResponse.ok) {
      const ajayResult = await ajayResponse.json();
      if (ajayResult.success) {
        console.log('✅ AJAY found on production:', ajayResult.data.name, '-', ajayResult.data.marks, 'marks - Rank', ajayResult.data.rank);
      } else {
        console.log('❌ AJAY not found on production:', ajayResult.message);
      }
    } else {
      console.log('❌ Failed to test AJAY on production');
    }
    
    console.log('\n✅ Data pushed to production successfully!');
    
  } catch (error) {
    console.error('Error pushing to production:', error);
  }
};

// Run the push operation
if (require.main === module) {
  pushToProduction();
}

module.exports = { pushToProduction };