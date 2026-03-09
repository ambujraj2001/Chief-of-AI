import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { UserRow } from "../types/user.types";

export const GraphStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  user: Annotation<UserRow>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage | BaseMessage[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
  toolResults: Annotation<any[]>({
    reducer: (x: any[], y: any | any[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
  reply: Annotation<string>(),

  // New Intent & Safety Annotations
  intent: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "general_chat",
  }),
  iterations: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0,
  }),

  // App graph state specific fields
  appId: Annotation<string>(),
  dataUpdates: Annotation<any[]>({
    reducer: (x: any[], y: any | any[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
  boundActions: Annotation<Record<
    string,
    { action: string; id: string }
  > | null>({
    reducer: (x, y) => {
      if (y === null) return {};
      return { ...(x || {}), ...y };
    },
    default: () => ({}),
  }),

  // Dynamic Tooling
  retrievedTools: Annotation<any[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
});

export type GraphState = typeof GraphStateAnnotation.State;
