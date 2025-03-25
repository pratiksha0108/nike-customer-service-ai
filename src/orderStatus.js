import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export async function checkOrderStatus(imageFile) {
    const imageBase64 = await toBase64(imageFile);
    const response = await openai.images.create({
        model: "gpt-4o-mini",
        images: [imageBase64],
        task: "analyze order details"
    });

    return response.data;
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = (error) => reject(error);
    });
}
