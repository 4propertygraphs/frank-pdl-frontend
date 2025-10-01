const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Povolení CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Tvoje frontendové URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token", "key"],
  })
);

// Proxy pro Acquaint data (dynamické sitePrefix a siteId)
app.use(
  "/acquaint",
  createProxyMiddleware({
    target: "https://www.acquaintcrm.co.uk", // Základní cíl pro Acquaint
    changeOrigin: true,
    secure: true,
    logLevel: "debug",
    pathRewrite: {
      "^/acquaint": "", // Odstraní "/acquaint" z URL před odesláním na cíl
    },
    router: (req) => {
      // Extrahování sitePrefix a siteId z požadavku
      const { sitePrefix, siteId } = req.query; // Předpokládáme, že sitePrefix a siteId jsou v query parametrech
      if (sitePrefix && siteId) {
        return `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${sitePrefix}-${siteId}.xml`; // Sestavení konečné URL
      } else {
        // Fallback, pokud sitePrefix nebo siteId chybí
        return "https://www.acquaintcrm.co.uk/datafeeds/standardxml/default.xml";
      }
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`➡️ Proxying to: ${proxyReq.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`⬅️ Response: ${proxyRes.statusCode} pro ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error("❌ Proxy chyba:", err.message);
      res.status(500).json({ error: "Proxy chyba", message: err.message });
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Proxy server běží",
    target: "https://www.acquaintcrm.co.uk/datafeeds/standardxml/",
    port: PORT,
  });
});

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`🚀 Proxy běží na http://localhost:${PORT}`);
  console.log(`🔗 Acquaint API volání → http://localhost:${PORT}/acquaint/...`);
});
