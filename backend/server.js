const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
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
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      username TEXT DEFAULT 'Anonymous',
      tags TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      link_url TEXT DEFAULT '',
      is_pinned INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      reports INTEGER DEFAULT 0,
      report_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`ALTER TABLE posts ADD COLUMN is_pinned INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

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

  db.run(`ALTER TABLE posts ADD COLUMN image_url TEXT DEFAULT ''`, (err) => {
  if (err && !err.message.includes("duplicate column")) {
    console.error("Migration error:", err.message);
  }
});

db.run(`ALTER TABLE posts ADD COLUMN link_url TEXT DEFAULT ''`, (err) => {
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
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reports INTEGER DEFAULT 0,
      report_reason TEXT DEFAULT ''
    )
  `);

  db.run(`ALTER TABLE comments ADD COLUMN likes INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

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

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
});
db.run(`
  CREATE TABLE IF NOT EXISTS saved_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL UNIQUE,
    username TEXT DEFAULT 'Anonymous',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
  )
`);
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
db.run(`
  CREATE TABLE IF NOT EXISTS comment_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    username TEXT DEFAULT 'Anonymous',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, username),
    FOREIGN KEY (comment_id) REFERENCES comments(id)
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS report_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reporter_username TEXT DEFAULT 'Anonymous',
    reason TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
app.get("/api/health", (req, res) => {
  res.json({ message: "Backend is working" });
});
app.get("/api/posts", (req, res) => {
  db.all(
    `
    SELECT 
      posts.*,
      COUNT(comments.id) AS comment_count
    FROM posts
    LEFT JOIN comments
      ON comments.post_id = posts.id
    GROUP BY posts.id
    ORDER BY posts.is_pinned DESC, posts.created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const posts = rows.map((row) => ({
        ...row,
        body: row.content,
        commentCount: row.comment_count || 0,
        isPinned: Boolean(row.is_pinned),
        tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
      }));

      res.json(posts);
    }
  );
});
app.post("/api/posts", (req, res) => {
  const { title, content, username, tags, image_url, link_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  const tagsStr = Array.isArray(tags) ? tags.join(",") : "";

  db.run(
    "INSERT INTO posts (title, content, username, tags, image_url, link_url) VALUES (?, ?, ?, ?, ?, ?)",
    [title, content, username || "Anonymous", tagsStr, image_url || "", link_url || ""],
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
        image_url: image_url || "",
        link_url: link_url || "",
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
app.patch("/api/posts/:id/report", (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const reporterUsername = req.body.username || "Jamie Owls";

  if (!reason || !allowedReportReasons.includes(reason)) {
    return res.status(400).json({
      error: "Invalid report reason.",
    });
  }

  db.get("SELECT * FROM posts WHERE id = ?", [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    db.run(
      `
      INSERT INTO report_records
      (target_type, target_id, reporter_username, reason, created_at)
      VALUES ('post', ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [id, reporterUsername, reason],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get(
          "SELECT COUNT(*) AS reportCount FROM report_records WHERE target_type = 'post' AND target_id = ?",
          [id],
          (err, countRow) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            const reportCount = countRow.reportCount || 0;

            db.run(
              "UPDATE posts SET reports = ?, report_reason = ? WHERE id = ?",
              [reportCount, reason, id],
              function (err) {
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
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});
app.get("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const username = req.query.username || "Jamie Owls";

  db.all(
    `
    SELECT 
      comments.*,
      CASE 
        WHEN comment_votes.id IS NULL THEN 0 
        ELSE 1 
      END AS liked_by_current_user
    FROM comments
    LEFT JOIN comment_votes
      ON comment_votes.comment_id = comments.id
      AND comment_votes.username = ?
    WHERE comments.post_id = ?
    ORDER BY comments.created_at DESC
    `,
    [username, postId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});
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
app.patch("/api/comments/:id/like", (req, res) => {
  const { id } = req.params;
  const username = req.body.username || "Jamie Owls";

  db.get("SELECT * FROM comments WHERE id = ?", [id], (err, comment) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    db.get(
      "SELECT * FROM comment_votes WHERE comment_id = ? AND username = ?",
      [id, username],
      (err, existingLike) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (existingLike) {
          db.run(
            "DELETE FROM comment_votes WHERE comment_id = ? AND username = ?",
            [id, username],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              db.run(
                "UPDATE comments SET likes = CASE WHEN COALESCE(likes, 0) > 0 THEN likes - 1 ELSE 0 END WHERE id = ?",
                [id],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  returnUpdatedComment(false);
                }
              );
            }
          );

          return;
        }

        db.run(
          "INSERT INTO comment_votes (comment_id, username) VALUES (?, ?)",
          [id, username],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            db.run(
              "UPDATE comments SET likes = COALESCE(likes, 0) + 1 WHERE id = ?",
              [id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                returnUpdatedComment(true);
              }
            );
          }
        );

        function returnUpdatedComment(liked) {
          db.get("SELECT * FROM comments WHERE id = ?", [id], (err, row) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              ...row,
              liked,
            });
          });
        }
      }
    );
  });
});
app.patch("/api/comments/:id/report", (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const reporterUsername = req.body.username || "Jamie Owls";

  if (!reason || !allowedReportReasons.includes(reason)) {
    return res.status(400).json({
      error: "Invalid report reason.",
    });
  }

  db.get("SELECT * FROM comments WHERE id = ?", [id], (err, comment) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    db.run(
      `
      INSERT INTO report_records
      (target_type, target_id, reporter_username, reason, created_at)
      VALUES ('comment', ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [id, reporterUsername, reason],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get(
          "SELECT COUNT(*) AS reportCount FROM report_records WHERE target_type = 'comment' AND target_id = ?",
          [id],
          (err, countRow) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            const reportCount = countRow.reportCount || 0;

            db.run(
              "UPDATE comments SET reports = ?, report_reason = ? WHERE id = ?",
              [reportCount, reason, id],
              function (err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                db.get("SELECT * FROM comments WHERE id = ?", [id], (err, row) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  res.json(row);
                });
              }
            );
          }
        );
      }
    );
  });
});
app.delete("/api/comments/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM report_records WHERE target_type = 'comment' AND target_id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run("DELETE FROM comments WHERE id = ?", [id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Comment not found." });
        }

        res.json({ message: "Comment deleted successfully." });
      });
    }
  );
});
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

      db.all(
        `
        SELECT target_id, reporter_username, reason, created_at
        FROM report_records
        WHERE target_type = 'post'
        ORDER BY created_at DESC
        `,
        [],
        (err, postReportDetails) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.all(
            `
            SELECT target_id, reporter_username, reason, created_at
            FROM report_records
            WHERE target_type = 'comment'
            ORDER BY created_at DESC
            `,
            [],
            (err, commentReportDetails) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              const postsWithDetails = reportedPosts.map((post) => ({
                ...post,
                reportDetails: postReportDetails.filter(
                  (detail) => Number(detail.target_id) === Number(post.id)
                ),
              }));

              const commentsWithDetails = reportedComments.map((comment) => ({
                ...comment,
                reportDetails: commentReportDetails.filter(
                  (detail) => Number(detail.target_id) === Number(comment.id)
                ),
              }));

              res.json({
                reportedPosts: postsWithDetails,
                reportedComments: commentsWithDetails,
              });
            }
          );
        }
      );
    });
  });
});
app.get("/api/posts/:id/saved", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM saved_posts WHERE post_id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ saved: !!row });
  });
});
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
app.get("/api/saved-posts", (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 25);
  const offset = (page - 1) * limit;

  db.get("SELECT COUNT(*) AS total FROM saved_posts", [], (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(
      `
      SELECT posts.*
      FROM saved_posts
      JOIN posts ON saved_posts.post_id = posts.id
      ORDER BY saved_posts.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const savedPosts = rows.map((row) => ({
          ...row,
          tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
        }));

        res.json({
          posts: savedPosts,
          page,
          limit,
          total: countRow.total || 0,
          totalPages: Math.ceil((countRow.total || 0) / limit),
        });
      }
    );
  });
});
app.patch("/api/posts/:id/pin", (req, res) => {
  const { id } = req.params;
  const isPinned = req.body.isPinned ? 1 : 0;

  db.run(
    "UPDATE posts SET is_pinned = ? WHERE id = ?",
    [isPinned, id],
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
          isPinned: Boolean(row.is_pinned),
          tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
        });
      });
    }
  );
});
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
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@fau\.edu$/i;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Email must be a valid @fau.edu address." });
  }

  if (!username || username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: "Email is already taken." });

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: "Username is already taken." });
      db.run(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, password],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          
          res.status(201).json({
            id: this.lastID,
            username,
            email,
            avatar: "",
            bio: "",
            created_at: new Date().toISOString()
          });
        }
      );
    });
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
});
app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "User not found." });

    db.get(
      "SELECT COUNT(*) as count FROM posts WHERE username = ?",
      [user.username],
      (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { password, ...userWithoutPassword } = user;
        res.json({
          ...userWithoutPassword,
          postCount: countRow.count || 0
        });
      }
    );
  });
});
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, bio, avatar } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "User not found." });

    if (username && username !== user.username) {
      if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters." });
      }

      db.get("SELECT * FROM users WHERE username = ?", [username], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing) return res.status(400).json({ error: "Username is already taken." });
        
        updateUser();
      });
    } else {
      updateUser();
    }

    function updateUser() {
      const newUsername = username !== undefined ? username : user.username;
      const newBio = bio !== undefined ? bio : user.bio;
      const newAvatar = avatar !== undefined ? avatar : user.avatar;

      db.run(
        "UPDATE users SET username = ?, bio = ?, avatar = ? WHERE id = ?",
        [newUsername, newBio, newAvatar, id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });

          db.get("SELECT * FROM users WHERE id = ?", [id], (err, updatedUser) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const { password, ...userWithoutPassword } = updatedUser;
            res.json(userWithoutPassword);
          });
        }
      );
    }
  });
});
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});