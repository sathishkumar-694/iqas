import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Mock/Fallback logic for bug analysis if Gemini API is not available
 */
const analyzeBugLocally = (title, description) => {
    const text = (title + " " + description).toLowerCase();
    let complexity = 1;
    let tags = [];

    // Keyword based complexity estimation
    if (text.includes("crash") || text.includes("data loss") || text.includes("security")) {
        complexity = 5;
    } else if (text.includes("performance") || text.includes("leak") || text.includes("race condition")) {
        complexity = 4;
    } else if (text.includes("ui") || text.includes("css") || text.includes("typo")) {
        complexity = 1;
    } else if (text.includes("api") || text.includes("integration") || text.includes("database")) {
        complexity = 3;
    } else {
        complexity = 2;
    }

    // Tagging
    if (text.includes("frontend") || text.includes("ui")) tags.push("Frontend");
    if (text.includes("backend") || text.includes("api")) tags.push("Backend");
    if (text.includes("db") || text.includes("mongo")) tags.push("Database");

    return { complexity, tags, priority: complexity >= 4 ? "High" : "Medium" };
};

export const analyzeBug = async (title, description) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.log("GEMINI_API_KEY not found, using local analysis fallback.");
        return analyzeBugLocally(title, description);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this software bug report:
        Title: ${title}
        Description: ${description}
        
        Provide a JSON response with:
        1. complexity (1-5, where 5 is extremely complex/critical)
        2. tags (array of tech keywords like 'React', 'Node', 'Database')
        3. suggestedPriority ('Low', 'Medium', 'High', 'Critical')
        
        Return ONLY valid JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean markdown if present
        const jsonStr = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Analysis failed:", error);
        return analyzeBugLocally(title, description);
    }
};
