import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export async function getProductRecommendations(userInput, productCatalog) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userInput,
    });

    const userEmbedding = response.data[0].embedding;
    // Compare embedding with product catalog (You need to implement cosine similarity)

    return bestMatchedProducts; // Replace this with actual logic
}
