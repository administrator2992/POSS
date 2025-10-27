import { dbService } from './DatabaseService';

async function testDatabase() {
  console.log('Testing database service...');
  
  // Test employee operations
  console.log('Testing employee operations...');
  const employees = await dbService.getEmployees();
  console.log('Current employees:', employees);
  
  // Test inventory operations
  console.log('Testing inventory operations...');
  const inventory = await dbService.getInventory();
  console.log('Current inventory:', inventory);
  
  // Test transaction operations
  console.log('Testing transaction operations...');
  const transactions = await dbService.getTransactions();
  console.log('Current transactions:', transactions);
  
  console.log('Database test completed!');
}

// Run the test
testDatabase().catch(console.error);