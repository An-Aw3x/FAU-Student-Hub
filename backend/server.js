const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// This creates/opens the SQLite database file
const dbPath = path.join(__dirname, "fau_forum.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err.message);
  } else {
    console.log("Connected to SQLite database at", dbPath);
  }
});

const allowedReportReasons = [
  "spam",
  "harassment",
  "nudity",
  "hate",
  "violence",
  "other",
];

// Serialize table creation and migration
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      username TEXT DEFAULT 'Anonymous',
      tags TEXT DEFAULT '',
      likes INTEGER DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      reports INTEGER DEFAULT 0,
      report_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`ALTER TABLE posts ADD COLUMN tags TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE posts ADD COLUMN upvotes INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE posts ADD COLUMN downvotes INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE posts ADD COLUMN reports INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE posts ADD COLUMN report_reason TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      username TEXT DEFAULT 'Anonymous',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reports INTEGER DEFAULT 0,
      report_reason TEXT DEFAULT ''
    )
  `);

  db.run(`ALTER TABLE comments ADD COLUMN reports INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  db.run(`ALTER TABLE comments ADD COLUMN report_reason TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });
});

// Saved/bookmarked posts table
db.run(`
  CREATE TABLE IF NOT EXISTS saved_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL UNIQUE,
    username TEXT DEFAULT 'Anonymous',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
  )
`);

// Tracks one vote per user per post
db.run(`
  CREATE TABLE IF NOT EXISTS post_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    username TEXT DEFAULT 'Anonymous',
    vote_type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, username),
    FOREIGN KEY (post_id) REFERENCES posts(id)
  )
`);

// Test route
app.get("/api/health", (req, res) => {
  res.json({ message: "Backend is working" });
});

// Get all posts
app.get("/api/posts", (req, res) => {
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

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
        upvotes: 0,
        downvotes: 0,
        reports: 0,
        report_reason: "",
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

// Vote on a post
app.patch("/api/posts/:id/vote", (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;
  const username = req.body.username || "Jamie Owls";

  if (voteType !== "up" && voteType !== "down") {
    return res.status(400).json({ error: "voteType must be 'up' or 'down'." });
  }

  db.get("SELECT * FROM posts WHERE id = ?", [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    db.get(
      "SELECT * FROM post_votes WHERE post_id = ? AND username = ?",
      [id, username],
      (err, existingVote) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        let upvotes = post.upvotes || 0;
        let downvotes = post.downvotes || 0;
        let voteState = voteType;

        if (existingVote && existingVote.vote_type === voteType) {
          voteState = "none";

          if (voteType === "up") {
            upvotes = Math.max(upvotes - 1, 0);
          } else {
            downvotes = Math.max(downvotes - 1, 0);
          }

          db.run(
            "DELETE FROM post_votes WHERE post_id = ? AND username = ?",
            [id, username],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              saveVoteCounts();
            }
          );

          return;
        }

        if (existingVote && existingVote.vote_type !== voteType) {
          if (existingVote.vote_type === "up") {
            upvotes = Math.max(upvotes - 1, 0);
            downvotes += 1;
          } else {
            downvotes = Math.max(downvotes - 1, 0);
            upvotes += 1;
          }

          db.run(
            "UPDATE post_votes SET vote_type = ? WHERE post_id = ? AND username = ?",
            [voteType, id, username],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              saveVoteCounts();
            }
          );

          return;
        }

        if (!existingVote) {
          if (voteType === "up") {
            upvotes += 1;
          } else {
            downvotes += 1;
          }

          db.run(
            "INSERT INTO post_votes (post_id, username, vote_type) VALUES (?, ?, ?)",
            [id, username, voteType],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              saveVoteCounts();
            }
          );
        }

        function saveVoteCounts() {
          db.run(
            "UPDATE posts SET upvotes = ?, downvotes = ? WHERE id = ?",
            [upvotes, downvotes, id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                res.json({
                  ...row,
                  tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
                  voteState,
                });
              });
            }
          );
        }
      }
    );
  });
});

// Report a post
app.patch("/api/posts/:id/report", (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !allowedReportReasons.includes(reason)) {
    return res.status(400).json({
      error: "Invalid report reason.",
    });
  }

  db.run(
    "UPDATE posts SET reports = COALESCE(reports, 0) + 1, report_reason = ? WHERE id = ?",
    [reason, id],
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
        reports: 0,
        report_reason: "",
      });
    }
  );
});

// Report a comment
app.patch("/api/comments/:id/report", (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !allowedReportReasons.includes(reason)) {
    return res.status(400).json({
      error: "Invalid report reason.",
    });
  }

  db.run(
    "UPDATE comments SET reports = COALESCE(reports, 0) + 1, report_reason = ? WHERE id = ?",
    [reason, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Comment not found." });
      }

      db.get("SELECT * FROM comments WHERE id = ?", [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json(row);
      });
    }
  );
});

// Admin: get all reported posts and comments
app.get("/api/reports", (req, res) => {
  const reportedPostsQuery = `
    SELECT 
      id,
      title,
      content,
      username,
      reports,
      report_reason,
      created_at
    FROM posts
    WHERE COALESCE(reports, 0) > 0
    ORDER BY reports DESC, created_at DESC
  `;

  const reportedCommentsQuery = `
    SELECT 
      comments.id,
      comments.post_id,
      comments.username,
      comments.content,
      comments.reports,
      comments.report_reason,
      comments.created_at,
      posts.title AS post_title
    FROM comments
    LEFT JOIN posts ON comments.post_id = posts.id
    WHERE COALESCE(comments.reports, 0) > 0
    ORDER BY comments.reports DESC, comments.created_at DESC
  `;

  db.all(reportedPostsQuery, [], (err, reportedPosts) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(reportedCommentsQuery, [], (err, reportedComments) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        reportedPosts,
        reportedComments,
      });
    });
  });
});

// Check if a post is saved
app.get("/api/posts/:id/saved", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM saved_posts WHERE post_id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ saved: !!row });
  });
});

// Save/bookmark a post
app.post("/api/posts/:id/save", (req, res) => {
  const { id } = req.params;
  const username = req.body.username || "Anonymous";

  db.get("SELECT * FROM posts WHERE id = ?", [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    db.run(
      "INSERT OR IGNORE INTO saved_posts (post_id, username) VALUES (?, ?)",
      [id, username],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: "Post saved.",
          saved: true,
          post_id: Number(id),
        });
      }
    );
  });
});

// Unsave/remove bookmark from a post
app.delete("/api/posts/:id/save", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM saved_posts WHERE post_id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      message: "Post unsaved.",
      saved: false,
      post_id: Number(id),
    });
  });
});

// Get all saved posts
app.get("/api/saved-posts", (req, res) => {
  db.all(
    `
    SELECT 
      posts.*
    FROM saved_posts
    JOIN posts ON saved_posts.post_id = posts.id
    ORDER BY saved_posts.created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const savedPosts = rows.map((row) => ({
        ...row,
        tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
      }));

      res.json(savedPosts);
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