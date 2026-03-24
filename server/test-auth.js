const API_URL = "http://localhost:5000/api";

async function testAuth() {
  const timestamp = Date.now();
  const user = {
    name: "Test User",
    email: `test${timestamp}@example.com`,
    password: "password123",
    role: "buyer",
  };

  console.log("--- STARTING AUTHENTICATION TEST ---");
  console.log("Found backend at:", API_URL);

  // 1. Register
  console.log("\n1. Registering new user:", user.email);
  try {
    const regRes = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    console.log("Registration Status:", regRes.status);
    const regData = await regRes.json();
    console.log("Registration Response:", regData);
  } catch (e) {
    console.error("Registration Request Failed:", e.message);
    return;
  }

  // 2. Login
  console.log("\n2. Logging in...");
  let token;
  try {
    const loginRes = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    console.log("Login Status:", loginRes.status);
    const loginData = await loginRes.json();

    if (loginData.token) {
      token = loginData.token;
      console.log("SUCCESS: Token received!");
    } else {
      console.error("FAILURE: No token received.");
      console.log("Login Response:", loginData);
      return;
    }
  } catch (e) {
    console.error("Login Request Failed:", e.message);
    return;
  }

  // 3. Protected Route
  console.log("\n3. Testing Protected Route /api/protected...");
  try {
    const protectedRes = await fetch(`${API_URL}/protected`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Protected Route Status:", protectedRes.status);
    const protectedData = await protectedRes.json();
    console.log("Protected Route Response:", protectedData);

    if (protectedRes.status === 200) {
      console.log("\n*** TEST PASSED successfully! ***");
    } else {
      console.log("\n*** TEST FAILED on protected route ***");
    }
  } catch (e) {
    console.error("Protected Route Request Failed:", e.message);
  }
}

testAuth();
