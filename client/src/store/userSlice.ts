import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BootConfigResult } from "../services/api";

interface UserState {
  fullName: string;
  email: string;
  role: string;
  accessCode: string;
  interactionTone: string;
  responseComplexity: number;
  voiceModel: string;
  showDemo: boolean;
}

const initialState: UserState = {
  fullName: "",
  email: "",
  role: "",
  accessCode: "",
  interactionTone: "professional",
  responseComplexity: 3,
  voiceModel: "atlas",
  showDemo: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<BootConfigResult & { accessCode?: string }>) {
      const { user, preferences, accessCode } = action.payload;
      return {
        ...state,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accessCode: accessCode || state.accessCode,
        ...preferences,
      };
    },
    clearUser() {
      return initialState;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
