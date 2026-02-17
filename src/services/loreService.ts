// src/services/loreService.ts

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const MODEL = "gemini-3-flash-preview"; 

export const generateQuestLore = async (title: string, type: 'daily' | 'one-off'): Promise<string> => {
  const fallback = type === 'daily' 
    ? "This task repeats with the rising of each new sun. The gods demand consistency from the Dragonborn." 
    : "A singular challenge for the Dragonborn to overcome. The scrolls foretold of this day.";

  if (!API_KEY || API_KEY === 'undefined' || API_KEY.length < 10) {
    console.warn("Gemini API Key is missing or invalid. Using fallback lore.");
    return fallback;
  }

  const prompt = `You are an ancient scribe documenting the deeds of the Dragonborn. 
  Write a unique, immersive, and atmospheric Skyrim-lore description for a new quest titled "${title}". 
  This quest is categorized as a ${type === 'daily' ? 'daily repeatable task' : 'singular side objective'}.
  
  Requirements:
  - Use a tone like the loading screens or quest logs in The Elder Scrolls V: Skyrim.
  - Mention specific Skyrim themes (daedra, dragons, mead, jarls, frost, dungeons, etc.) only if they fit the vibe.
  - Max 3 sentences. No modern language.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorBody);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    return fallback;
  } catch (error) {
    console.error("Failed to scribe lore:", error);
    return fallback;
  }
};
