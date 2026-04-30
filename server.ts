import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy for Google My Maps KML to bypass CORS
  app.get("/api/kml", async (req, res) => {
    const { mid } = req.query;
    if (!mid) {
      return res.status(400).json({ error: "Missing mid parameter" });
    }

    try {
      const url = `https://www.google.com/maps/d/kml?mid=${mid}&forcekml=1`;
      const response = await axios.get(url, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
      res.send(response.data);
    } catch (error) {
      console.error("Error fetching KML:", error);
      res.status(500).json({ error: "Failed to fetch KML data from Google" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
