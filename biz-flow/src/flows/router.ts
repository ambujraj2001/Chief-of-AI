import { FlowMatch } from "./types";
import { registry } from "./registry";

export class FlowRouter {
  /**
   * Orchestrates the 3-stage routing system
   */
  async match(message: string): Promise<FlowMatch | null> {
    const cleanMessage = message.trim().toLowerCase();

    // Stage 1 & 2: Deterministic and Heuristic Matching
    // We iterate through all flows and let them determine if they match.
    // The match() method in each flow should handle regex and keyword heuristics.
    const flows = registry.getAllFlows();

    for (const flow of flows) {
      if (flow.match(cleanMessage)) {
        return {
          flowId: flow.id,
          parameters: this.extractParameters(flow.id, cleanMessage),
          confidence: 1.0, // Stage 1/2 matches are considered high confidence
        };
      }
    }

    // Stage 3: LLM Classification Fallback (Placeholder)
    // TODO: Implement LLM-based intent detection here if Stage 1 & 2 fail.
    
    return null;
  }

  /**
   * Helper to extract parameters from common patterns (Placeholder)
   * Real implementation will likely be more robust or flow-specific.
   */
  private extractParameters(flowId: string, message: string): Record<string, any> {
    // Pass the original message so flows can perform their own specific parsing
    return {
      originalMessage: message
    };
  }
}

export const router = new FlowRouter();
