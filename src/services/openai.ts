const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

class OpenAIService {
  private systemPrompt = `You are Kyra, a professional real estate advisor and property analyst with extensive experience in the Irish real estate market.

Key traits:
- You speak naturally and professionally, like a seasoned real estate expert
- You ALWAYS respond in the SAME LANGUAGE the user writes in (English, Czech, Russian, French, etc.)
- You have deep knowledge of property markets, investments, and trends
- You can perform actions in the application like opening properties, generating reports, navigating sections
- You provide specific, data-driven advice based on the portfolio information provided
- You're helpful, knowledgeable, and can explain complex real estate concepts simply

Context about the application:
- This is 4Property Codes - a real estate management system
- Users can view properties, agencies, generate reports, and analyze market data
- You have access to the full property database and can reference specific properties
- You can trigger actions like: opening property details, generating reports, navigating to sections

When users ask you to show a property or generate a report, you should:
1. Confirm which property they mean (if ambiguous)
2. Use the action command format: [ACTION:type:data]
3. Available actions:
   - [ACTION:OPEN_PROPERTY:property_id] - Opens property detail view
   - [ACTION:GENERATE_REPORT:property_id] - Generates AI report for property
   - [ACTION:NAVIGATE:section_name] - Navigates to a section (overview, agencies, settings, etc.)
   - [ACTION:SEARCH:query] - Searches for properties matching criteria

Always be helpful, professional, and conversational.`;

  async chat(userMessage: string, conversationHistory: ChatMessage[] = [], context?: any): Promise<{ response: string; actions: any[] }> {
    try {
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
        return this.getFallbackResponse(userMessage, context);
      }

      const contextInfo = this.buildContextInfo(context);

      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompt + contextInfo },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-5-codex',
          messages,
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.statusText);
        return this.getFallbackResponse(userMessage, context);
      }

      const data: OpenAIResponse = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'I apologize, I encountered an error.';

      const actions = this.extractActions(assistantMessage);
      const cleanedMessage = this.removeActionTags(assistantMessage);

      return { response: cleanedMessage, actions };

    } catch (error) {
      console.error('OpenAI service error:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildContextInfo(context?: any): string {
    if (!context) return '';

    const { properties = [], agencies = [] } = context;

    let info = '\n\nCurrent Portfolio Context:\n';
    info += `- Total Properties: ${properties.length}\n`;
    info += `- Total Agencies: ${agencies.length}\n`;

    if (properties.length > 0) {
      info += `\nSample Properties:\n`;
      properties.slice(0, 5).forEach((p: any) => {
        info += `- ID: ${p.id}, Title: ${p.title}, Price: €${p.price?.toLocaleString()}, Beds: ${p.bedrooms}, Location: ${p.city || p.location?.city}\n`;
      });
    }

    if (agencies.length > 0) {
      info += `\nTop Agencies:\n`;
      agencies.slice(0, 3).forEach((a: any) => {
        const propCount = properties.filter((p: any) => p.agency_id === a.id).length;
        info += `- ${a.name}: ${propCount} properties\n`;
      });
    }

    return info;
  }

  private extractActions(message: string): any[] {
    const actions: any[] = [];
    const actionRegex = /\[ACTION:(\w+):([^\]]+)\]/g;
    let match;

    while ((match = actionRegex.exec(message)) !== null) {
      actions.push({
        type: match[1],
        data: match[2]
      });
    }

    return actions;
  }

  private removeActionTags(message: string): string {
    return message.replace(/\[ACTION:\w+:[^\]]+\]/g, '').trim();
  }

  private getFallbackResponse(userMessage: string, context?: any): { response: string; actions: any[] } {
    const lowerMessage = userMessage.toLowerCase();

    const isCzech = /[áčďéěíňóřšťúůýž]/i.test(userMessage);
    const isRussian = /[а-яё]/i.test(userMessage);
    const isFrench = /[àâæçéèêëïîôùûüÿœ]/i.test(userMessage);

    let response = '';

    if (isCzech) {
      response = 'Omlouvám se, ale pro využití mých pokročilých funkcí potřebuji OpenAI API klíč. Momentálně mohu poskytnout základní informace o vašem portfoliu.';
    } else if (isRussian) {
      response = 'Извините, но для использования моих расширенных функций требуется ключ OpenAI API. В настоящее время я могу предоставить базовую информацию о вашем портфолио.';
    } else if (isFrench) {
      response = 'Désolé, mais j\'ai besoin d\'une clé API OpenAI pour utiliser mes fonctions avancées. Je peux actuellement fournir des informations de base sur votre portfolio.';
    } else {
      response = 'I apologize, but I need an OpenAI API key to use my advanced features. I can currently provide basic information about your portfolio.';
    }

    if (context?.properties) {
      if (isCzech) {
        response += `\n\nMáte ${context.properties.length} nemovitostí v portfoliu.`;
      } else if (isRussian) {
        response += `\n\nУ вас ${context.properties.length} объектов в портфолио.`;
      } else if (isFrench) {
        response += `\n\nVous avez ${context.properties.length} propriétés dans votre portfolio.`;
      } else {
        response += `\n\nYou have ${context.properties.length} properties in your portfolio.`;
      }
    }

    return { response, actions: [] };
  }
}

export const openAIService = new OpenAIService();
