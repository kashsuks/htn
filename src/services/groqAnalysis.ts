import Groq from 'groq-sdk';

// Environment variables for Groq API
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Trading decision interface
export interface TradingDecision {
  timestamp: string;
  action: 'buy' | 'sell' | 'hold';
  symbol: string;
  quantity: number;
  price: number;
  reasoning?: string;
  portfolio_value_before: number;
  portfolio_value_after: number;
}

// Simulation data interface
export interface SimulationData {
  round_number: number;
  duration_minutes: number;
  starting_portfolio_value: number;
  ending_portfolio_value: number;
  market_conditions: {
    volatility: number;
    trend: 'bullish' | 'bearish' | 'sideways';
    major_events: string[];
  };
  user_decisions: TradingDecision[];
  ai_decisions: TradingDecision[];
  final_user_return: number;
  final_ai_return: number;
}

// Analysis response interface
export interface GroqAnalysisResponse {
  overall_performance: {
    user_score: number;
    ai_score: number;
    performance_gap: number;
  };
  key_insights: string[];
  decision_analysis: {
    good_decisions: TradingDecision[];
    poor_decisions: TradingDecision[];
    missed_opportunities: TradingDecision[];
  };
  learning_recommendations: string[];
  ai_comparison: {
    what_ai_did_better: string[];
    what_user_did_better: string[];
    key_differences: string[];
  };
  next_round_tips: string[];
}

class GroqTradingAnalysisService {
  private groq: Groq;

  constructor() {
    if (!GROQ_API_KEY) {
      throw new Error('VITE_GROQ_API_KEY environment variable is required');
    }
    this.groq = new Groq({
      apiKey: GROQ_API_KEY,
      dangerouslyAllowBrowser: true // Enable browser usage
    });
  }

  /**
   * Analyze trading performance and provide educational feedback
   */
  async analyzeTradingPerformance(simulationData: SimulationData): Promise<GroqAnalysisResponse> {
    try {
      const prompt = this.buildAnalysisPrompt(simulationData);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert trading mentor and financial educator. Your role is to analyze trading decisions and provide constructive, educational feedback to help users improve their trading skills. 

You should:
1. Compare user decisions with AI decisions objectively
2. Identify specific learning opportunities
3. Explain WHY certain decisions were good or bad
4. Provide actionable advice for improvement
5. Be encouraging while being honest about mistakes
6. Focus on education over criticism

Always respond in valid JSON format matching the GroqAnalysisResponse interface.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-70b-versatile",
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Groq API');
      }

      return JSON.parse(response) as GroqAnalysisResponse;
    } catch (error) {
      console.error('Groq analysis error:', error);
      throw new Error(`Failed to analyze trading performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the analysis prompt with simulation data
   */
  private buildAnalysisPrompt(data: SimulationData): string {
    return `
Please analyze this trading simulation round and provide educational feedback:

## Simulation Overview
- Round: ${data.round_number}
- Duration: ${data.duration_minutes} minutes
- Starting Portfolio Value: $${data.starting_portfolio_value.toLocaleString()}
- Ending Portfolio Value: $${data.ending_portfolio_value.toLocaleString()}

## Market Conditions
- Volatility: ${data.market_conditions.volatility}
- Trend: ${data.market_conditions.trend}
- Major Events: ${data.market_conditions.major_events.join(', ')}

## Performance Results
- User Final Return: ${(data.final_user_return * 100).toFixed(2)}%
- AI Final Return: ${(data.final_ai_return * 100).toFixed(2)}%

## User Trading Decisions
${data.user_decisions.map(decision => 
  `- ${decision.timestamp}: ${decision.action.toUpperCase()} ${decision.quantity} ${decision.symbol} at $${decision.price} (Portfolio: $${decision.portfolio_value_before} → $${decision.portfolio_value_after})`
).join('\n')}

## AI Trading Decisions
${data.ai_decisions.map(decision => 
  `- ${decision.timestamp}: ${decision.action.toUpperCase()} ${decision.quantity} ${decision.symbol} at $${decision.price} (Portfolio: $${decision.portfolio_value_before} → $${decision.portfolio_value_after})`
).join('\n')}

Please provide a comprehensive analysis in JSON format that includes:
1. Overall performance comparison with scores (0-100)
2. Key insights about the user's trading approach
3. Analysis of specific good and poor decisions
4. Learning recommendations for improvement
5. Comparison with AI decisions - what each did better
6. Specific tips for the next trading round

Focus on being educational and constructive. Help the user understand WHY certain decisions worked or didn't work, and HOW they can improve.
`;
  }

  /**
   * Generate a quick summary for display
   */
  generateQuickSummary(analysis: GroqAnalysisResponse): string {
    const performanceGap = analysis.overall_performance.performance_gap;
    const gapText = performanceGap > 0 
      ? `You outperformed the AI by ${performanceGap.toFixed(1)} points!`
      : `The AI outperformed you by ${Math.abs(performanceGap).toFixed(1)} points.`;

    return `
Performance: ${analysis.overall_performance.user_score}/100 vs AI: ${analysis.overall_performance.ai_score}/100
${gapText}

Key Insight: ${analysis.key_insights[0] || 'Analysis completed successfully.'}
    `.trim();
  }
}

export default GroqTradingAnalysisService;
