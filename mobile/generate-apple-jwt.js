/**
 * Generate Apple Sign In Client Secret (JWT)
 *
 * Usage:
 * 1. Update the values below with your Apple Developer credentials
 * 2. Run: node generate-apple-jwt.js
 * 3. Copy the generated JWT to Supabase
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');

// ============================================
// REPLACE THESE WITH YOUR APPLE DEVELOPER VALUES
// ============================================

const TEAM_ID = '3B53GSA6H5';           // EvilGeniusLabs LLC - check Membership details if wrong
const KEY_ID = '3B53GSA6H5';             // From .p8 filename
const CLIENT_ID = 'com.lusterai.mobile';      // Bundle ID (for native Sign In)
const KEY_FILE_PATH = '/Users/ryanreid/Downloads/AuthKey_3B53GSA6H5.p8'; // Path to your .p8 file

// ============================================
// DON'T CHANGE BELOW THIS LINE
// ============================================

try {
  // Read the private key
  const privateKey = fs.readFileSync(KEY_FILE_PATH, 'utf8');

  // Create JWT payload
  const payload = {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 days (max allowed)
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  };

  // Sign the JWT
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    keyid: KEY_ID,
  });

  console.log('\n✅ Apple Sign In Client Secret (JWT) Generated!\n');
  console.log('Copy this JWT and paste it into Supabase "Secret Key (for OAuth)" field:\n');
  console.log('─'.repeat(80));
  console.log(token);
  console.log('─'.repeat(80));
  console.log('\n⚠️  This JWT expires in 180 days. You\'ll need to regenerate it periodically.\n');

} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  console.log('\nMake sure you:');
  console.log('1. Updated TEAM_ID, KEY_ID, CLIENT_ID in this script');
  console.log('2. Placed your .p8 file in the same directory');
  console.log('3. Updated KEY_FILE_PATH to match your .p8 filename');
  console.log('4. Installed jsonwebtoken: npm install jsonwebtoken\n');
}
