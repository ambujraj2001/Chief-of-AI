import { registry } from "./registry";
import { router } from "./router";
import { sessionManager } from "./session";
import { IFlow, FlowContext, FlowResult } from "./types";

// Mock Flow for testing
const MockFlow: IFlow = {
  id: "test_flow",
  version: 1,
  priority: 10,
  match(message: string) {
    return message.includes("test trigger");
  },
  async execute(context: FlowContext): Promise<FlowResult> {
    return { type: "success", reply: "Flow executed successfully" };
  },
};

/**
 * Minimal Unit Tests for Flow Infrastructure
 */
async function runTests() {
  console.log("🚀 Starting Flow Infrastructure Unit Tests...");

  // 1. Registry Test
  console.log("\n[1/3] Testing Registry...");
  registry.registerFlow(MockFlow);
  const fetched = registry.getFlowById("test_flow");
  if (fetched?.id === "test_flow") {
    console.log("✅ Registry: Flow registration and retrieval successful.");
  } else {
    console.error("❌ Registry: Flow retrieval failed.");
  }

  // 2. Router Stage 1/2 Test
  console.log("\n[2/3] Testing Router (Stage 1/2)...");
  const match = await router.match("Hello, this is a test trigger message");
  if (match?.flowId === "test_flow" && match.confidence === 1.0) {
    console.log("✅ Router: Stage 1/2 matching successful.");
  } else {
    console.error("❌ Router: Matching failed.");
  }

  // 3. Session Manager Test (Simulation)
  console.log("\n[3/3] Testing Session Manager...");
  // Note: This requires a real or mocked Redis connection
  try {
    const testUserId = "user-123";
    await sessionManager.setSession(testUserId, {
      flowId: "test_flow",
      flowVersion: 1,
      step: "initial",
      context: { foo: "bar" },
    });
    
    const session = await sessionManager.getSession(testUserId);
    if (session?.flowId === "test_flow") {
      console.log("✅ SessionManager: Set and Get session successful.");
    } else {
      console.warn("⚠️ SessionManager: Session not found (Check Redis connection).");
    }
    
    await sessionManager.clearSession(testUserId);
  } catch (err: any) {
    console.warn("⚠️ SessionManager: Skipped real Redis test (ensure UPSTASH_REDIS is configured).");
  }

  console.log("\n🏁 Tests Completed.");
}

// Only run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
