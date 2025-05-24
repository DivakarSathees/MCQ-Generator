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

exports.aiVerifyMcq = async (req) => {
    // verift the mcq is correct or not
    try {
        console.log(req);
        let { question, options, answer, questionText, code_snippet } = req;

        // Validate the input
        if (!question || !options || !answer || !questionText ) {
            throw new Error("Missing required parameters.");
        }

        // const prompt = `Your task is to verify the following MCQ question and its options and answer. If the answer is correct, return "Correct". If the answer is incorrect, return "Incorrect". The question should be in the following format:
        
        // Question: ${question}
        // Options: ${options}
        // Answer: ${answer}

        // Please respond with either "Correct" or "Incorrect" only.`;
        const prompt = `
You are an MCQ evaluator. Verify whether the given multiple-choice question is correct. The question has 4 options, but only one of them must be the correct answer.

Here is the MCQ:

Question: ${questionText}
${code_snippet ? 'Code Snippet: '+code_snippet : ""}
Options:
${options.map((opt, i) => String.fromCharCode(65 + i) + ". " + opt).join("\n")}
Given Answer: ${answer}
Your task is to:
1. Analyze the question and all options.
2. Determine whether the provided answer is factually the only correct one.
3. Check whether the Question is clear and unambiguous, otherwise return "Incorrect".
4. Check whether there is all required informations in the question, otherwise return "Incorrect".
${code_snippet ? `5. If the question is related to code, check if the code snippet is relevant to the question.` : ""}
${code_snippet ? `6. If it is code related, run the code and check if the answer is correct, otherwise return "Incorrect".` : ""}
${code_snippet ? `7. check whether the code snippet is correct or not (check for syntax error), otherwise return "Incorrect"` : ""}  

Return ONLY one word: "Correct" if all the above mentioned conditions are met, otherwise return "Incorrect".

Respond with only "Correct" or "Incorrect" — no explanations.
`;

        console.log(prompt);

        const response = await grop.chat.completions.create({
            // model: 'llama3-8b-8192', 
            model: 'llama-3.3-70b-versatile', 
            // model: 'gemma2-9b-it',  // or 'gpt-4' if using GPT-4
            // prompt: prompt,
            messages: [
                        { role: "system", content: "You are MCQ Verifier." },
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
        console.log(response.choices[0].message.content);

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error in aiVerifyMcq:", error);
        throw error;
    }

}