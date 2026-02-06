import { vi } from "vitest";
import type { ReactNode } from "react";
import { createMockUser, createMockProfile, createMockSession } from "./supabase";

// Mock AuthContext value factory
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
  ...overrides,
});

// Create authenticated context
export const createAuthenticatedContext = (overrides = {}) => {
  const user = createMockUser();
  const profile = createMockProfile();
  const session = createMockSession(user);

  return createMockAuthContext({
    user,
    profile,
    session,
    isAuthenticated: true,
    ...overrides,
  });
};

// Mock AuthProvider wrapper
export const MockAuthProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: ReturnType<typeof createMockAuthContext>;
}) => {
  // This will be used by tests that mock the useAuth hook directly
  return <>{children}</>;
};
