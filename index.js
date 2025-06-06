const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const https = require("https");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, "cache");

// cache folder bana do agar nahi hai
fs.ensureDirSync(CACHE_DIR);

// File ko 5 minute baad delete karne ka function
function deleteFileAfterTimeout(filePath, timeout = 5 * 60 * 1000) {
  setTimeout(() => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.log("Error deleting file:", filePath, err);
        else console.log("Deleted file:", filePath);
      });
    }
  }, timeout);
}

// Home route
app.get("/", (req, res) => {
  res.send("JioSaavn Music Downloader API is running");
});

// Download route
app.get("/download", async (req, res) => {
  const query = req.query.song;
  if (!query) return res.status(400).json({ error: "song query missing" });

  try {
    // JioSaavn unofficial search API
    const searchRes = await axios.get(`https://saavn.me/search/songs?query=${encodeURIComponent(query)}`);

    if (!searchRes.data || !searchRes.data.data || searchRes.data.data.length === 0)
      return res.status(404).json({ error: "No song found" });

    const song = searchRes.data.data[0];
    const mp3Url = song.media_url[1]?.link; // 128kbps mp3
    if (!mp3Url) return res.status(404).json({ error: "MP3 link not found" });

    const safeTitle = song.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filePath = path.join(CACHE_DIR, safeTitle + ".mp3");

    // Agar pehle se file hai to use do
    if (fs.existsSync(filePath)) {
      console.log("Serving cached file:", filePath);
      return res.json({
        title: song.title,
        artists: song.singers,
        album: song.album,
        year: song.year,
        image: song.image[3]?.link || song.image[0]?.link || "",
        url: `/cache/${safeTitle}.mp3`
      });
    }

    // Mp3 download karo
    const fileStream = fs.createWriteStream(filePath);

    https.get(mp3Url.replace("http:", "https:"), (response) => {
      if (response.statusCode !== 200) {
        return res.status(500).json({ error: "Failed to download MP3" });
      }

      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        console.log("Downloaded and saved:", filePath);

        // 5 minute baad file delete karo
        deleteFileAfterTimeout(filePath);

        res.json({
          title: song.title,
          artists: song.singers,
          album: song.album,
          year: song.year,
          image: song.image[3]?.link || song.image[0]?.link || "",
          url: `/cache/${safeTitle}.mp3`
        });
      });
    }).on("error", (err) => {
      console.error("Download error:", err.message);
      return res.status(500).json({ error: "Download error" });
    });

  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Static cache folder serve karo
app.use("/cache", express.static(CACHE_DIR));

app.listen(PORT, () => {
  console.log(`JioSaavn Music Downloader API listening on port ${PORT}`);
});
