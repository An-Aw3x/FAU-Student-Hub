require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const app = express();
const PORT = Number(process.env.PORT) || 3001;

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

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getForumUsername = (value) => {
  if (typeof value !== "string") return "Anonymous";

  const username = value.trim();
  return username || "Anonymous";
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const SAVED_POSTS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS saved_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    username TEXT NOT NULL DEFAULT 'Anonymous',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, username),
    FOREIGN KEY (post_id) REFERENCES posts(id)
  )
`;

const USER_FOLLOWS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_username TEXT NOT NULL,
    following_username TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_username, following_username)
  )
`;

const getSavedPostUsername = (value) => {
  if (typeof value !== "string") return "Anonymous";

  const username = value.trim();
  return username || "Anonymous";
};

const initializeSavedPostsTable = async () => {
  await runAsync(SAVED_POSTS_SCHEMA);

  const table = await getAsync(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'saved_posts'"
  );
  const hasUserScopedConstraint = /UNIQUE\s*\(\s*post_id\s*,\s*username\s*\)/i.test(
    table?.sql || ""
  );

  if (hasUserScopedConstraint) return;

  // SQLite requires rebuilding the table to replace the legacy UNIQUE(post_id) constraint.
  await runAsync("BEGIN IMMEDIATE TRANSACTION");

  try {
    await runAsync("DROP TABLE IF EXISTS saved_posts_migration");
    await runAsync(`
      CREATE TABLE saved_posts_migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        username TEXT NOT NULL DEFAULT 'Anonymous',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, username),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )
    `);
    await runAsync(`
      INSERT OR IGNORE INTO saved_posts_migration (id, post_id, username, created_at)
      SELECT
        id,
        post_id,
        COALESCE(NULLIF(TRIM(username), ''), 'Anonymous'),
        created_at
      FROM saved_posts
      ORDER BY id
    `);
    await runAsync("DROP TABLE saved_posts");
    await runAsync("ALTER TABLE saved_posts_migration RENAME TO saved_posts");
    await runAsync("COMMIT");
  } catch (error) {
    try {
      await runAsync("ROLLBACK");
    } catch (rollbackError) {
      console.error("Could not roll back saved posts migration:", rollbackError.message);
    }

    throw error;
  }
};

const normalizeProfilePosts = (rows) => {
  return rows.map((row) => ({
    ...row,
    body: row.content,
    commentCount: row.comment_count || 0,
    isPinned: Boolean(row.is_pinned),
    voteState: row.vote_state || "none",
    vote_state: row.vote_state || "none",
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
  }));
};

const getProfileUsername = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const getUserByUsername = (username) => {
  return getAsync(
    `SELECT
       id,
       username,
       avatar,
       bio,
       banner_color,
       banner_image,
       created_at
     FROM users
     WHERE username = ? COLLATE NOCASE`,
    [username]
  );
};

const getFollowCounts = async (username) => {
  const [followerRow, followingRow] = await Promise.all([
    getAsync(
      "SELECT COUNT(*) AS count FROM user_follows WHERE following_username = ? COLLATE NOCASE",
      [username]
    ),
    getAsync(
      "SELECT COUNT(*) AS count FROM user_follows WHERE follower_username = ? COLLATE NOCASE",
      [username]
    ),
  ]);

  return {
    followerCount: followerRow?.count || 0,
    followingCount: followingRow?.count || 0,
  };
};

const isOwnProfileRequest = (req) => {
  const profileUsername = getProfileUsername(req.params.username);
  const viewerUsername = getProfileUsername(req.query.viewer);

  return (
    profileUsername &&
    viewerUsername &&
    profileUsername.toLowerCase() === viewerUsername.toLowerCase()
  );
};

const requireOwnProfile = (req, res) => {
  if (isOwnProfileRequest(req)) return true;

  res.status(403).json({
    error: "This activity is private and can only be viewed on your own profile.",
  });
  return false;
};

const allowedReportReasons = [
  "spam",
  "harassment",
  "nudity",
  "hate",
  "violence",
  "other",
];
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";
const EMAIL_FROM = process.env.EMAIL_FROM || "OwlNet <no-reply@owlnet.local>";

const createEmailTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendVerificationEmail = async (email, token) => {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
  const verifyLink = `${API_BASE_URL}/api/auth/verify-email/${token}`;

  const transporter = createEmailTransporter();

  if (!transporter) {
    console.log("\nFAU EMAIL VERIFICATION LINK:");
    console.log(verifyLink);
    console.log("Add SMTP settings to .env to send this as a real email.\n");
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Verify your OwlNet account",
    text: `Welcome to OwlNet. Verify your FAU email here: ${verifyLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Verify your OwlNet account</h2>
        <p>Click the button below to verify your FAU email address.</p>
        <p>
          <a href="${verifyLink}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#2563eb;color:white;text-decoration:none;font-weight:bold;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, copy this link:</p>
        <p>${verifyLink}</p>
      </div>
    `,
  });
};
const sendPasswordResetEmail = async (email, token) => {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
  const resetLink = `${API_BASE_URL}/api/auth/reset-password/${token}`;

  const transporter = createEmailTransporter();

  if (!transporter) {
    console.log("\nOWLNET PASSWORD RESET LINK:");
    console.log(resetLink);
    console.log("Add SMTP settings to .env to send this as a real email.\n");
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your OwlNet password",
    text: `Reset your OwlNet password here: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Reset your OwlNet password</h2>
        <p>Click the button below to reset your OwlNet password.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#2563eb;color:white;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </p>
        <p>This link expires soon. If you did not request this, you can ignore this email.</p>
        <p>If the button does not work, copy this link:</p>
        <p>${resetLink}</p>
      </div>
    `,
  });
};
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

  db.run(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`, (err) => {
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
      banner_color TEXT DEFAULT '',
      banner_image TEXT DEFAULT '',
      email_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`ALTER TABLE users ADD COLUMN banner_color TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Could not add banner_color column:", err.message);
    }
  });
  db.run(`ALTER TABLE users ADD COLUMN banner_image TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Could not add banner_image column:", err.message);
    }
  });
  db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Could not add is_admin column:", err.message);
    }
  });
  db.run(`
    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run("ALTER TABLE users ADD COLUMN last_seen TEXT", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Could not add last_seen column:", err.message);
    }
  });
  db.run(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      banner_color TEXT DEFAULT '',
      banner_image TEXT DEFAULT '',
      email_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
});
const savedPostsReady = initializeSavedPostsTable();
const userFollowsReady = runAsync(USER_FOLLOWS_SCHEMA);
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
  const username = getForumUsername
    ? getForumUsername(req.query.username)
    : (req.query.username || "Anonymous").trim();

  db.all(
    `
    SELECT 
      posts.*,
      COUNT(comments.id) AS comment_count,
      COALESCE(current_vote.vote_type, 'none') AS vote_state,
      author.username AS author_username,
      author.avatar AS author_avatar,
      author.bio AS author_bio
    FROM posts
    LEFT JOIN comments
      ON comments.post_id = posts.id
    LEFT JOIN post_votes AS current_vote
      ON current_vote.post_id = posts.id
      AND LOWER(TRIM(current_vote.username)) = LOWER(TRIM(?))
    LEFT JOIN users AS author
      ON LOWER(TRIM(author.username)) = LOWER(TRIM(posts.username))
    GROUP BY posts.id
    ORDER BY posts.is_pinned DESC, posts.created_at DESC
    `,
    [username],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const posts = rows.map((row) => ({
        ...row,
        body: row.content,
        commentCount: row.comment_count || 0,
        isPinned: Boolean(row.is_pinned),
        voteState: row.vote_state || "none",
        vote_state: row.vote_state || "none",
        author_avatar: row.author_avatar || "",
        author_bio: row.author_bio || "",
        user: {
          name: row.author_username || row.username || "Anonymous",
          avatar: row.author_avatar || "",
          bio: row.author_bio || "",
        },
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
  const username = getForumUsername(req.body.username);

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
            `UPDATE post_votes
             SET vote_type = ?, created_at = CURRENT_TIMESTAMP
             WHERE post_id = ? AND username = ?`,
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
  const username = getSavedPostUsername(req.query.username);

  db.get(
    "SELECT id FROM saved_posts WHERE post_id = ? AND username = ?",
    [id, username],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ saved: Boolean(row) });
    }
  );
});
app.post("/api/posts/:id/save", (req, res) => {
  const { id } = req.params;
  const username = getSavedPostUsername(req.body?.username);

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
  const username = getSavedPostUsername(req.body?.username || req.query.username);

  db.run(
    "DELETE FROM saved_posts WHERE post_id = ? AND username = ?",
    [id, username],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Post unsaved.",
        saved: false,
        post_id: Number(id),
      });
    }
  );
});
app.get("/api/saved-posts", (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 25);
  const offset = (page - 1) * limit;
  const username = getSavedPostUsername(req.query.username);

  db.get(
    "SELECT COUNT(*) AS total FROM saved_posts WHERE username = ?",
    [username],
    (err, countRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.all(
        `
        SELECT posts.*
        FROM saved_posts
        JOIN posts ON saved_posts.post_id = posts.id
        WHERE saved_posts.username = ?
        ORDER BY saved_posts.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [username, limit, offset],
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
    }
  );
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
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password, testEmail } = req.body;

  const cleanUsername = username ? username.trim() : "";
  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const cleanTestEmail = testEmail ? testEmail.trim().toLowerCase() : "";

  console.log("Register attempt:", cleanEmail);

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@fau\.edu$/i;

  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "Email must be a valid @fau.edu address." });
  }

  if (!cleanUsername || cleanUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  db.get("SELECT * FROM users WHERE email = ?", [cleanEmail], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: "Email is already taken." });

    db.get("SELECT * FROM users WHERE username = ?", [cleanUsername], async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: "Username is already taken." });

      try {
        const passwordHash = await bcrypt.hash(password, 12);

        db.run(
          "INSERT INTO users (username, email, password, email_verified) VALUES (?, ?, ?, 0)",
          [cleanUsername, cleanEmail, passwordHash],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const userId = this.lastID;
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

            db.run(
              "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
              [userId, token, expiresAt],
              async (err) => {
                if (err) return res.status(500).json({ error: err.message });

                try {
                  await sendVerificationEmail(cleanEmail, token);
                  console.log("Verification email sent/requested for:", cleanEmail);

                  // TEMPORARY DEV-ONLY:
                  // FAU may block localhost links, so this sends a copy
                  // to a personal email for local testing. Remove before deployment.
                  if (cleanTestEmail) {
                    await sendVerificationEmail(cleanTestEmail, token);
                    console.log("Temporary test verification email sent/requested for:", cleanTestEmail);
                  }
                } catch (emailErr) {
                  console.error("Failed to send verification email:", emailErr.message);

                  return res.status(500).json({
                    error: "Account created, but the verification email could not be sent. Check the backend email settings.",
                  });
                }

                return res.status(201).json({
                  id: userId,
                  username: cleanUsername,
                  email: cleanEmail,
                  avatar: "",
                  bio: "",
                  email_verified: 0,
                  created_at: new Date().toISOString(),
                  message: "Account created. Please verify your FAU email before logging in.",
                });
              }
            );
          }
        );
      } catch (hashErr) {
        return res.status(500).json({ error: "Could not create account." });
      }
    });
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : "";

  db.get("SELECT * FROM users WHERE email = ?", [cleanEmail], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password || "", user.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: "Please verify your FAU email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      ...userWithoutPassword,
      isAdmin: user.is_admin === 1,
    });
  });
});
app.post("/api/auth/forgot-password", (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
  const testEmail = req.body.testEmail ? req.body.testEmail.trim().toLowerCase() : "";

  // Always return a generic response so people cannot check who has an account.
  const genericResponse = {
    message: "If an account exists for that FAU email, a password reset link has been sent.",
  };

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@fau\.edu$/i;

  if (!email || !emailRegex.test(email)) {
    return res.json(genericResponse);
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error("Forgot password error:", err.message);
      return res.json(genericResponse);
    }

    if (!user) {
      return res.json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

    db.run("DELETE FROM password_reset_tokens WHERE user_id = ?", [user.id], (err) => {
      if (err) {
        console.error("Reset token cleanup error:", err.message);
        return res.json(genericResponse);
      }

      db.run(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id, token, expiresAt],
        async (err) => {
          if (err) {
            console.error("Reset token insert error:", err.message);
            return res.json(genericResponse);
          }

          try {
            await sendPasswordResetEmail(email, token);
            console.log("Password reset email sent/requested for:", email);

            // TEMPORARY DEV-ONLY:
            // FAU may block localhost reset links, so this sends a copy
            // to a personal email for local testing. Remove before deployment.
            if (testEmail) {
              await sendPasswordResetEmail(testEmail, token);
              console.log("Temporary test password reset email sent/requested for:", testEmail);
            }
          } catch (emailErr) {
            console.error("Failed to send reset email:", emailErr.message);
          }

          res.json(genericResponse);
        }
      );
    });
  });
});

app.get("/api/auth/reset-password/:token", (req, res) => {
  const { token } = req.params;

  const sendResetPage = (title, message, tokenValue = "", success = true) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0; font-family: Arial, sans-serif; background:#f4f7fb; color:#102a43;">
          <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;">
            <div style="max-width:460px; width:100%; background:white; border:1px solid #d9e2ec; border-radius:22px; padding:32px; box-shadow:0 20px 50px rgba(15,23,42,0.12);">
              <div style="width:64px; height:64px; border-radius:18px; margin:0 auto 18px; display:flex; align-items:center; justify-content:center; background:${success ? '#dbeafe' : '#fee2e2'}; color:${success ? '#0057b8' : '#dc2626'}; font-size:32px;">
                ${success ? '🔒' : '!'}
              </div>

              <h1 style="margin:0 0 10px; font-size:26px; text-align:center;">${title}</h1>

              <p style="margin:0 0 22px; color:#627d98; line-height:1.5; text-align:center;">
                ${message}
              </p>

              ${
                tokenValue
                  ? `
                    <form method="POST" action="/api/auth/reset-password/${tokenValue}">
                      <label style="display:block; font-size:12px; font-weight:bold; color:#627d98; margin-bottom:6px; text-transform:uppercase;">
                        New password
                      </label>
                      <input
                        name="password"
                        type="password"
                        minlength="8"
                        required
                        placeholder="Minimum 8 characters"
                        style="width:100%; box-sizing:border-box; padding:12px 14px; border:1px solid #cbd5e1; border-radius:12px; margin-bottom:14px;"
                      />

                      <label style="display:block; font-size:12px; font-weight:bold; color:#627d98; margin-bottom:6px; text-transform:uppercase;">
                        Confirm password
                      </label>
                      <input
                        name="confirmPassword"
                        type="password"
                        minlength="8"
                        required
                        placeholder="Re-enter new password"
                        style="width:100%; box-sizing:border-box; padding:12px 14px; border:1px solid #cbd5e1; border-radius:12px; margin-bottom:18px;"
                      />

                      <button
                        type="submit"
                        style="width:100%; padding:12px 18px; border:none; border-radius:12px; background:#0057b8; color:white; font-weight:700; cursor:pointer;"
                      >
                        Reset password
                      </button>
                    </form>
                  `
                  : `
                    <div style="text-align:center;">
                      <a href="${APP_BASE_URL}" style="display:inline-block; padding:12px 18px; border-radius:12px; background:#0057b8; color:white; text-decoration:none; font-weight:700;">
                        Return to OwlNet
                      </a>
                    </div>
                  `
              }
            </div>
          </div>
        </body>
      </html>
    `);
  };

  db.get(
    "SELECT * FROM password_reset_tokens WHERE token = ?",
    [token],
    (err, tokenRow) => {
      if (err) {
        return sendResetPage("Reset error", "Something went wrong. Please try again.", "", false);
      }

      if (!tokenRow) {
        return sendResetPage("Invalid reset link", "This reset link is invalid or has already been used.", "", false);
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        db.run("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
        return sendResetPage("Reset link expired", "This password reset link has expired. Please request a new one.", "", false);
      }

      return sendResetPage("Reset password", "Enter a new password for your OwlNet account.", token, true);
    }
  );
});

app.post("/api/auth/reset-password/:token", express.urlencoded({ extended: true }), async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  const sendResultPage = (title, message, success = true) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0; font-family: Arial, sans-serif; background:#f4f7fb; color:#102a43;">
          <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;">
            <div style="max-width:460px; width:100%; background:white; border:1px solid #d9e2ec; border-radius:22px; padding:32px; text-align:center; box-shadow:0 20px 50px rgba(15,23,42,0.12);">
              <div style="width:64px; height:64px; border-radius:18px; margin:0 auto 18px; display:flex; align-items:center; justify-content:center; background:${success ? '#dcfce7' : '#fee2e2'}; color:${success ? '#16a34a' : '#dc2626'}; font-size:32px;">
                ${success ? '✓' : '!'}
              </div>

              <h1 style="margin:0 0 10px; font-size:26px;">${title}</h1>

              <p style="margin:0 0 22px; color:#627d98; line-height:1.5;">
                ${message}
              </p>

              <a href="${APP_BASE_URL}" style="display:inline-block; padding:12px 18px; border-radius:12px; background:#0057b8; color:white; text-decoration:none; font-weight:700;">
                Return to OwlNet
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  };

  if (!password || password.length < 8) {
    return sendResultPage("Password too short", "Password must be at least 8 characters.", false);
  }

  if (password !== confirmPassword) {
    return sendResultPage("Passwords do not match", "Please go back and make sure both passwords match.", false);
  }

  db.get(
    "SELECT * FROM password_reset_tokens WHERE token = ?",
    [token],
    async (err, tokenRow) => {
      if (err) {
        return sendResultPage("Reset error", "Something went wrong. Please try again.", false);
      }

      if (!tokenRow) {
        return sendResultPage("Invalid reset link", "This reset link is invalid or has already been used.", false);
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        db.run("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
        return sendResultPage("Reset link expired", "This password reset link has expired. Please request a new one.", false);
      }

      try {
        const passwordHash = await bcrypt.hash(password, 12);

        db.run(
          "UPDATE users SET password = ? WHERE id = ?",
          [passwordHash, tokenRow.user_id],
          (err) => {
            if (err) {
              return sendResultPage("Reset error", "Could not update your password. Please try again.", false);
            }

            db.run("DELETE FROM password_reset_tokens WHERE user_id = ?", [tokenRow.user_id]);

            return sendResultPage(
              "Password reset",
              "Your password has been updated. You can now log in with your new password.",
              true
            );
          }
        );
      } catch {
        return sendResultPage("Reset error", "Could not update your password. Please try again.", false);
      }
    }
  );
});
app.get("/api/auth/verify-email/:token", (req, res) => {
  const { token } = req.params;

  const sendVerifyPage = (title, message, success = true) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0; font-family: Arial, sans-serif; background:#f4f7fb; color:#102a43;">
          <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;">
            <div style="max-width:460px; width:100%; background:white; border:1px solid #d9e2ec; border-radius:22px; padding:32px; text-align:center; box-shadow:0 20px 50px rgba(15,23,42,0.12);">
              <div style="width:64px; height:64px; border-radius:18px; margin:0 auto 18px; display:flex; align-items:center; justify-content:center; background:${success ? '#dcfce7' : '#fee2e2'}; color:${success ? '#16a34a' : '#dc2626'}; font-size:32px;">
                ${success ? '✓' : '!'}
              </div>

              <h1 style="margin:0 0 10px; font-size:26px;">${title}</h1>

              <p style="margin:0 0 22px; color:#627d98; line-height:1.5;">
                ${message}
              </p>

              <a
                href="${APP_BASE_URL}"
                style="display:inline-block; padding:12px 18px; border-radius:12px; background:#0057b8; color:white; text-decoration:none; font-weight:700;"
              >
                Return to OwlNet
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  };

  db.get(
    "SELECT * FROM email_verification_tokens WHERE token = ?",
    [token],
    (err, tokenRow) => {
      if (err) {
        return sendVerifyPage(
          "Verification error",
          "Something went wrong while verifying your email. Please try again.",
          false
        );
      }

      if (!tokenRow) {
        return sendVerifyPage(
          "Invalid verification link",
          "This verification link is invalid or has already been used.",
          false
        );
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        db.run("DELETE FROM email_verification_tokens WHERE token = ?", [token]);

        return sendVerifyPage(
          "Verification link expired",
          "This verification link expired. Please create a new account or request another verification email.",
          false
        );
      }

      db.run(
        "UPDATE users SET email_verified = 1 WHERE id = ?",
        [tokenRow.user_id],
        function (err) {
          if (err) {
            return sendVerifyPage(
              "Verification error",
              "Something went wrong while verifying your email. Please try again.",
              false
            );
          }

          db.run("DELETE FROM email_verification_tokens WHERE user_id = ?", [tokenRow.user_id]);

          return sendVerifyPage(
            "Email verified",
            "Your FAU email has been verified. You can now return to OwlNet and log in.",
            true
          );
        }
      );
    }
  );
});

app.get("/api/search/posts", async (req, res) => {
  try {
    const query = getProfileUsername(req.query.q);
    const viewer = getForumUsername(req.query.viewer);

    if (!query) return res.json([]);

    const searchTerm = `%${query}%`;
    const rows = await allAsync(
      `
      SELECT
        posts.*,
        COUNT(comments.id) AS comment_count,
        COALESCE(current_vote.vote_type, 'none') AS vote_state
      FROM posts
      LEFT JOIN comments
        ON comments.post_id = posts.id
      LEFT JOIN post_votes AS current_vote
        ON current_vote.post_id = posts.id
        AND current_vote.username = ? COLLATE NOCASE
      WHERE posts.title LIKE ? COLLATE NOCASE
         OR posts.content LIKE ? COLLATE NOCASE
         OR posts.tags LIKE ? COLLATE NOCASE
         OR posts.username LIKE ? COLLATE NOCASE
      GROUP BY posts.id
      ORDER BY posts.created_at DESC
      LIMIT 100
      `,
      [viewer, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(normalizeProfilePosts(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/search/comments", async (req, res) => {
  try {
    const query = getProfileUsername(req.query.q);

    if (!query) return res.json([]);

    const searchTerm = `%${query}%`;
    const comments = await allAsync(
      `
      SELECT
        comments.id,
        comments.post_id,
        comments.username,
        comments.content,
        comments.likes,
        comments.created_at,
        posts.title AS post_title,
        posts.username AS post_username
      FROM comments
      JOIN posts
        ON posts.id = comments.post_id
      WHERE comments.content LIKE ? COLLATE NOCASE
         OR comments.username LIKE ? COLLATE NOCASE
         OR posts.title LIKE ? COLLATE NOCASE
      ORDER BY comments.created_at DESC
      LIMIT 100
      `,
      [searchTerm, searchTerm, searchTerm]
    );

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/search/users", async (req, res) => {
  try {
    const query = getProfileUsername(req.query.q);

    if (!query) return res.json([]);

    const searchTerm = `%${query}%`;
    const users = await allAsync(
      `
      SELECT
        users.id,
        users.username,
        users.avatar,
        users.bio,
        users.created_at,
        COUNT(DISTINCT followers.id) AS follower_count,
        COUNT(DISTINCT following.id) AS following_count,
        COUNT(DISTINCT posts.id) AS post_count
      FROM users
      LEFT JOIN user_follows AS followers
        ON followers.following_username = users.username COLLATE NOCASE
      LEFT JOIN user_follows AS following
        ON following.follower_username = users.username COLLATE NOCASE
      LEFT JOIN posts
        ON posts.username = users.username COLLATE NOCASE
      WHERE users.username LIKE ? COLLATE NOCASE
         OR users.bio LIKE ? COLLATE NOCASE
      GROUP BY users.id
      ORDER BY users.username COLLATE NOCASE
      LIMIT 50
      `,
      [searchTerm, searchTerm]
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users/:username/follow", async (req, res) => {
  try {
    const targetUser = await getUserByUsername(req.params.username);
    const followerUsername = getProfileUsername(
      req.body?.followerUsername || req.body?.follower_username
    );

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!followerUsername) {
      return res.status(400).json({ error: "Follower username is required." });
    }

    const followerUser = await getUserByUsername(followerUsername);

    if (!followerUser) {
      return res.status(404).json({ error: "Follower account not found." });
    }

    if (followerUser.username.toLowerCase() === targetUser.username.toLowerCase()) {
      return res.status(400).json({ error: "You cannot follow your own account." });
    }

    await runAsync(
      `INSERT OR IGNORE INTO user_follows (follower_username, following_username)
       VALUES (?, ?)`,
      [followerUser.username, targetUser.username]
    );

    const counts = await getFollowCounts(targetUser.username);
    res.json({ following: true, ...counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:username/follow", async (req, res) => {
  try {
    const targetUser = await getUserByUsername(req.params.username);
    const followerUsername = getProfileUsername(
      req.body?.followerUsername ||
        req.body?.follower_username ||
        req.query.followerUsername
    );

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!followerUsername) {
      return res.status(400).json({ error: "Follower username is required." });
    }

    const followerUser = await getUserByUsername(followerUsername);

    if (!followerUser) {
      return res.status(404).json({ error: "Follower account not found." });
    }

    await runAsync(
      `DELETE FROM user_follows
       WHERE follower_username = ? COLLATE NOCASE
         AND following_username = ? COLLATE NOCASE`,
      [followerUser.username, targetUser.username]
    );

    const counts = await getFollowCounts(targetUser.username);
    res.json({ following: false, ...counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/follow-status", async (req, res) => {
  try {
    const targetUsername = getProfileUsername(req.params.username);
    const viewerUsername = getProfileUsername(req.query.viewer);
    const targetUser = await getUserByUsername(targetUsername);

    if (!targetUser) {
      return res.json({
        userExists: false,
        following: false,
        followerCount: 0,
        followingCount: 0,
      });
    }

    const counts = await getFollowCounts(targetUser.username);
    let following = false;

    if (
      viewerUsername &&
      viewerUsername.toLowerCase() !== targetUser.username.toLowerCase()
    ) {
      const follow = await getAsync(
        `SELECT id
         FROM user_follows
         WHERE follower_username = ? COLLATE NOCASE
           AND following_username = ? COLLATE NOCASE`,
        [viewerUsername, targetUser.username]
      );
      following = Boolean(follow);
    }

    res.json({
      userExists: true,
      username: targetUser.username,
      profile: targetUser,
      following,
      ...counts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/followers", async (req, res) => {
  try {
    const username = getProfileUsername(req.params.username);
    const followers = await allAsync(
      `
      SELECT
        users.id,
        users.username,
        users.avatar,
        users.bio,
        users.created_at,
        user_follows.created_at AS followed_at,
        COUNT(posts.id) AS post_count
      FROM user_follows
      JOIN users
        ON users.username = user_follows.follower_username COLLATE NOCASE
      LEFT JOIN posts
        ON posts.username = users.username COLLATE NOCASE
      WHERE user_follows.following_username = ? COLLATE NOCASE
      GROUP BY user_follows.id, users.id
      ORDER BY user_follows.created_at DESC
      `,
      [username]
    );

    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/following", async (req, res) => {
  try {
    const username = getProfileUsername(req.params.username);
    const following = await allAsync(
      `
      SELECT
        users.id,
        users.username,
        users.avatar,
        users.bio,
        users.created_at,
        user_follows.created_at AS followed_at,
        COUNT(posts.id) AS post_count
      FROM user_follows
      JOIN users
        ON users.username = user_follows.following_username COLLATE NOCASE
      LEFT JOIN posts
        ON posts.username = users.username COLLATE NOCASE
      WHERE user_follows.follower_username = ? COLLATE NOCASE
      GROUP BY user_follows.id, users.id
      ORDER BY user_follows.created_at DESC
      `,
      [username]
    );

    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/posts", async (req, res) => {
  try {
    const username = getProfileUsername(req.params.username);
    const viewer = getForumUsername(req.query.viewer);
    const rows = await allAsync(
      `
      SELECT
        posts.*,
        COUNT(comments.id) AS comment_count,
        COALESCE(current_vote.vote_type, 'none') AS vote_state
      FROM posts
      LEFT JOIN comments
        ON comments.post_id = posts.id
      LEFT JOIN post_votes AS current_vote
        ON current_vote.post_id = posts.id
        AND current_vote.username = ? COLLATE NOCASE
      WHERE posts.username = ? COLLATE NOCASE
      GROUP BY posts.id
      ORDER BY posts.created_at DESC
      `,
      [viewer, username]
    );

    res.json(normalizeProfilePosts(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/comments", async (req, res) => {
  try {
    const username = getProfileUsername(req.params.username);
    const comments = await allAsync(
      `
      SELECT
        comments.id,
        comments.post_id,
        comments.username,
        comments.content,
        comments.likes,
        comments.created_at,
        posts.title AS post_title,
        posts.username AS post_username
      FROM comments
      JOIN posts
        ON posts.id = comments.post_id
      WHERE comments.username = ? COLLATE NOCASE
      ORDER BY comments.created_at DESC
      `,
      [username]
    );

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/saved", async (req, res) => {
  if (!requireOwnProfile(req, res)) return;

  try {
    const username = getProfileUsername(req.params.username);
    const rows = await allAsync(
      `
      SELECT
        posts.*,
        saved_posts.created_at AS activity_created_at,
        COUNT(comments.id) AS comment_count,
        COALESCE(current_vote.vote_type, 'none') AS vote_state
      FROM saved_posts
      JOIN posts
        ON posts.id = saved_posts.post_id
      LEFT JOIN comments
        ON comments.post_id = posts.id
      LEFT JOIN post_votes AS current_vote
        ON current_vote.post_id = posts.id
        AND current_vote.username = ? COLLATE NOCASE
      WHERE saved_posts.username = ? COLLATE NOCASE
      GROUP BY posts.id
      ORDER BY saved_posts.created_at DESC
      `,
      [username, username]
    );

    res.json(normalizeProfilePosts(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/upvoted", async (req, res) => {
  if (!requireOwnProfile(req, res)) return;

  try {
    const username = getProfileUsername(req.params.username);
    const rows = await allAsync(
      `
      SELECT
        posts.*,
        profile_vote.created_at AS activity_created_at,
        COUNT(comments.id) AS comment_count,
        profile_vote.vote_type AS vote_state
      FROM post_votes AS profile_vote
      JOIN posts
        ON posts.id = profile_vote.post_id
      LEFT JOIN comments
        ON comments.post_id = posts.id
      WHERE profile_vote.username = ? COLLATE NOCASE
        AND profile_vote.vote_type = 'up'
      GROUP BY posts.id
      ORDER BY profile_vote.created_at DESC
      `,
      [username]
    );

    res.json(normalizeProfilePosts(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/downvoted", async (req, res) => {
  if (!requireOwnProfile(req, res)) return;

  try {
    const username = getProfileUsername(req.params.username);
    const rows = await allAsync(
      `
      SELECT
        posts.*,
        profile_vote.created_at AS activity_created_at,
        COUNT(comments.id) AS comment_count,
        profile_vote.vote_type AS vote_state
      FROM post_votes AS profile_vote
      JOIN posts
        ON posts.id = profile_vote.post_id
      LEFT JOIN comments
        ON comments.post_id = posts.id
      WHERE profile_vote.username = ? COLLATE NOCASE
        AND profile_vote.vote_type = 'down'
      GROUP BY posts.id
      ORDER BY profile_vote.created_at DESC
      `,
      [username]
    );

    res.json(normalizeProfilePosts(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:username/history", async (req, res) => {
  if (!requireOwnProfile(req, res)) return;

  try {
    const username = getProfileUsername(req.params.username);
    const activity = await allAsync(
      `
      SELECT
        'post' AS activity_type,
        posts.id AS activity_id,
        posts.id AS post_id,
        posts.title AS post_title,
        posts.content AS content,
        posts.created_at AS created_at
      FROM posts
      WHERE posts.username = ? COLLATE NOCASE

      UNION ALL

      SELECT
        'comment' AS activity_type,
        comments.id AS activity_id,
        comments.post_id AS post_id,
        posts.title AS post_title,
        comments.content AS content,
        comments.created_at AS created_at
      FROM comments
      JOIN posts
        ON posts.id = comments.post_id
      WHERE comments.username = ? COLLATE NOCASE

      UNION ALL

      SELECT
        'save' AS activity_type,
        saved_posts.id AS activity_id,
        saved_posts.post_id AS post_id,
        posts.title AS post_title,
        '' AS content,
        saved_posts.created_at AS created_at
      FROM saved_posts
      JOIN posts
        ON posts.id = saved_posts.post_id
      WHERE saved_posts.username = ? COLLATE NOCASE

      UNION ALL

      SELECT
        CASE post_votes.vote_type
          WHEN 'up' THEN 'upvote'
          ELSE 'downvote'
        END AS activity_type,
        post_votes.id AS activity_id,
        post_votes.post_id AS post_id,
        posts.title AS post_title,
        '' AS content,
        post_votes.created_at AS created_at
      FROM post_votes
      JOIN posts
        ON posts.id = post_votes.post_id
      WHERE post_votes.username = ? COLLATE NOCASE

      ORDER BY created_at DESC
      LIMIT 100
      `,
      [username, username, username, username]
    );

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
  const { username, bio, avatar, banner_color, banner_image } = req.body;

  if (
    banner_color !== undefined &&
    banner_color !== "" &&
    !/^#[0-9a-f]{6}$/i.test(banner_color)
  ) {
    return res.status(400).json({ error: "Banner color must be a valid hex color." });
  }

  if (
    banner_image !== undefined &&
    banner_image !== "" &&
    !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(banner_image) &&
    !/^https:\/\//i.test(banner_image)
  ) {
    return res.status(400).json({ error: "Banner image must be a valid image." });
  }

  if (typeof banner_image === "string" && banner_image.length > 1600000) {
    return res.status(413).json({ error: "Banner image is too large." });
  }

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

    async function updateUser() {
      const newUsername = username !== undefined ? username : user.username;
      const newBio = bio !== undefined ? bio : user.bio;
      const newAvatar = avatar !== undefined ? avatar : user.avatar;
      const newBannerColor =
        banner_color !== undefined ? banner_color : user.banner_color || "";
      const newBannerImage =
        banner_image !== undefined ? banner_image : user.banner_image || "";
      const usernameChanged = newUsername !== user.username;

      try {
        await runAsync("BEGIN IMMEDIATE TRANSACTION");
        await runAsync(
          `UPDATE users
           SET username = ?, bio = ?, avatar = ?, banner_color = ?, banner_image = ?
           WHERE id = ?`,
          [
            newUsername,
            newBio,
            newAvatar,
            newBannerColor,
            newBannerImage,
            id,
          ]
        );

        if (usernameChanged) {
          await runAsync("UPDATE posts SET username = ? WHERE username = ?", [
            newUsername,
            user.username,
          ]);
          await runAsync("UPDATE comments SET username = ? WHERE username = ?", [
            newUsername,
            user.username,
          ]);
          await runAsync("UPDATE saved_posts SET username = ? WHERE username = ?", [
            newUsername,
            user.username,
          ]);
          await runAsync("UPDATE post_votes SET username = ? WHERE username = ?", [
            newUsername,
            user.username,
          ]);
          await runAsync("UPDATE comment_votes SET username = ? WHERE username = ?", [
            newUsername,
            user.username,
          ]);
          await runAsync(
            "UPDATE user_follows SET follower_username = ? WHERE follower_username = ?",
            [newUsername, user.username]
          );
          await runAsync(
            "UPDATE user_follows SET following_username = ? WHERE following_username = ?",
            [newUsername, user.username]
          );
        }

        await runAsync("COMMIT");
        const updatedUser = await getAsync("SELECT * FROM users WHERE id = ?", [id]);
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        try {
          await runAsync("ROLLBACK");
        } catch (rollbackError) {
          console.error("Could not roll back profile update:", rollbackError.message);
        }

        res.status(500).json({ error: error.message });
      }
    }
  });
});
// Delete a user account
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    db.serialize(() => {
      // Keep old posts/comments but mark them as deleted user
      db.run("UPDATE posts SET username = ? WHERE username = ?", ["Deleted User", user.username]);
      db.run("UPDATE comments SET username = ? WHERE username = ?", ["Deleted User", user.username]);
      db.run(
        `DELETE FROM user_follows
         WHERE follower_username = ? COLLATE NOCASE
            OR following_username = ? COLLATE NOCASE`,
        [user.username, user.username]
      );

      db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ success: true });
      });
    });
  });
});
const getCommunityStats = async () => {
  const memberRow = await getAsync(
    "SELECT COUNT(*) AS count FROM users WHERE email_verified = 1"
  );

  const onlineRow = await getAsync(
    "SELECT COUNT(*) AS count FROM users WHERE last_seen IS NOT NULL AND last_seen >= datetime('now', '-5 minutes')"
  );

  const postsTodayRow = await getAsync(
    "SELECT COUNT(*) AS count FROM posts WHERE date(created_at) = date('now')"
  );

  return {
    memberCount: memberRow?.count || 0,
    onlineCount: onlineRow?.count || 0,
    postsToday: postsTodayRow?.count || 0,
  };
};

app.get("/api/community/stats", async (req, res) => {
  try {
    const stats = await getCommunityStats(req.query.email || "");
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load community stats." });
  }
});

app.post("/api/community/join", async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
    const username = req.body.username ? req.body.username.trim() : "";

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    await runAsync(
      "INSERT OR IGNORE INTO community_members (email, username) VALUES (?, ?)",
      [email, username || email.split("@")[0]]
    );

    await runAsync(
      "UPDATE users SET last_seen = datetime('now') WHERE email = ?",
      [email]
    );

    const stats = await getCommunityStats(email);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not join community." });
  }
});

app.delete("/api/community/join", async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    await runAsync(
      "DELETE FROM community_members WHERE email = ?",
      [email]
    );

    const stats = await getCommunityStats(email);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not leave community." });
  }
});

app.post("/api/users/heartbeat", async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    await runAsync(
      "UPDATE users SET last_seen = datetime('now') WHERE email = ?",
      [email]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update online status." });
  }
});

app.get("/api/community/active-users", async (req, res) => {
  try {
    const rows = await allAsync(`
      SELECT username, email, last_seen
      FROM users
      WHERE last_seen IS NOT NULL
        AND last_seen >= datetime('now', '-5 minutes')
      ORDER BY last_seen DESC
      LIMIT 4
    `);

    const users = rows.map((row) => {
      const name = row.username || row.email.split("@")[0];
      const handle = `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

      return {
        id: row.email,
        name,
        handle,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      };
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load active users." });
  }
});
Promise.all([savedPostsReady, userFollowsReady])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize saved posts:", error.message);
    db.close();
    process.exitCode = 1;
  });
