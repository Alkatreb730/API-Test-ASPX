
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// --- OpenAI API ---
app.get("/ai", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    const data = await response.json();
    res.json({ status: "✅ OpenAI Connected", models: data.data?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: "❌ OpenAI API Error", details: error.message });
  }
});

// --- CoinGecko API ---
app.get("/crypto", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/global");
    const data = await response.json();
    res.json({ status: "✅ CoinGecko Connected", market_cap_usd: data.data.total_market_cap.usd });
  } catch (error) {
    res.status(500).json({ error: "❌ CoinGecko API Error", details: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("ASPX Backend is running successfully 🚀");
});

app.listen(PORT, () => console.log(`✅ ASPX backend running on port ${PORT}`));
