import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BootConfigResult } from "../services/api";

interface UserState {
  id: string;
  fullName: string;
  email: string;
  role: string;
  accessCode: string;
  interactionTone: string;
  responseComplexity: number;
  voiceModel: string;
  showDemo: boolean;
  twoFactorEnabled: boolean;
  notifyResponseAlerts: boolean;
  notifyDailyBriefing: boolean;
}

const initialState: UserState = {
  id: "",
  fullName: "",
  email: "",
  role: "",
  accessCode: "",
  interactionTone: "professional",
  responseComplexity: 3,
  voiceModel: "atlas",
  showDemo: true,
  twoFactorEnabled: false,
  notifyResponseAlerts: true,
  notifyDailyBriefing: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<BootConfigResult & { accessCode?: string }>,
    ) {
      const { user, preferences, accessCode } = action.payload;
      if (user) {
        state.id = user.id;
        state.fullName = user.fullName;
        state.email = user.email;
        state.role = user.role;
      }
      if (preferences) {
        state.interactionTone = preferences.interactionTone;
        state.responseComplexity = preferences.responseComplexity;
        state.voiceModel = preferences.voiceModel;
        state.showDemo = preferences.showDemo;
        state.twoFactorEnabled = preferences.twoFactorEnabled;
        state.notifyResponseAlerts = preferences.notifyResponseAlerts;
        state.notifyDailyBriefing = preferences.notifyDailyBriefing;
      }
      if (accessCode) {
        state.accessCode = accessCode;
      }
    },
    clearUser() {
      return initialState;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
