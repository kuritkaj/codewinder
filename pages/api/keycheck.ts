export default async function handler(req, res) {
    const hasOpenAIApiKey = Boolean(process.env.OPENAI_API_KEY);
    res.status(200).json({ hasOpenAIApiKey });
}