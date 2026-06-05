const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';

function getLatestLogFilePath() {
  const dir = 'C:\\Users\\zulke\\.gemini\\antigravity-ide\\brain\\084968ee-524c-4fa0-bce7-a4ea8f55b9f6\\.system_generated\\tasks';
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('task-') && f.endsWith('.log'))
    .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtimeMs }));
  if (files.length === 0) return null;
  files.sort((a, b) => b.time - a.time);
  return path.join(dir, files[0].name);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase variables in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runTests() {
  console.log('🚀 Starting e-Lost & Found IIUI Integration Tests...\n');

  const testEmail = 'testuser_' + Date.now() + '@iiu.edu.pk';
  const testPassword = 'Password123!';
  const testName = 'Integration Test User';
  const testPhone = '+923123456789';
  const testDept = 'Faculty of Computing';

  let testUser = null;
  let testItemLost = null;
  let testItemFound = null;
  let testClaim = null;
  let chatRoomId = null;

  try {
    // ----------------------------------------------------
    // STEP 1: Register User (Initiate OTP)
    // ----------------------------------------------------
    console.log(`➡️ Step 1: Registering user ${testEmail}...`);
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        fullName: testName,
        password: testPassword,
        department: testDept,
        phone: testPhone
      })
    });

    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${regData.error}`);
    console.log('✅ Registration request succeeded. Message:', regData.message);

    // Wait a brief moment for OTP to log
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ----------------------------------------------------
    // STEP 2: Read OTP from log
    // ----------------------------------------------------
    console.log('➡️ Step 2: Retrieving OTP code from server task logs...');
    const logFilePath = getLatestLogFilePath();
    if (!logFilePath || !fs.existsSync(logFilePath)) {
      throw new Error(`Server log file not found`);
    }
    const logs = fs.readFileSync(logFilePath, 'utf8');
    const otpMatch = logs.match(new RegExp(`\\[AUTH\\] Registration OTP for ${testEmail} is \\[ (\\d{6}) \\]`));
    if (!otpMatch) {
      console.log('Current logs:\n', logs);
      throw new Error('OTP code not found in server logs');
    }
    const otp = otpMatch[1];
    console.log(`✅ Retrieved OTP code from logs: [ ${otp} ]`);

    // ----------------------------------------------------
    // STEP 3: Verify OTP
    // ----------------------------------------------------
    console.log('➡️ Step 3: Verifying OTP to finalize account creation...');
    const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp })
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(`OTP verification failed: ${verifyData.error}`);
    testUser = verifyData.user;
    console.log('✅ Account successfully verified! User ID:', testUser.id);

    // ----------------------------------------------------
    // STEP 4: User Login
    // ----------------------------------------------------
    console.log('➡️ Step 4: Testing login endpoint with verified credentials...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
    console.log('✅ Login succeeded! Welcome:', loginData.user.fullName);

    // ----------------------------------------------------
    // STEP 5: Report a Lost Item
    // ----------------------------------------------------
    console.log('➡️ Step 5: Reporting a lost item...');
    const itemLostRes = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Red iPhone 13 Pro Max',
        description: 'Lost my iPhone 13. Red color with a blue case.',
        category: 'mobiles',
        type: 'lost',
        location: 'Central Library',
        date: '2026-06-05',
        reporterId: testUser.id,
        reporterEmail: testUser.email,
        reporterName: testUser.fullName
      })
    });
    const itemLostData = await itemLostRes.json();
    if (!itemLostRes.ok) throw new Error(`Lost item report failed: ${itemLostData.error}`);
    testItemLost = itemLostData.item;
    console.log('✅ Lost item reported. ID:', testItemLost.id);

    // ----------------------------------------------------
    // STEP 6: Report a Matching Found Item (triggers Smart Match)
    // ----------------------------------------------------
    console.log('➡️ Step 6: Reporting a matching found item to trigger Smart Match...');
    // We report this from another seeded user (e.g. Zainab Bibi)
    const zainabUser = {
      id: 'u_mpv3tgew-wuis2wok',
      email: 'zainab.fss@iiu.edu.pk',
      fullName: 'Zainab Bibi'
    };

    const itemFoundRes = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Found Red iPhone 13',
        description: 'Found a red color iPhone in a blue cover near the main desk.',
        category: 'mobiles',
        type: 'found',
        location: 'Central Library',
        date: '2026-06-05',
        reporterId: zainabUser.id,
        reporterEmail: zainabUser.email,
        reporterName: zainabUser.fullName
      })
    });
    const itemFoundData = await itemFoundRes.json();
    if (!itemFoundRes.ok) throw new Error(`Found item report failed: ${itemFoundData.error}`);
    testItemFound = itemFoundData.item;
    console.log('✅ Found item reported. ID:', testItemFound.id);

    // Wait 2 seconds for Smart Match async trigger to run and add notifications
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ----------------------------------------------------
    // STEP 7: Check notifications for Smart Match Alert
    // ----------------------------------------------------
    console.log('➡️ Step 7: Verifying Smart Match notification generation...');
    const ntfRes = await fetch(`${API_BASE}/notifications?userId=${testUser.id}`);
    const ntfData = await ntfRes.json();
    if (!ntfRes.ok) throw new Error(`Failed to fetch notifications: ${ntfData.error}`);
    
    const matchNtf = ntfData.find(n => n.type === 'match_found');
    if (!matchNtf) {
      console.log('Notifications list:', ntfData);
      throw new Error('Smart Match notification was not generated');
    }
    console.log('✅ Smart Match notification successfully verified! Message:', matchNtf.message);

    // ----------------------------------------------------
    // STEP 8: File a claim request
    // ----------------------------------------------------
    console.log('➡️ Step 8: Filing a claim for the found item...');
    const claimRes = await fetch(`${API_BASE}/items/${testItemFound.id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claimerId: testUser.id,
        claimerName: testUser.fullName,
        claimerEmail: testUser.email,
        proofDescription: 'The lockscreen is a picture of the Faisal Mosque and the phone has 128GB storage.'
      })
    });
    const claimData = await claimRes.json();
    if (!claimRes.ok) throw new Error(`Claim submission failed: ${claimData.error}`);
    testClaim = claimData.claim;
    console.log('✅ Claim submitted successfully! Claim ID:', testClaim.id);

    // ----------------------------------------------------
    // STEP 9: Approve the claim (as the finder)
    // ----------------------------------------------------
    console.log('➡️ Step 9: Approving claim request (acting as finder: Zainab Bibi)...');
    const approveRes = await fetch(`${API_BASE}/claims/${testClaim.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        userId: zainabUser.id,
        role: 'user'
      })
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(`Claim approval failed: ${approveData.error}`);
    console.log('✅ Claim approved successfully!');

    // ----------------------------------------------------
    // STEP 10: Verify Chat Room creation & Messages
    // ----------------------------------------------------
    console.log('➡️ Step 10: Checking secure chat room creation and message sending...');
    const chatsRes = await fetch(`${API_BASE}/chats?userId=${testUser.id}`);
    const chatsData = await chatsRes.json();
    if (!chatsRes.ok) throw new Error(`Failed to fetch chats: ${chatsData.error}`);

    const activeRoom = chatsData.find(c => c.itemId === testItemFound.id);
    if (!activeRoom) {
      console.log('Chat rooms:', chatsData);
      throw new Error('Chat room was not created for approved claim');
    }
    chatRoomId = activeRoom.id;
    console.log('✅ Active chat room verified. Room ID:', chatRoomId);

    // Send a coordinate message
    const msgRes = await fetch(`${API_BASE}/chats/${chatRoomId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testUser.id,
        senderName: testUser.fullName,
        text: 'Hi Zainab, let meet up at the Central Library desk tomorrow at 11 AM.'
      })
    });
    const msgData = await msgRes.json();
    if (!msgRes.ok) throw new Error(`Sending message failed: ${msgData.error}`);
    console.log('✅ Chat message successfully delivered. Content:', msgData.text);

    // ----------------------------------------------------
    // STEP 11: Complete Handover & Remove Listing (Deletes item, claim, chat room)
    // ----------------------------------------------------
    console.log('➡️ Step 11: Simulating handover completion (deleting item & cleanup)...');
    const deleteRes = await fetch(`${API_BASE}/items/${testItemFound.id}?userId=${zainabUser.id}&role=user`, {
      method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteData.error}`);
    console.log('✅ Handover completed! Listing, claims, and chat rooms successfully removed.');

    console.log('\n🌟 ALL INTEGRATION TESTS PASSED 100% SUCCESS! 🌟');

  } catch (err) {
    console.error('\n❌ Integration Test Failed:', err.message);
  } finally {
    // ----------------------------------------------------
    // CLEANUP: Clean up test user and any test items left
    // ----------------------------------------------------
    console.log('\n🧹 Cleaning up test data from Supabase...');
    try {
      if (testUser) {
        await supabase.from('users').delete().eq('id', testUser.id);
        console.log(`   - Deleted test user: ${testUser.id}`);
      }
      if (testItemLost) {
        await supabase.from('items').delete().eq('id', testItemLost.id);
        console.log(`   - Deleted lost item: ${testItemLost.id}`);
      }
      if (testItemFound) {
        await supabase.from('items').delete().eq('id', testItemFound.id);
        console.log(`   - Deleted found item: ${testItemFound.id}`);
      }
      if (testClaim) {
        await supabase.from('claims').delete().eq('id', testClaim.id);
        console.log(`   - Deleted claim: ${testClaim.id}`);
      }
      if (chatRoomId) {
        await supabase.from('chats').delete().eq('id', chatRoomId);
        console.log(`   - Deleted chat room: ${chatRoomId}`);
      }
      console.log('✅ Cleanup complete.');
    } catch (cleanupErr) {
      console.error('⚠️ Cleanup warning:', cleanupErr.message);
    }
  }
}

runTests();
