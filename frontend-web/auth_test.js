const axios = require("axios");
(async () => {
  try {
    const base = "http://localhost:3000/api/v1";
    const email = `autotest${Date.now()}@example.com`;
    const phone = `+91999${Math.floor(1000000 + Math.random() * 9000000)}`;
    const register = await axios.post(`${base}/auth/register`, {
      email,
      phone,
      password: "Test1234A",
      firstName: "Auto",
      lastName: "Tester",
      userType: "passenger"
    });
    console.log("register data", register.data);
    const token = register.data.accessToken;
    const refresh = register.data.refreshToken;
    console.log("accessToken length", token.length, "refreshToken length", refresh.length);
    const profile = await axios.get(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    console.log("profile success", profile.data);
    const bookings = await axios.get(`${base}/bookings/mine?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    console.log("bookings success", bookings.data);
  } catch (err) {
    if (err.response) {
      console.error("status", err.response.status);
      console.error("data", JSON.stringify(err.response.data));
    } else {
      console.error(err);
    }
  }
})();
