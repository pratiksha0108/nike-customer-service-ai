import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export async function detectDamage(imageFile) {
    const imageBase64 = await toBase64(imageFile);
    const response = await openai.images.create({
        model: "gpt-4o-mini",
        images: [imageBase64],
        task: "detect defects or damages"
    });

    return response.data;
}
