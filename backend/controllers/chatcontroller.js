const {
  generateChatResponse,
} = require("../services/chatservice");

async function chatcontroller(req, res) {

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const response = await generateChatResponse(message);

    res.json({
      response,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

module.exports = {
  chatcontroller,
};