// test-bcrypt.js - Simple bcrypt test
const bcrypt = require('bcryptjs');

async function testBcrypt() {
  console.log('Testing bcrypt functionality...\n');
  
  const password = 'password123';
  console.log(`Testing password: "${password}"`);
  
  // Test 1: Generate a fresh hash and verify it
  console.log('\n1. Generating fresh hash...');
  const freshHash = await bcrypt.hash(password, 10);
  console.log(`Fresh hash: ${freshHash}`);
  
  const freshTest = await bcrypt.compare(password, freshHash);
  console.log(`Fresh hash test: ${freshTest ? 'PASS' : 'FAIL'}`);
  
  // Test 2: Test the problematic hash from your database
  console.log('\n2. Testing your current database hash...');
  const currentHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  console.log(`Current hash: ${currentHash}`);
  
  const currentTest = await bcrypt.compare(password, currentHash);
  console.log(`Current hash test: ${currentTest ? 'PASS' : 'FAIL'}`);
  
  // Test 3: Test the replacement hash
  console.log('\n3. Testing replacement hash...');
  const replacementHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.2L8YxKpGDUxE6YqrYPWdJXA.g7Qg8O';
  console.log(`Replacement hash: ${replacementHash}`);
  
  const replacementTest = await bcrypt.compare(password, replacementHash);
  console.log(`Replacement hash test: ${replacementTest ? 'PASS' : 'FAIL'}`);
  
  // Test 4: Generate SQL for database update
  if (replacementTest) {
    console.log('\n4. SQL UPDATE STATEMENTS:');
    console.log('='.repeat(50));
    console.log('USE IMS;');
    console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${replacementHash}' WHERE EMAIL = 'owner@ims.com';`);
    console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${replacementHash}' WHERE EMAIL = 'admin@ims.com';`);
    console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${replacementHash}' WHERE EMAIL = 'agent@ims.com';`);
  } else {
    console.log('\n4. Generating new working hash...');
    const newHash = await bcrypt.hash(password, 10);
    const newTest = await bcrypt.compare(password, newHash);
    console.log(`New hash: ${newHash}`);
    console.log(`New hash test: ${newTest ? 'PASS' : 'FAIL'}`);
    
    if (newTest) {
      console.log('\nSQL UPDATE STATEMENTS:');
      console.log('='.repeat(50));
      console.log('USE IMS;');
      console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${newHash}' WHERE EMAIL = 'owner@ims.com';`);
      console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${newHash}' WHERE EMAIL = 'admin@ims.com';`);
      console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${newHash}' WHERE EMAIL = 'agent@ims.com';`);
    }
  }
}

testBcrypt().catch(console.error);