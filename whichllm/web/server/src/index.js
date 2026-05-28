import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const HF_API_BASE = "https://huggingface.co/api";

app.get("/api/models", async (req, res) => {
  try {
    const { search = "", limit = 50 } = req.query;
    
    const params = new URLSearchParams({
      search,
      limit: limit.toString(),
      sort: "downloads",
      direction: "-1",
      filter: "text-generation",
    });
    
    const response = await fetch(`${HF_API_BASE}/models?${params}`, {
      headers: {
        "User-Agent": "whichllm-web/1.0",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

app.get("/api/models/:author/:name", async (req, res) => {
  try {
    const { author, name } = req.params;
    const response = await fetch(`${HF_API_BASE}/models/${author}/${name}`, {
      headers: {
        "User-Agent": "whichllm-web/1.0",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching model details:", error);
    res.status(500).json({ error: "Failed to fetch model details" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`WhichLLM API proxy running on http://localhost:${PORT}`);
});
