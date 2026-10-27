import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TOKEN_KEY } from "../api/api";
import { getCurrentUser } from "../api/authApi";
import type { MeUser } from "../types/auth";

type AuthContextValue = {
  user: MeUser | null;
  isLoading: boolean;
  setSession: (token: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((me) => setUser(me))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  async function setSession(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    const me = await getCurrentUser();
    setUser(me);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
