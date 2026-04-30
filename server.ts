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
    console.log(`[Proxy] Request received for MID: ${mid}`);
    
    if (!mid || typeof mid !== 'string') {
      console.error("[Proxy] Missing or invalid mid parameter");
      return res.status(400).json({ error: "Missing or invalid mid parameter" });
    }

    try {
      // My Maps KML URL format
      const url = `https://www.google.com/maps/d/u/0/kml?mid=${mid}&forcekml=1`;
      console.log(`[Proxy] Fetching from Google: ${url}`);

      const response = await axios.get(url, {
        responseType: 'text',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.google-earth.kml+xml, application/xml, text/xml, */*'
        }
      });
      
      if (!response.data || typeof response.data !== 'string') {
        throw new Error("Received empty or non-string response from Google");
      }

      console.log(`[Proxy] Successfully fetched KML, bytes: ${response.data.length}`);
      
      // Basic check if it's actually KML/XML
      if (!response.data.trim().startsWith('<?xml') && !response.data.trim().startsWith('<kml')) {
        console.warn("[Proxy] Response does not look like XML/KML. First 100 chars:", response.data.substring(0, 100));
      }

      res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
      res.setHeader('Access-Control-Allow-Origin', '*'); // Extra safety
      res.send(response.data);
    } catch (error: any) {
      console.error("[Proxy] Error fetching KML:", error.message);
      
      if (error.response) {
        console.error("[Proxy] Google responded with status:", error.response.status);
        console.error("[Proxy] Google error body:", error.response.data?.substring?.(0, 200));
        return res.status(error.response.status).json({ 
          error: `Google returned ${error.response.status}`,
          details: error.response.data?.substring?.(0, 100) 
        });
      }
      
      res.status(500).json({ error: "Failed to fetch KML data from Google", message: error.message });
    }
  });

  // Proxy for Google My Maps Hosted Images to bypass NotSameSite/CORS
  app.get("/api/image", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "Missing image url" });
    }

    try {
      // Validate that it's a googleusercontent or mymaps url for safety
      if (!url.includes('googleusercontent.com') && !url.includes('google.com/hostedimage')) {
        return res.status(403).json({ error: "Only Google-hosted images are allowed for proxying" });
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      const contentType = response.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.send(response.data);
    } catch (error: any) {
      console.error("[Image Proxy] Error:", error.message);
      res.status(500).json({ error: "Failed to proxy image" });
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
