import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { geminiAi } from "./gemini-ai.js";
dotenv.config();
const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Invalid message format" });
    }
    try {
        let result = await geminiAi(message);
        return res.status(200).json({
            status: "success",
            data: {
                result,
            },
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
