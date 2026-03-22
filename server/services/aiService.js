const Ollama = require('ollama');

class AIService {
    constructor() {
        this.ollama = new Ollama.Ollama({
            host: 'http://127.0.0.1:11434'
        });
        this.model = 'qwen3:8b';
        
        // System prompt for waste management assistant
        this.systemPrompt = `You are BinGO AI, an intelligent assistant for a waste management system. 
Your role is to help citizens, workers, and administrators with waste-related queries.
Be helpful, concise, and environmentally conscious.

Key information about the system:
- Citizens can report waste, request dustbins, schedule pickups
- Workers handle waste collection and dustbin maintenance
- Administrators manage the entire system
- Focus on cleanliness, sustainability, and efficient waste management

Always provide practical advice about waste segregation, recycling, and proper disposal.`;
    }

    async chat(userMessage, conversationHistory = []) {
        try {
            const messages = [
                { role: 'system', content: this.systemPrompt },
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            const response = await this.ollama.chat({
                model: this.model,
                messages: messages,
                stream: false
            });

            return {
                success: true,
                message: response.message.content,
                model: this.model
            };
        } catch (error) {
            console.error('Ollama API Error:', error);
            
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: 'Ollama is not running. Please start Ollama service.',
                    hint: 'Run "ollama serve" or open Ollama application'
                };
            }
            
            return {
                success: false,
                error: 'Failed to get AI response',
                details: error.message
            };
        }
    }

    async generateResponse(prompt, context = '') {
        try {
            const fullPrompt = context 
                ? `${context}\n\nUser: ${prompt}\nAssistant:`
                : prompt;

            const response = await this.ollama.generate({
                model: this.model,
                prompt: fullPrompt,
                stream: false
            });

            return {
                success: true,
                text: response.response,
                model: this.model
            };
        } catch (error) {
            console.error('Ollama Generate Error:', error);
            return {
                success: false,
                error: 'Failed to generate response',
                details: error.message
            };
        }
    }

    // Specialized helpers for waste management
    async classifyWaste(description) {
        const prompt = `Classify this waste item into one of these categories: RECYCLABLE, ORGANIC, HAZARDOUS, GENERAL_WASTE.
Also provide a brief disposal instruction.

Waste: ${description}

Respond in JSON format: {"category": "...", "disposal": "..."}`;

        const result = await this.generateResponse(prompt);
        
        if (result.success) {
            try {
                // Try to parse JSON from response
                const jsonMatch = result.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                // Fallback to text response
            }
        }
        
        return result;
    }

    async suggestAction(issue) {
        const prompt = `Based on this issue, suggest the best action:

Issue: ${issue}

Provide a concise recommendation (1-2 sentences).`;

        return await this.generateResponse(prompt);
    }
}

module.exports = new AIService();
