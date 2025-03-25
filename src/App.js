import React, { useState } from "react";
import OpenAI from "openai";
import "./App.css";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse("Thinking...");
    try {
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: question }],
      });
      setResponse(result.choices[0].message.content);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setResponse("Sorry, something went wrong. Try again later.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Nike Customer Service AI</h1>
      <textarea
        className="w-full max-w-lg p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Ask me about Nike products, orders, refunds..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      ></textarea>
      <button
        onClick={handleAskAI}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Processing..." : "Ask AI"}
      </button>
      {response && (
        <div className="mt-4 p-4 w-full max-w-lg bg-white border border-gray-200 rounded-md shadow-md">
          <p className="text-gray-700">{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;
