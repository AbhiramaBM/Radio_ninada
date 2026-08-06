const API_BASE = 'http://localhost:5000/api';

async function runAuthSuite() {
  console.log('🧪 Starting Radio Ninada 2.0 Auth & OTP Verification Test Suite...\n');

  const testEmail = `testuser_${Date.now()}@radioninada.local`;
  const testPass = 'TestPass@123';
  const testName = 'QA Automated Tester';

  // 1. Sign Up Test
  console.log('1️⃣ Testing Sign Up Endpoint (/auth/signup)...');
  const signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testName, email: testEmail, password: testPass }),
  });
  const signupData: any = await signupRes.json();
  console.log('Signup Status:', signupRes.status, signupData);
  if (!signupData.success) throw new Error('Signup failed!');

  // 2. Duplicate Email Check Test
  console.log('\n2️⃣ Testing Duplicate Email Prevention...');
  const dupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testName, email: testEmail, password: testPass }),
  });
  const dupData: any = await dupRes.json();
  console.log('Duplicate Email Status:', dupRes.status, dupData);
  if (dupRes.status !== 400) throw new Error('Duplicate email not caught!');

  // 3. Login Test
  console.log('\n3️⃣ Testing Sign In Endpoint (/auth/login)...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPass }),
  });
  const loginData: any = await loginRes.json();
  console.log('Login Status:', loginRes.status, loginData.message);
  if (!loginData.success || !loginData.data.accessToken) throw new Error('Login failed!');

  // 4. Send OTP Test
  console.log('\n4️⃣ Testing OTP Generation & Delivery (/auth/send-otp)...');
  const otpRes = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, type: 'VERIFICATION' }),
  });
  const otpData: any = await otpRes.json();
  console.log('Send OTP Status:', otpRes.status, otpData);
  const devCode = otpData.data?.devOtpCode;
  if (!devCode) throw new Error('OTP Code not returned in dev mode!');

  // 5. Verify OTP Test
  console.log(`\n5️⃣ Testing OTP Verification (/auth/verify-otp) with code: ${devCode}...`);
  const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: devCode, type: 'VERIFICATION' }),
  });
  const verifyData: any = await verifyRes.json();
  console.log('Verify OTP Status:', verifyRes.status, verifyData);
  if (!verifyData.success) throw new Error('OTP verification failed!');

  // 6. Replay Attack Prevention Test
  console.log('\n6️⃣ Testing Replay Attack Prevention (Re-using verified OTP)...');
  const replayRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: devCode, type: 'VERIFICATION' }),
  });
  const replayData: any = await replayRes.json();
  console.log('Replay Attack Response:', replayRes.status, replayData.message);
  if (replayRes.status !== 400) throw new Error('Replay attack was not prevented!');

  // 7. Forgot Password OTP & Reset Test
  console.log('\n7️⃣ Testing Forgot Password OTP Flow (/auth/send-otp & /auth/reset-password)...');
  const forgotOtpRes = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, type: 'FORGOT_PASSWORD' }),
  });
  const forgotOtpData: any = await forgotOtpRes.json();
  const forgotDevCode = forgotOtpData.data?.devOtpCode;

  const newPass = 'NewSecurePass@123';
  const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: forgotDevCode, newPassword: newPass }),
  });
  const resetData: any = await resetRes.json();
  console.log('Reset Password Status:', resetRes.status, resetData);
  if (!resetData.success) throw new Error('Password reset failed!');

  // 8. Sign In with New Password Test
  console.log('\n8️⃣ Testing Sign In with New Password...');
  const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPass }),
  });
  const newLoginData: any = await newLoginRes.json();
  console.log('New Password Sign In Status:', newLoginRes.status, newLoginData.message);
  if (!newLoginData.success) throw new Error('Login with new password failed!');

  console.log('\n🎉 ALL 8 AUTHENTICATION & OTP TEST SUITES PASSED PERFECTLY!');
}

runAuthSuite().catch(err => {
  console.error('❌ Auth Suite Failure:', err);
  process.exit(1);
});
