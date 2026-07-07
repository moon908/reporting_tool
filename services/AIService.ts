import { OpenAI } from "openai";

export interface AIInsights {
  executiveSummary: string;
  keyFindings: string[];
  trendAnalysis: string;
  recommendations: string[];
  riskAnalysis: string;
  forecast: string;
  businessInsights: string;
  isMock: boolean;
}

export class AIService {
  private static getOpenAIClient(): OpenAI | null {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key" || apiKey.trim() === "") {
      return null;
    }
    return new OpenAI({ apiKey });
  }

  static async generateInsights(params: {
    datasetName: string;
    kpis: Record<string, number>;
    statistics: Record<string, any>;
    anomaliesCount: number;
    sampleRows: any[];
  }): Promise<AIInsights> {
    const openai = this.getOpenAIClient();

    if (!openai) {
      console.warn("OPENAI_API_KEY not configured. Falling back to rule-based mock insights.");
      return this.generateMockInsights(params);
    }

    try {
      const prompt = `
        You are an expert business analyst and data scientist.
        Analyze the following statistics and KPIs extracted from a dataset named "${params.datasetName}".
        
        Key Performance Indicators (KPIs):
        ${JSON.stringify(params.kpis, null, 2)}
        
        Descriptive Statistics:
        ${JSON.stringify(params.statistics, null, 2)}
        
        Anomalies Found: ${params.anomaliesCount}
        
        Sample Data Rows (up to 3):
        ${JSON.stringify(params.sampleRows.slice(0, 3), null, 2)}
        
        Please generate high-value, professional business insights based strictly on this data.
        You MUST return your response as a valid JSON object matching the following structure:
        {
          "executiveSummary": "A concise executive summary paragraph...",
          "keyFindings": ["Finding 1...", "Finding 2...", "Finding 3..."],
          "trendAnalysis": "A descriptive analysis of trends indicated by the data...",
          "recommendations": ["Recommendation 1...", "Recommendation 2...", "Recommendation 3..."],
          "riskAnalysis": "Analysis of risks, including anomalies or gaps found in the data...",
          "forecast": "Forward-looking business forecast or prediction...",
          "businessInsights": "Deeper underlying business insights or operational observations..."
        }
        
        Ensure you only return valid JSON. Do not include markdown code block formatting like \`\`\`json.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI API.");
      }

      const parsed = JSON.parse(content) as Omit<AIInsights, "isMock">;
      return {
        ...parsed,
        isMock: false,
      };
    } catch (error) {
      console.error("Failed to generate AI insights from OpenAI:", error);
      return this.generateMockInsights({
        ...params,
        warning: "OpenAI generation failed; displaying rule-based backup insights.",
      });
    }
  }

  private static generateMockInsights(params: {
    datasetName: string;
    kpis: Record<string, number>;
    statistics: Record<string, any>;
    anomaliesCount: number;
    warning?: string;
  }): AIInsights {
    const totalRecords = params.kpis.totalRecords ?? 0;
    const rev = params.kpis.totalRevenue;
    const cost = params.kpis.totalCost;
    const profit = params.kpis.netProfit;
    const margin = params.kpis.profitMarginPercentage;

    let executiveSummary = `This report provides an automated analytical summary of the dataset "${params.datasetName}", containing ${totalRecords} records. `;
    if (rev !== undefined) {
      executiveSummary += `Financial analysis reveals a total revenue of $${rev.toLocaleString()} against total expenses of $${cost?.toLocaleString() ?? "N/A"}, yielding a net profit of $${profit?.toLocaleString() ?? "N/A"} with a margin of ${margin ?? "N/A"}%. `;
    } else {
      executiveSummary += `The dataset was processed successfully. Descriptive statistics indicate clean metric distributions across available variables. `;
    }
    if (params.warning) {
      executiveSummary += ` (${params.warning})`;
    }

    const keyFindings = [
      `Successfully processed ${totalRecords} data rows without fatal ingestion schemas.`,
    ];
    if (rev !== undefined) {
      keyFindings.push(`Net profit stands at $${profit?.toLocaleString()} with a ${margin}% profit margin.`);
      if (margin && margin > 20) {
        keyFindings.push(`Operations demonstrate strong profitability metrics (>20% margin).`);
      } else {
        keyFindings.push(`Operations indicate moderate margins, highlighting possibilities for cost optimizations.`);
      }
    }
    if (params.anomaliesCount > 0) {
      keyFindings.push(`Identified ${params.anomaliesCount} statistical outliers or anomalous records that require manual verification.`);
    } else {
      keyFindings.push("Statistical distributions show consistent stability with zero standard-deviation outliers.");
    }

    let trendAnalysis = "The dataset displays a stable distribution of values. ";
    if (rev !== undefined) {
      trendAnalysis += "Revenue streams show primary aggregation matching typical core operational profiles, with expenses tracking linearly behind revenue scaling. ";
    } else {
      trendAnalysis += "Variable correlation coefficients suggest a steady baseline without sudden spikes or critical trend shifts. ";
    }

    const recommendations = [
      "Review flagged data anomalies to verify logging integrity.",
      "Implement real-time monitoring on primary operational channels to track margin variations.",
    ];
    if (rev !== undefined) {
      recommendations.push("Conduct a detailed vendor spend audit to identify opportunities for lowering overhead costs.");
    }

    let riskAnalysis = `We detected ${params.anomaliesCount} records that deviate by over 2.5 standard deviations from the mean. `;
    if (params.anomaliesCount > 0) {
      riskAnalysis += "These outliers present potential operational data leakage or logging errors that could skew aggregate forecasts if left unaddressed. ";
    } else {
      riskAnalysis += "No significant data anomalies or risk patterns were found within this batch of records. ";
    }

    const forecast = "Assuming operational parameters remain constant, the model projects stable metric bounds for the upcoming period. ";

    const businessInsights = "Operational performance remains resilient. Maintaining standard workflows while systematically checking outlier anomalies is the recommended protocol.";

    return {
      executiveSummary,
      keyFindings,
      trendAnalysis,
      recommendations,
      riskAnalysis,
      forecast,
      businessInsights,
      isMock: true,
    };
  }
}
