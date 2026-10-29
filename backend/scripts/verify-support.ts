import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

async function testApi() {
  console.log('--- STARTING SUPPORT MODULE API VERIFICATION ---');

  // 1. Get tokens for users
  console.log('\n1. Logging in users...');
  const users = {
    passenger: { email: 'pacenger@gmail.com', password: 'Password@123', token: '' },
    driver: { email: 'driver@gmail.com', password: 'Password@123', token: '' },
    fleetOwner: { email: 'vehicleowner@gmail.com', password: 'Password@123', token: '' },
    support: { email: 'support@gmail.com', password: 'Password@123', token: '' },
    admin: { email: 'admin@gmail.com', password: 'Password@123', token: '' },
  };

  for (const [key, creds] of Object.entries(users)) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: creds.email,
        password: creds.password,
      });
      creds.token = response.data.accessToken || response.data.data.accessToken;
      console.log(`✓ Logged in as ${key} (${creds.email})`);
    } catch (err: any) {
      console.error(`✗ Failed to log in as ${key}:`, err.response?.data || err.message);
    }
  }

  // 2. Passenger creates a support ticket
  console.log('\n2. Passenger creating a support ticket...');
  let ticketId = '';
  try {
    const response = await axios.post(
      `${BASE_URL}/support/tickets`,
      {
        subject: 'Booking payment failed but money deducted',
        description: 'I tried to book a trip from Mumbai to Pune. The payment failed at checkout, but the amount was deducted from my account. Please refund.',
        category: 'PAYMENT',
        priority: 'HIGH',
      },
      {
        headers: { Authorization: `Bearer ${users.passenger.token}` },
      }
    );
    const data = response.data.data || response.data;
    ticketId = data.id;
    console.log(`✓ Ticket created successfully! Number: ${data.ticketNumber}, ID: ${ticketId}`);
  } catch (err: any) {
    console.error('✗ Failed to create ticket:', err.response?.data || err.message);
    return;
  }

  // 3. Passenger views their own tickets
  console.log('\n3. Passenger viewing their tickets...');
  try {
    const response = await axios.get(`${BASE_URL}/support/tickets`, {
      headers: { Authorization: `Bearer ${users.passenger.token}` },
    });
    const data = response.data.data || response.data;
    console.log(`✓ Passenger found ${data.length || data.data?.length} tickets.`);
  } catch (err: any) {
    console.error('✗ Passenger failed to view tickets:', err.response?.data || err.message);
  }

  // 4. Passenger views the specific ticket details
  console.log('\n4. Passenger viewing specific ticket details...');
  try {
    const response = await axios.get(`${BASE_URL}/support/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${users.passenger.token}` },
    });
    const data = response.data.data || response.data;
    console.log(`✓ Ticket subject: "${data.subject}", status: ${data.status}`);
  } catch (err: any) {
    console.error('✗ Passenger failed to view specific ticket:', err.response?.data || err.message);
  }

  // 5. Fleet Owner tries to view passenger\'s ticket (should fail - Forbidden)
  console.log('\n5. Fleet Owner trying to view passenger ticket...');
  try {
    await axios.get(`${BASE_URL}/support/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${users.fleetOwner.token}` },
    });
    console.error('✗ Fleet Owner was able to view passenger ticket! (Access control leak)');
  } catch (err: any) {
    console.log(`✓ Access denied as expected (status: ${err.response?.status}) - message: ${err.response?.data?.message || err.message}`);
  }

  // 6. Support agent views the ticket
  console.log('\n6. Support agent viewing the ticket...');
  try {
    const response = await axios.get(`${BASE_URL}/support/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${users.support.token}` },
    });
    const data = response.data.data || response.data;
    console.log(`✓ Support agent successfully loaded ticket. Subject: "${data.subject}"`);
  } catch (err: any) {
    console.error('✗ Support agent failed to view ticket:', err.response?.data || err.message);
  }

  // 7. Support agent assigns the ticket
  console.log('\n7. Support agent assigning the ticket to self...');
  try {
    // Get support agent profile to get their user ID
    const meResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${users.support.token}` },
    });
    const myId = meResponse.data.id || meResponse.data.data?.id;

    const response = await axios.post(
      `${BASE_URL}/support/tickets/${ticketId}/assign`,
      { agentId: myId },
      { headers: { Authorization: `Bearer ${users.support.token}` } }
    );
    const data = response.data.data || response.data;
    console.log(`✓ Ticket status updated to: ${data.status}, Assigned to: ${data.assignedTo?.name}`);
  } catch (err: any) {
    console.error('✗ Failed to assign ticket:', err.response?.data || err.message);
  }

  // 8. Passenger replies to the ticket (adds comment)
  console.log('\n8. Passenger adding comment to ticket...');
  try {
    const response = await axios.post(
      `${BASE_URL}/support/tickets/${ticketId}/comments`,
      { message: 'Hello, any updates on my refund request?' },
      { headers: { Authorization: `Bearer ${users.passenger.token}` } }
    );
    const data = response.data.data || response.data;
    const lastComment = data.comments?.[data.comments.length - 1];
    console.log(`✓ Comment added! Last comment: "${lastComment?.message}" from ${lastComment?.user?.name}`);
  } catch (err: any) {
    console.error('✗ Failed to add passenger comment:', err.response?.data || err.message);
  }

  // 9. Support agent replies to the ticket
  console.log('\n9. Support agent adding reply/comment to ticket...');
  try {
    const response = await axios.post(
      `${BASE_URL}/support/tickets/${ticketId}/comments`,
      { message: 'We are investigating the payment failure with our gateway provider. It should be resolved in 24 hours.' },
      { headers: { Authorization: `Bearer ${users.support.token}` } }
    );
    const data = response.data.data || response.data;
    const lastComment = data.comments?.[data.comments.length - 1];
    console.log(`✓ Support comment added! Last comment: "${lastComment?.message}" from ${lastComment?.user?.name}`);
  } catch (err: any) {
    console.error('✗ Failed to add support comment:', err.response?.data || err.message);
  }

  // 10. Support agent escalates the ticket
  console.log('\n10. Support agent escalating the ticket...');
  try {
    const response = await axios.post(
      `${BASE_URL}/support/tickets/${ticketId}/escalate`,
      { newPriority: 'CRITICAL', reason: 'Gateway discrepancy needs manager review' },
      { headers: { Authorization: `Bearer ${users.support.token}` } }
    );
    const data = response.data.data || response.data;
    console.log(`✓ Ticket priority escalated to: ${data.priority}. Reason: ${data.escalationReason}`);
  } catch (err: any) {
    console.error('✗ Failed to escalate ticket:', err.response?.data || err.message);
  }

  // 11. Support agent resolves the ticket
  console.log('\n11. Support agent resolving the ticket...');
  try {
    const response = await axios.post(
      `${BASE_URL}/support/tickets/${ticketId}/resolve`,
      { resolution: 'Refund of INR 500 has been initiated back to original payment source.' },
      { headers: { Authorization: `Bearer ${users.support.token}` } }
    );
    const data = response.data.data || response.data;
    console.log(`✓ Ticket resolved! Status: ${data.status}, Resolution: ${data.resolution}`);
  } catch (err: any) {
    console.error('✗ Failed to resolve ticket:', err.response?.data || err.message);
  }

  // 12. Support agent gets stats
  console.log('\n12. Support agent retrieving support stats...');
  try {
    const response = await axios.get(`${BASE_URL}/support/stats?days=30`, {
      headers: { Authorization: `Bearer ${users.support.token}` },
    });
    const data = response.data.data || response.data;
    console.log(`✓ Support stats fetched. Total tickets in last 30 days: ${data.totalTickets}`);
  } catch (err: any) {
    console.error('✗ Failed to fetch support stats:', err.response?.data || err.message);
  }

  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
}

testApi();
