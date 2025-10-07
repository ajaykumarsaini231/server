const { createMessage, getMessages } = require("../controllers/message.js");
const Messagevalidate = require("../middleware/messageValidator.js");
const { messageSchema } = require("../middleware/validator.js");

const express = require("express");
const router = express.Router();

router.post("/message", Messagevalidate(messageSchema), createMessage);
router.get("/messages", getMessages);

module.exports = router;
