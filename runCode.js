require('dotenv').config();
const axios = require('axios');
const encoder = require('gpt-3-encoder');
const { jsonrepair } = require("jsonrepair");


// Check number of tokens in the input prompt
function getTokenCount(input) {
    const encoded = encoder.encode(input); // Encode the text into tokens
    console.log(encoded.length);
    
    return encoded.length; // Return the token count
}

const Groq = require("groq-sdk");

const grop = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

function extractJSONArray(text) {
    const startIndex = text.indexOf('[');
    if (startIndex === -1) {
        throw new Error("No array found in text");
    }

    let bracketCount = 0;
    let endIndex = -1;

    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === '[') bracketCount++;
        else if (text[i] === ']') bracketCount--;

        if (bracketCount === 0) {
            endIndex = i;
            break;
        }
    }

    if (endIndex === -1) {
        throw new Error("JSON array is not closed properly.");
    }

    const jsonArrayText = text.slice(startIndex, endIndex + 1);
    return jsonArrayText;
}

const JUDGE0_API = "https://judge0-ce.p.rapidapi.com"
const RAPIDAPI_KEY = "87e83c0011msh8f156c4948b14a9p141b80jsn54f2ecf4cedb";


async function executeCSharpCode(code) {
    try {
        console.log("Executing C# code...");
        console.log(code);
        
        const submission = await axios.post(`${JUDGE0_API}/submissions`, {
          language_id: 51, // C# language id in Judge0
          source_code: code,
          stdin: '',
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        });
    
        const token = submission.data.token;
    
        // Polling result
        let result;
        do {
          await new Promise(res => setTimeout(res, 2000));
          result = await axios.get(`${JUDGE0_API}/submissions/${token}`, {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
          });
        } while (result.data.status.id <= 2); // 1 or 2 = queued or processing
    
          const { stdout, stderr, compile_output, status } = result.data;

        if (compile_output) {
            return `🔧 Compilation Error:\n${compile_output}`;
        }

        if (stderr) {
            return `🚨 Runtime Error:\n${stderr}`;
        }

        return stdout?.trim() || `❓ Unknown status: ${status.description}`;
    
      } catch (err) {
        console.error('Error running C# code:', err.message);
        return `❌ Request Error: ${err.message}`;
      }
}

exports.runCode = async (req) => {
    try {
        let { code_snippet } = req;
        // console.log(code_snippet);

        const response = await grop.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [
                {
                    role: "user",
                    content: `You are a helpful code assistant. Complete the following code snippet:\n\n${code_snippet}\n\nReturn only the complete executable code in the following format:\n\n
                    
                    if there is any error in code snippet, give the error message.
                    Please respond with the following strict JSON format as an array:
                    [
                      {
                        "text": "Sample question here",
                        "code_snippet": "Complete code snippet here,
                        "error": "Yes or No",
                        "error_message": "Error message here if any"
                      }                          
                    ]`
                    
                },
            ]
        });
        console.log(response.choices[0].message.content);
        let code
        code = response.choices[0].message.content;
        // console.log(code);

        // try {
            const jsonArrayText = extractJSONArray(code);
            console.log("Extracted JSON Array:", jsonArrayText);
            let parsedJson;

            try {
                parsedJson = JSON.parse(jsonArrayText);
            } catch (parseError) {
        //         console.warn("Initial JSON parse failed, trying to repair...");

        //         // Repair the JSON if it is malformed
                const repairedJson = jsonrepair(jsonArrayText);
                parsedJson = JSON.parse(repairedJson);
            }

        //     // parsedJson.forEach(q => {
        //     //     if (q.code_snippet) {
        //     //         q.question_data = `${q.question_data}$$$examly${q.code_snippet}`;
        //     //         delete q.code_snippet; // Optional: remove original field
        //     //     }
        //     // });

        //     return parsedJson;
        // } catch (e) {
        //     console.error("Failed to parse JSON:", e);
        //     throw new Error("The AI response is not valid JSON.");
        // }
        console.log("Parsed JSON:", parsedJson[0]['code_snippet']);
        if (parsedJson[0]['error'] === "Yes") {
            return parsedJson[0]['error_message'];
        }
        
        const result = await executeCSharpCode(parsedJson[0]['code_snippet']);
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error in runCode:", error);
        throw error;
    }
}