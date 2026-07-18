const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// This creates/opens the SQLite database file (use __dirname for reliability)
const dbPath = path.join(__dirname, "fau_forum.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err.message);
  } else {
    console.log("Connected to SQLite database at", dbPath);
  }
});

// Serialize table creation and migration to prevent race conditions
db.serialize(() => {
  // Create the posts table if it does not exist yet
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      username TEXT DEFAULT 'Anonymous',
      tags TEXT DEFAULT '',
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate: add tags column if it doesn't exist (safe for existing DBs)
  db.run(`ALTER TABLE posts ADD COLUMN tags TEXT DEFAULT ''`, (err) => {
    // Ignore "duplicate column" errors — column already exists
    if (err && !err.message.includes('duplicate column')) {
      console.error('Migration error:', err.message);
    }
  });
});

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

    // Convert tags from comma-separated string to array
    const posts = rows.map((row) => ({
      ...row,
      tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    }));

    res.json(posts);
  });
});

// Create a new post
app.post("/api/posts", (req, res) => {
  const { title, content, username, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  // Store tags as comma-separated string
  const tagsStr = Array.isArray(tags) ? tags.join(",") : "";

  db.run(
    "INSERT INTO posts (title, content, username, tags) VALUES (?, ?, ?, ?)",
    [title, content, username || "Anonymous", tagsStr],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        title,
        content,
        username: username || "Anonymous",
        tags: Array.isArray(tags) ? tags : [],
        likes: 0,
        created_at: new Date().toISOString(),
      });
    }
  );
});
// Edit/update a post
app.put("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  const tagsStr = Array.isArray(tags) ? tags.join(",") : null;

  db.run(
    `
    UPDATE posts
    SET title = ?, content = ?, tags = COALESCE(?, tags)
    WHERE id = ?
    `,
    [title, content, tagsStr, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Post not found." });
      }

      db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          ...row,
          tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
        });
      });
    }
  );
});

// Get comments for a specific post
app.get("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;

  db.all(
    "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC",
    [postId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// Add a comment to a post
app.post("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const { username, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Comment content is required." });
  }

  const createdAt = new Date().toISOString();

  db.run(
    "INSERT INTO comments (post_id, username, content, created_at) VALUES (?, ?, ?, ?)",
    [postId, username || "Anonymous", content, createdAt],
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
// Delete a post
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM posts WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Post not found." });
    }

    res.json({ message: "Post deleted successfully." });
  });
});
// Start the server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});