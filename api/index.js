import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// SUPABASE CONNECTION
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ===============================
// PATH HELPER
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// STATIC FILES
// ===============================
const publicPath = fs.existsSync(path.resolve(__dirname, "../public/Frontend"))
  ? path.resolve(__dirname, "../public/Frontend")
  : path.resolve(__dirname, "../public");

app.use(express.static(publicPath));

// ===============================
// GUESTBOOK ROUTES (SUPABASE)
// ===============================

// GET ALL
app.get("/guestbook", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// POST
app.post("/guestbook", async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        status: "error",
        message: "Name dan message wajib diisi",
      });
    }

    const { data, error } = await supabase
      .from("guestbook")
      .insert([{ name, message }])
      .select();

    if (error) throw error;

    res.status(201).json({
      status: "success",
      data: data[0],
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ===============================
// SPA FALLBACK
// ===============================
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ===============================
// LOCAL DEV SERVER
// ===============================
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun && !process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// ===============================
// EXPORT FOR VERCEL
// ===============================
export default app;