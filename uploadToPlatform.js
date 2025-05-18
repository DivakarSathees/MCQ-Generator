const axios = require("axios");

exports.uploadToPlatform = async (req) => {
  const authToken = req.token;

  const questions = req.response; // Array of MCQs

  const baseData = {
    question_type: "mcq_single_correct",
    subject_id: "60015d86-16a3-45e3-8f64-13f85dea35d8",
    topic_id: "0f0397fb-bf83-4344-ab8f-dbb191ffcf61",
    sub_topic_id: "c09f59e9-5855-4519-b9c6-5f65cdee24c0",
    blooms_taxonomy: null,
    course_outcome: null,
    program_outcome: null,
    hint: [],
    answer_explanation: {
      args: []
    },
    question_editor_type: 1,
    linked_concepts: "",
    tags: ["WebApi", "Authentication"],
    question_media: [],
    qb_id: "981fe2aa-f48a-43f3-9a06-e9c7c2a3cf30",
    createdBy: "bd3c2f4d-b53d-4de6-82c9-00413b70756c"
  };

  const results = [];

  for (const q of questions) {
    const requestBody = {
      ...baseData,
      question_data: q.question_data,
      options: q.options.map(opt => ({ text: opt.text, media: "" })), // Add media key if missing
      answer: q.answer,
      manual_difficulty: q.manual_difficulty,
    };

    try {
      const response = await axios.post(
        "https://api.examly.io/api/mcq_question/create",
        requestBody,
        {
          headers: {
           "Cache-Control": "no-cache",
          "Postman-Token": "<calculated when request is sent>",
          "Content-Type": "application/json",
          // "Content-Length": "<calculated when request is sent>",
          "User-Agent": "PostmanRuntime/7.42.0",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Accept": "application/json, text/plain, */*",
          Authorization: authToken,
          }
        }
      );

      console.log(`Uploaded: ${q.question_data}`);
      results.push({ question: q.question_data, status: "Uploaded" });

    } catch (error) {
      console.error(`Failed to upload: ${q.question_data}`, error.response?.data || error.message);
      results.push({ question: q.question_data, status: "Failed", error: error.message });
    }
  }
  console.log(results);
  

  return results;
};
