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

// Proxy pro Acquaint data
app.use(
  "/acquaint",
  createProxyMiddleware({
    target: "https://www.acquaintcrm.co.uk",
    changeOrigin: true,
    secure: true,
    logLevel: "debug",
    pathRewrite: {
      "^/acquaint": "",
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`➡️ Proxying to: https://www.acquaintcrm.co.uk${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`⬅️ Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error("❌ Proxy error:", err.message);
      res.status(500).json({ error: "Proxy error", message: err.message });
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
