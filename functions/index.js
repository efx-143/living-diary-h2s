const functions = require("firebase-functions");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// Load Gemini with API key from Firebase config
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

exports.ask = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send(""); // Preflight request
  }

  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({error: "Prompt not provided"});
    }

    // Use Gemini API
    const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});
    const result = await model.generateContent(prompt);

    res.json({response: result.response.text()});
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({error: err.message});
  }
});
