import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "asset-management-auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? payload.error
        : "Unable to complete the authentication request.";

    throw new Error(message);
  }

  return payload;
}

function normalizeRequestError(error) {
  if (error instanceof TypeError) {
    return new Error("Unable to reach the authentication service.");
  }

  return error;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedSession = localStorage.getItem(STORAGE_KEY);

        if (!storedSession) {
          return;
        }

        const parsedSession = JSON.parse(storedSession);

        if (!parsedSession?.token) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const profile = await request("/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${parsedSession.token}`
          }
        });

        if (isMounted) {
          setUser({
            ...parsedSession,
            username: profile.username,
            role: profile.role
          });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    try {
      const payload = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username,
          password
        })
      });

      const session = {
        username: payload.username,
        role: payload.role,
        token: payload.token,
        tokenType: payload.tokenType,
        loginAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setUser(session);

      return session;
    } catch (error) {
      throw normalizeRequestError(error);
    }
  };

  const requestPasswordResetOtp = async (username) => {
    try {
      return await request("/api/auth/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({
          username
        })
      });
    } catch (error) {
      throw normalizeRequestError(error);
    }
  };

  const verifyPasswordResetOtp = async (username, otp) => {
    try {
      return await request("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          username,
          otp
        })
      });
    } catch (error) {
      throw normalizeRequestError(error);
    }
  };

  const resetPasswordWithOtp = async (username, otp, newPassword, confirmPassword) => {
    try {
      return await request("/api/auth/forgot-password/reset-password", {
        method: "POST",
        body: JSON.stringify({
          username,
          otp,
          newPassword,
          confirmPassword
        })
      });
    } catch (error) {
      throw normalizeRequestError(error);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    requestPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
