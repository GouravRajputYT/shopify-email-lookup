import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_TOKEN;

app.post("/lookup", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const headers = {
    "X-Shopify-Access-Token": TOKEN,
    "Content-Type": "application/json",
  };

  try {
    const customerRes = await fetch(
      `https://${STORE}/admin/api/2024-01/customers/search.json?query=email:${email}`,
      { headers }
    );
    const customerData = await customerRes.json();

    if (!customerData.customers?.length) {
      return res.json({ found: false });
    }

    const customer = customerData.customers[0];

    const ordersRes = await fetch(
      `https://${STORE}/admin/api/2024-01/orders.json?customer_id=${customer.id}`,
      { headers }
    );
    const ordersData = await ordersRes.json();

    res.json({
      found: true,
      customer: {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
      },
      orders: ordersData.orders.map(o => ({
        order: o.name,
        total: o.total_price,
        status: o.fulfillment_status,
        date: o.created_at,
        admin_url: `https://${STORE}/admin/orders/${o.id}`
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Shopify API error" });
  }
});

app.listen(3000, () => console.log("Server running"));
