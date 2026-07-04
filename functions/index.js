const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.statusUpdate = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }

  try {
    await fetch("https://join-n8n.app.n8n.cloud/webhook/task-status-changed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Proxy failed" });
  }
});
