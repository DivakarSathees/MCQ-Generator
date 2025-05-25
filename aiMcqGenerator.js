require('dotenv').config();
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


exports.aiMcqGenerator = async (req) => {
    try {
        // const prompt = `Generate 5 multiple choice questions with 4 options each and the correct answer for the following text: "The quick brown fox jumps over the lazy dog."`;
        
        console.log(req);
        let { question_count, options_count, difficulty_level, topic, code_snippet, prompt } = req;
console.log(code_snippet);

        if(!prompt) {
            if(code_snippet == 0 ) {
                prompt = `Your task is to create ${question_count} ${difficulty_level}-level scenario-based MCQs on the topic - ${topic} with ${options_count} options for each question & a single correct answer.`;
            }
            else {
                prompt = `Your task is to create ${question_count} ${difficulty_level}-level code snippet based MCQs on the topic - ${topic} with ${options_count} options for each question & a single correct answer.`;
            }
        }

        // check diifficulty level by converting it to lower case == easy then add "the question should not be basic level" in prompt
        if(difficulty_level?.toLowerCase() != "easy") {
            prompt += " The question should not be basic level.";
        }
        console.log(prompt);

        prompt += ` Please respond with the MCQs in the following strict JSON format as an array:
[
  {
    "question_data": "Sample question here",
    ${
            code_snippet == 0 ? "" : `"code_snippet": "Sample code snippet here with '/n' wherever reqired",`
        }
    "options": [
      { "text": "Option 1", "media": "" },
      { "text": "Option 2", "media": "" },
      { "text": "Option 3", "media": "" },
      { "text": "Option 4", "media": "" }
    ],
    "answer": {
      "args": ["Correct answer text"],
      "partial": []
    },
    "manual_difficulty": ${difficulty_level ? `"${difficulty_level}"` : "level of difficulty"},
  }
]

Do not include any explanations, extra text, or markdown formatting — return only valid JSON.
`;


        console.log(prompt);
        
        const tokenCount = getTokenCount(prompt);
        
        if (tokenCount > 4096) {
            throw new Error("Input prompt exceeds maximum token limit.");
        }

        const response = await grop.chat.completions.create({
            // model: 'llama3-8b-8192', 
            model: 'llama-3.3-70b-versatile', 
            // model: 'gemma2-9b-it',  // or 'gpt-4' if using GPT-4
            // prompt: prompt,
            messages: [
                        { role: "system", content: "You are MCQ generator"},
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                // "model": "gemma2-9b-it",
                // "temperature": 1,
                // "max_completion_tokens": 8192,
                // "top_p": 1,
                // "stream": true,
                // "stop": null
        });

        // for await (const chunk of response) {
        //     process.stdout.write(chunk.choices[0]?.delta?.content || '');
        //   }
        // console.log(response.choices[0].message);
        const resultText = response.choices[0].message.content;
        console.log(resultText);
        

        try {
            const jsonArrayText = extractJSONArray(resultText);
            let parsedJson;

            try {
                parsedJson = JSON.parse(jsonArrayText);
            } catch (parseError) {
                console.warn("Initial JSON parse failed, trying to repair...");

                // Repair the JSON if it is malformed
                const repairedJson = jsonrepair(jsonArrayText);
                parsedJson = JSON.parse(repairedJson);
            }

            parsedJson.forEach(q => {
                if (q.code_snippet) {
                    q.question_data = `${q.question_data}$$$examly${q.code_snippet}`;
                    delete q.code_snippet; // Optional: remove original field
                }
            });

            return parsedJson;
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            throw new Error("The AI response is not valid JSON.");
        }
        
        return response.choices[0].message;
    } catch (error) {
        console.error("Error in aiMcqGenerator:", error);
    }
}