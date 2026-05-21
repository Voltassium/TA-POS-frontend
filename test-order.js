const axios = require('axios');

async function testOrder() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:8080/v1/authentications/login', {
      email: 'admin@pos.com',
      password: 'password'
    });
    const token = loginRes.data.data.token;
    console.log("Token:", token);

    // 2. Create Order
    try {
      const orderRes = await axios.post('http://localhost:8080/v1/orders', {
        table_id: 1
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Create Order Success:", orderRes.data);
      
      const orderId = orderRes.data.data.id;
      
      // 3. Add Item
      try {
        const itemRes = await axios.post(`http://localhost:8080/v1/orders/${orderId}/items`, {
          product_id: 1, // Assumes product 1 exists
          quantity: 2
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("Add Item Success:", itemRes.data);
      } catch (err) {
        console.error("Add Item Error:", err.response?.status, err.response?.data || err.message);
      }
      
    } catch (err) {
      console.error("Create Order Error:", err.response?.status, err.response?.data || err.message);
    }
  } catch (err) {
    console.error("Login Error:", err.response?.status, err.response?.data || err.message);
  }
}

testOrder();
