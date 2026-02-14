import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";
import {
  createMockSupabaseClient,
  createMockUser,
  createMockProfile,
  createMockSession,
} from "@/test/mocks/supabase";

// Mock the createClient function
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";

// Test component to access auth context
function TestAuthConsumer({ onAuthChange }: { onAuthChange?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();

  if (onAuthChange) {
    onAuthChange(auth);
  }

  return (
    <div>
      <div data-testid="loading">{String(auth.isLoading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="user-email">{auth.user?.email || "none"}</div>
      <div data-testid="profile-name">{auth.profile?.full_name || "none"}</div>
      <button onClick={() => auth.signIn("test@test.com", "password")}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let authChangeCallback: ((event: string, session: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;

    mockSupabase = createMockSupabaseClient();

    // Setup onAuthStateChange to capture the callback
    mockSupabase.client.auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    vi.mocked(createClient).mockReturnValue(mockSupabase.client as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should start with isLoading true", async () => {
      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Initial state should be loading
      expect(screen.getByTestId("loading").textContent).toBe("true");
    });

    it("should set isAuthenticated true when session exists", async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      const mockProfile = createMockProfile();

      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.mocks.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      expect(screen.getByTestId("user-email").textContent).toBe(mockUser.email);
    });

    it("should set isAuthenticated false when no session", async () => {
      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });
  });

  describe("Timeout Handling", () => {
    it("should force isLoading false after 3 second timeout", async () => {
      vi.useFakeTimers();

      // Never resolve getSession
      mockSupabase.client.auth.getSession.mockImplementation(() => new Promise(() => {}));

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId("loading").textContent).toBe("true");

      // Fast-forward 3 seconds (timeout changed from 5s to 3s in AuthContext)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Should no longer be loading
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("authenticated").textContent).toBe("false");

      vi.useRealTimers();
    });
  });

  describe("Sign In", () => {
    it("should call supabase signInWithPassword", async () => {
      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.client.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      await user.click(screen.getByText("Sign In"));

      expect(mockSupabase.client.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password",
      });
    });
  });

  describe("Sign Out", () => {
    it("should call supabase signOut and reset state", async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.client.auth.signOut.mockResolvedValue({
        error: null,
      });

      mockSupabase.mocks.single.mockResolvedValue({
        data: createMockProfile(),
        error: null,
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      await user.click(screen.getByText("Sign Out"));

      expect(mockSupabase.client.auth.signOut).toHaveBeenCalled();
    });
  });

  describe("Profile Loading", () => {
    it("should load profile after user is authenticated", async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      const mockProfile = createMockProfile({ full_name: "John Doe" });

      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.mocks.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // User should be authenticated immediately
      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      // Profile loads async
      await waitFor(() => {
        expect(screen.getByTestId("profile-name").textContent).toBe("John Doe");
      });
    });

    it("should handle profile fetch error gracefully", async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.mocks.single.mockResolvedValue({
        data: null,
        error: { message: "Profile not found" },
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Should still authenticate even if profile fails
      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      expect(screen.getByTestId("profile-name").textContent).toBe("none");
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestAuthConsumer />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Auth State Change Events", () => {
    it("should handle SIGNED_OUT event", async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.mocks.single.mockResolvedValue({
        data: createMockProfile(),
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      // Simulate sign out event
      await act(async () => {
        if (authChangeCallback) {
          authChangeCallback("SIGNED_OUT", null);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
      });
    });

    it("should handle SIGNED_IN event", async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.client.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.mocks.single.mockResolvedValue({
        data: createMockProfile(),
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
      });

      // Simulate sign in event
      await act(async () => {
        if (authChangeCallback) {
          authChangeCallback("SIGNED_IN", mockSession);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });
    });
  });

  describe("No Supabase Client", () => {
    it("should handle missing supabase client gracefully", async () => {
      vi.mocked(createClient).mockReturnValue(null as never);

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });
  });
});
