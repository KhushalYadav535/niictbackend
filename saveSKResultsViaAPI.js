const fs = require('fs');

// Function to save SK results via API
const saveSKResultsViaAPI = async () => {
  try {
    // Read the extracted results
    const resultsData = JSON.parse(fs.readFileSync('./utils/sk_results.json', 'utf8'));
    console.log(`Found ${resultsData.length} SK results to save`);
    
    let saved = 0;
    let errors = 0;
    
    // Use bulk create endpoint
    try {
      const response = await fetch('http://localhost:5000/api/results/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results: resultsData })
      });
      
      if (response.ok) {
        const responseData = await response.json();
        saved = responseData.created;
        errors = responseData.errors ? responseData.errors.length : 0;
        console.log(`Bulk save completed: ${saved} results saved, ${errors} errors`);
        
        if (responseData.errors && responseData.errors.length > 0) {
          console.log('Errors:', responseData.errors);
        }
      } else {
        const errorData = await response.json();
        console.error('Bulk save failed:', errorData.message);
        errors = resultsData.length;
      }
    } catch (error) {
      console.error('Error in bulk save:', error.message);
      errors = resultsData.length;
    }
    
    console.log(`\nSK Results Summary:`);
    console.log(`- Results saved: ${saved}`);
    console.log(`- Errors: ${errors}`);
    
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
    
    console.log('\nSK Results saved via API successfully!');
    
  } catch (error) {
    console.error('Error saving SK results:', error);
  }
};

// Run the save operation
if (require.main === module) {
  saveSKResultsViaAPI();
}

module.exports = { saveSKResultsViaAPI };
