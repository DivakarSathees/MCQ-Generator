require('dotenv').config();
const encoder = require('gpt-3-encoder');

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

exports.aiMcqGenerator = async (req) => {
    try {
        // const prompt = `Generate 5 multiple choice questions with 4 options each and the correct answer for the following text: "The quick brown fox jumps over the lazy dog."`;
        
        console.log(req);
        let { question_count, options_count, difficulty_level, topic, prompt } = req;

        // Validate the input
        // if (!question_count || !options_count || !difficulty_level || !topic) {
        //     throw new Error("Missing required parameters.");
        // }

        if(!prompt) {
            prompt = `Your task is to create ${question_count} ${difficulty_level}-level scenario-based MCQs on the topic - ${topic} with ${options_count} options for each question & a single correct answer.`;
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
    "manual_difficulty": ${difficulty_level}
  }
]

Do not include any explanations, extra text, or markdown formatting — return only valid JSON.
`;




        
        const tokenCount = getTokenCount(prompt);
        
        if (tokenCount > 4096) {
            throw new Error("Input prompt exceeds maximum token limit.");
        }

        const response = await grop.chat.completions.create({
            model: 'llama3-8b-8192', 
            // model: 'llama-3.3-70b-versatile', 
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

        try {
            const parsedJson = JSON.parse(resultText);
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