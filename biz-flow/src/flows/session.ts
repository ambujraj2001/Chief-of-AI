import { redis } from "../config/redis";
import { FlowSession } from "./types";

const SESSION_PREFIX = "flow:session:";
const SESSION_TTL = 300; // 5 minutes

export class FlowSessionManager {
  /**
   * Retrieves an active flow session for a user
   */
  async getSession(userId: string): Promise<FlowSession | null> {
    try {
      const session = await redis.get<FlowSession>(`${SESSION_PREFIX}${userId}`);
      if (!session) return null;

      // Double check expiry (though redis handles this)
      if (Date.now() > session.expiresAt) {
        await this.clearSession(userId);
        return null;
      }

      return session;
    } catch (error) {
      console.error("[FlowSessionManager] Error getting session:", error);
      return null;
    }
  }

  /**
   * Sets or updates a flow session for a user
   */
  async setSession(userId: string, session: Omit<FlowSession, "expiresAt">): Promise<void> {
    try {
      const fullSession: FlowSession = {
        ...session,
        expiresAt: Date.now() + SESSION_TTL * 1000,
      };

      await redis.set(`${SESSION_PREFIX}${userId}`, fullSession, {
        ex: SESSION_TTL,
      });
    } catch (error) {
      console.error("[FlowSessionManager] Error setting session:", error);
    }
  }

  /**
   * Removes a flow session
   */
  async clearSession(userId: string): Promise<void> {
    try {
      await redis.del(`${SESSION_PREFIX}${userId}`);
    } catch (error) {
      console.error("[FlowSessionManager] Error clearing session:", error);
    }
  }
}

export const sessionManager = new FlowSessionManager();
