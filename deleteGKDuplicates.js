const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Function to delete all GK duplicate entries
const deleteGKDuplicates = async () => {
  try {
    console.log('Getting all results to find GK duplicates...');
    
    // Get all results
    const response = await fetch('http://localhost:5000/api/results/all');
    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to get results:', result.message);
      return;
    }
    
    const allResults = result.data;
    console.log(`Total results: ${allResults.length}`);
    
    // Find all GK entries
    const gkEntries = allResults.filter(r => r.rollNumber.startsWith('GK'));
    console.log(`Found ${gkEntries.length} GK entries to delete`);
    
    if (gkEntries.length === 0) {
      console.log('No GK entries found to delete');
      return;
    }
    
    // Show first 10 GK entries that will be deleted
    console.log('\nFirst 10 GK entries to be deleted:');
    gkEntries.slice(0, 10).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.rollNumber} - ${entry.name} - ${entry.marks} marks - Rank ${entry.rank}`);
    });
    
    console.log(`\nDeleting ${gkEntries.length} GK entries...`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const entry of gkEntries) {
      try {
        const deleteResponse = await fetch(`http://localhost:5000/api/results/${entry.rollNumber}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          deletedCount++;
          if (deletedCount % 50 === 0) {
            console.log(`Deleted ${deletedCount}/${gkEntries.length} GK entries...`);
          }
        } else {
          errorCount++;
          console.error(`Failed to delete ${entry.rollNumber}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error deleting ${entry.rollNumber}:`, error.message);
      }
    }
    
    console.log(`\nDeletion completed:`);
    console.log(`- Successfully deleted: ${deletedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    // Recalculate ranks
    console.log('\nRecalculating ranks...');
    const rankResponse = await fetch('http://localhost:5000/api/results/publish', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publishAll: true })
    });
    
    if (rankResponse.ok) {
      const rankResult = await rankResponse.json();
      console.log(`Ranks recalculated: ${rankResult.modifiedCount} results updated`);
    }
    
    // Show final top 10 results
    console.log('\nFinal Top 10 Results:');
    console.log('='.repeat(80));
    const topResponse = await fetch('http://localhost:5000/api/results/top/10');
    const topResult = await topResponse.json();
    
    if (topResult.success) {
      topResult.data.forEach((result, index) => {
        console.log(`${index + 1}. ${result.rollNumber} - ${result.name} - ${result.marks} marks - Rank ${result.rank}`);
      });
    }
    
    // Check AJAY specifically
    console.log('\nAJAY Result:');
    console.log('='.repeat(50));
    const ajayResponse = await fetch('http://localhost:5000/api/results/search/SK1158');
    if (ajayResponse.ok) {
      const ajayResult = await ajayResponse.json();
      if (ajayResult.success) {
        const ajay = ajayResult.data;
        console.log(`${ajay.rollNumber} - ${ajay.name} - ${ajay.marks} marks - Rank ${ajay.rank}`);
      }
    }
    
    console.log('\nGK duplicates deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting GK duplicates:', error);
  }
};

// Run the deletion operation
if (require.main === module) {
  deleteGKDuplicates();
}

module.exports = { deleteGKDuplicates };
