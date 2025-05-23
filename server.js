// get endpoint
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');
const { aiMcqGenerator } = require('./aiMcqGenerator');
const { aiVerifyMcq } = require('./aiVerifyMcq');
const { uploadToPlatform } = require('./uploadToPlatform');
const { runCode } = require('./runCode');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/generate-mcq", async (req, res) => {
    try {
        // Your task is to create 10 easy-level scenario-based MCQs on the topic - dotnet webapi with 4 options for each question & a single correct answer & the question should not be basic level
        await aiMcqGenerator(req.body)
            .then((response) => {
                console.log(response[0]);
                res.status(200).send({ response });
            })
            .catch((error) => {
                console.error("Error in /generate-mcq:", error);
                res.status(500).send({ error: "Internal server error." });
            });
        
    } catch (error) {
        console.error("Error in /get-analysis:", error);
        return res.status(500).send({ error: "Internal server error." });
    }
});

app.post("/verify-mcq", async (req, res) => {
    await aiVerifyMcq(req.body)
        .then((response) => {
            console.log(response);
            res.status(200).send({ response });
        })
        .catch((error) => {
            console.error("Error in /verify-mcq:", error);
            res.status(500).send({ error: "Internal server error." });
        });
});

app.post("/upload-to-platform", async (req, res) => {
    
    await uploadToPlatform(req.body)
        .then((response) => {
            // console.log(response);
            res.status(200).send({ response });
        })
        .catch((error) => {
            console.error("Error in /upload-to-platform:", error);
            res.status(500).send({ error: "Internal server error." });
        });
});

app.post("/run-code",async (req, res) => {
    await runCode(req.body)
        .then((response) => {
            console.log(response);
            res.status(200).send({ response });
        })
        .catch((error) => {
            console.error("Error in /run-code:", error);
            res.status(500).send({ error: "Internal server error." });
        });
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});




    