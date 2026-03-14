import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const makeCallTool = new DynamicStructuredTool({
  name: "make_phone_call",
  description: "Triggers the system to initiate a phone call. Use this when the user explicitly asks to 'call' a number or a person name.",
  schema: z.object({
    phoneNumber: z.string().describe("The phone number to call"),
    name: z.string().optional().describe("The name of the person being called"),
  }),
  func: async ({ phoneNumber, name }) => {
    // This tool primarily exists to provide the UI with structured contact info
    // The planner will see the tool result and then wrap it in a contact_list component
    return JSON.stringify({
      status: "ready",
      message: `I'm ready to call ${name || phoneNumber}. I've displayed the call button for you below.`,
      contact: {
        name: name || "Contact",
        phone: phoneNumber
      }
    });
  },
});
