const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test the result search API
const testSearchAPI = async () => {
  try {
    console.log('Testing Result Search API...\n');
    
    // Test with a sample roll number
    const testRollNumbers = ['GK1158', 'GK1134', 'GK1181', 'GK1099', 'GK1015'];
    
    for (const rollNumber of testRollNumbers) {
      console.log(`Testing roll number: ${rollNumber}`);
      
      try {
        const response = await fetch(`http://localhost:5000/api/results/search/${rollNumber}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ Success: ${data.data.name} - ${data.data.marks} marks - Rank #${data.data.rank}`);
        } else {
          console.log(`❌ Error: ${data.message}`);
        }
      } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
      }
      
      console.log('---');
    }
    
    // Test with invalid roll number
    console.log('Testing invalid roll number: INVALID123');
    try {
      const response = await fetch('http://localhost:5000/api/results/search/INVALID123');
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`✅ Expected Error: ${data.message}`);
      } else {
        console.log(`❌ Unexpected Success: ${data.data.name}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testSearchAPI();
