const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// This creates/opens the SQLite database file
const db = new sqlite3.Database("./fau_forum.db");

// Create the posts table if it does not exist yet
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    username TEXT DEFAULT 'Anonymous',
    likes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create the comment table if it does not exist yet
db.run(` CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  username TEXT DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`); 

// Test route to make sure backend works
app.get("/api/health", (req, res) => {
  res.json({ message: "Backend is working" });
});

// Get all posts
app.get("/api/posts", (req, res) => {
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// Create a new post
app.post("/api/posts", (req, res) => {
  const { title, content, username } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  db.run(
    "INSERT INTO posts (title, content, username) VALUES (?, ?, ?)",
    [title, content, username || "Anonymous"],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        title,
        content,
        username: username || "Anonymous",
        likes: 0,
      });
    }
  );
});

// Get comments for a specific post
app.get("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;

  db.all("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC", [postId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// Create a new comment for a specific post
app.post("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const { content, username } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  // TODO: Replace "Anonymous" with the authenticated user's username once login is implemented.
  const createdAt = new Date().toISOString();

  db.run(
    "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)",
    [postId, username || "Anonymous", content],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        post_id: postId,
        username: username || "Anonymous",
        content,
        created_at: createdAt,
      });
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});