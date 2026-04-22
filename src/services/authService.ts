// ─────────────────────────────────────────────
// SkillSnap — Auth Service
// Integration point: swap mock returns for real
// auth provider calls (Supabase / Firebase / Auth0)
// ─────────────────────────────────────────────
import type { User } from "@/types";
import { MOCK_CURRENT_USER } from "@/mock-data/users";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// TODO: replace with provider SDK calls
export const authService = {
  async signUp(_email: string, _password: string): Promise<AuthResult> {
    return { success: true, user: MOCK_CURRENT_USER };
  },

  async logIn(_email: string, _password: string): Promise<AuthResult> {
    return { success: true, user: MOCK_CURRENT_USER };
  },

  async logOut(): Promise<void> {
    // TODO: provider.signOut()
  },

  async getCurrentUser(): Promise<User | null> {
    // TODO: provider.getSession() → hydrate User
    return MOCK_CURRENT_USER;
  },

  isAuthenticated(): boolean {
    // TODO: check session token
    return true;
  },
};
