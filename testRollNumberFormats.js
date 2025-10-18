const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test different roll number formats
const testRollNumberFormats = async () => {
  try {
    console.log('Testing Different Roll Number Formats...\n');
    
    const testCases = [
      { input: '1158', expected: 'GK1158' },
      { input: 'GK1158', expected: 'GK1158' },
      { input: '1134', expected: 'GK1134' },
      { input: 'GK1134', expected: 'GK1134' },
      { input: '1181', expected: 'GK1181' },
      { input: 'GK1181', expected: 'GK1181' }
    ];
    
    for (const testCase of testCases) {
      console.log(`Testing input: "${testCase.input}" (expected: ${testCase.expected})`);
      
      try {
        const response = await fetch(`http://localhost:5000/api/results/search/${testCase.input}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ Success: ${data.data.rollNumber} - ${data.data.name} - ${data.data.marks} marks - Rank #${data.data.rank}`);
        } else {
          console.log(`❌ Error: ${data.message}`);
        }
      } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
      }
      
      console.log('---');
    }
    
    // Test invalid roll number
    console.log('Testing invalid roll number: 9999');
    try {
      const response = await fetch('http://localhost:5000/api/results/search/9999');
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
testRollNumberFormats();
