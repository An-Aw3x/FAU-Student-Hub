const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const email = process.argv[2];
const valueArg = process.argv[3] || "1";
const isAdmin = valueArg === "1" || valueArg.toLowerCase() === "true";

if (!email) {
  console.error("Usage: node setAdmin.js yourfauemail@fau.edu 1");
  process.exit(1);
}

const dbPath = path.join(__dirname, "fau_forum.db");
const db = new sqlite3.Database(dbPath);

db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0", (alterErr) => {
  if (alterErr && !alterErr.message.includes("duplicate column name")) {
    console.error("Failed to add is_admin column:", alterErr.message);
    db.close();
    process.exit(1);
  }

  db.run(
    "UPDATE users SET is_admin = ? WHERE LOWER(email) = LOWER(?)",
    [isAdmin ? 1 : 0, email],
    function (updateErr) {
      if (updateErr) {
        console.error("Failed to update user:", updateErr.message);
        db.close();
        process.exit(1);
      }

      if (this.changes === 0) {
        console.log("No user found with that email.");
      } else {
        console.log(`${email} admin status set to ${isAdmin ? "ADMIN" : "NOT ADMIN"}.`);
      }

      db.close();
    }
  );
});