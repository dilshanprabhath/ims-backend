// genHash.js - Create this file in your backend folder and run it
const bcrypt = require('bcryptjs');

async function generateRealHashes() {
  console.log('🔐 GENERATING REAL PASSWORD HASHES FOR "password123"');
  console.log('='.repeat(60));
  
  const password = 'password123';
  const saltRounds = 10;
  
  console.log(`Password: "${password}"`);
  console.log(`Salt rounds: ${saltRounds}`);
  console.log('');
  
  // Generate 3 fresh hashes
  for (let i = 1; i <= 3; i++) {
    console.log(`Generating hash ${i}...`);
    
    const hash = await bcrypt.hash(password, saltRounds);
    const verification = await bcrypt.compare(password, hash);
    
    console.log(`Hash ${i}: ${hash}`);
    console.log(`Length: ${hash.length}`);
    console.log(`Verification: ${verification ? '✅ WORKS' : '❌ BROKEN'}`);
    console.log('');
  }
  
  // Test the "known good" hash that's not working
  console.log('🧪 TESTING THE PROBLEMATIC HASH:');
  console.log('='.repeat(40));
  const problematicHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  console.log(`Hash: ${problematicHash}`);
  
  try {
    const testResult = await bcrypt.compare('password123', problematicHash);
    console.log(`Test result: ${testResult ? '✅ WORKS' : '❌ DOES NOT WORK'}`);
    
    // Try other common passwords
    const testPasswords = ['password', 'test', 'hello', '123456', 'password123'];
    console.log('\nTrying different passwords:');
    for (const testPwd of testPasswords) {
      const result = await bcrypt.compare(testPwd, problematicHash);
      console.log(`  "${testPwd}": ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
  } catch (error) {
    console.log(`❌ Error testing hash: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 COPY THESE SQL STATEMENTS:');
  console.log('='.repeat(60));
  
  // Generate 3 more hashes for the SQL statements
  const ownerHash = await bcrypt.hash(password, saltRounds);
  const adminHash = await bcrypt.hash(password, saltRounds);
  const agentHash = await bcrypt.hash(password, saltRounds);
  
  console.log('USE IMS;');
  console.log('');
  console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${ownerHash}' WHERE EMAIL = 'owner@ims.com';`);
  console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${adminHash}' WHERE EMAIL = 'admin@ims.com';`);
  console.log(`UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = '${agentHash}' WHERE EMAIL = 'agent@ims.com';`);
  console.log('');
  console.log('-- Verify the updates:');
  console.log('SELECT USER_ID, EMAIL, LEFT(USER_KEY, 30) as HASH_PREVIEW FROM IMS_USERS_MASTER_TBL;');
}

generateRealHashes().catch(console.error);