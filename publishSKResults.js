const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Function to publish SK results
const publishSKResults = async () => {
  try {
    console.log('Publishing SK results...');
    
    // Publish all SK results
    const response = await fetch('http://localhost:5000/api/results/publish', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publishAll: true })
    });
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('SK Results published successfully!');
      console.log(`Published ${responseData.modifiedCount} results`);
    } else {
      const errorData = await response.json();
      console.error('Failed to publish SK results:', errorData.message);
    }
    
    // Test search for AJAY
    console.log('\nTesting search for AJAY (SK1158):');
    try {
      const searchResponse = await fetch('http://localhost:5000/api/results/search/SK1158');
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('AJAY search result:', JSON.stringify(searchData, null, 2));
      } else {
        console.log('AJAY not found in search');
      }
    } catch (error) {
      console.error('Error searching for AJAY:', error.message);
    }
    
    // Test search for AJAY with just number
    console.log('\nTesting search for AJAY (1158):');
    try {
      const searchResponse = await fetch('http://localhost:5000/api/results/search/1158');
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('AJAY search result (1158):', JSON.stringify(searchData, null, 2));
      } else {
        console.log('AJAY not found in search (1158)');
      }
    } catch (error) {
      console.error('Error searching for AJAY (1158):', error.message);
    }
    
  } catch (error) {
    console.error('Error publishing SK results:', error);
  }
};

// Run the publish operation
if (require.main === module) {
  publishSKResults();
}

module.exports = { publishSKResults };
