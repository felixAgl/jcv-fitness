import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSubscription } from "../useSubscription";
import { createMockSubscription, createMockProfile } from "@/test/mocks/supabase";
import type { ReactNode } from "react";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock subscription service
const mockGetActiveSubscription = vi.fn();
const mockCancelSubscription = vi.fn();

vi.mock("../../services/subscription-service", () => ({
  subscriptionService: {
    getActiveSubscription: (...args: unknown[]) => mockGetActiveSubscription(...args),
    cancelSubscription: (...args: unknown[]) => mockCancelSubscription(...args),
  },
}));

describe("useSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should start with isLoading true", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile(),
      });
      mockGetActiveSubscription.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscription());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should return null subscription when user is not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscription).toBeNull();
      expect(result.current.hasActiveSubscription).toBe(false);
    });
  });

  describe("Loading Subscription", () => {
    it("should load active subscription for authenticated user", async () => {
      const mockSub = createMockSubscription();
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: true }),
      });
      mockGetActiveSubscription.mockResolvedValue(mockSub);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscription).toEqual(mockSub);
      expect(mockGetActiveSubscription).toHaveBeenCalledWith("test-user-id");
    });

    it("should handle subscription load error", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile(),
      });
      mockGetActiveSubscription.mockRejectedValue(new Error("Load failed"));

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Load failed");
    });
  });

  describe("hasActiveSubscription", () => {
    it("should return true when profile has active subscription", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: true }),
      });
      mockGetActiveSubscription.mockResolvedValue(createMockSubscription());

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasActiveSubscription).toBe(true);
    });

    it("should return false when profile has no active subscription", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: false }),
      });
      mockGetActiveSubscription.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasActiveSubscription).toBe(false);
    });
  });

  describe("daysRemaining", () => {
    it("should calculate days remaining correctly", async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 15); // 15 days from now

      const mockSub = createMockSubscription({
        end_date: endDate.toISOString(),
      });

      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: true }),
      });
      mockGetActiveSubscription.mockResolvedValue(mockSub);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysRemaining).toBe(15);
    });

    it("should return 0 when subscription is expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

      const mockSub = createMockSubscription({
        end_date: pastDate.toISOString(),
      });

      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: false }),
      });
      mockGetActiveSubscription.mockResolvedValue(mockSub);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysRemaining).toBe(0);
    });

    it("should return 0 when no subscription", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile(),
      });
      mockGetActiveSubscription.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.daysRemaining).toBe(0);
    });
  });

  // SECURITY: the hook no longer exposes createSubscription. Activation happens
  // server-side via the verified-payment webhook; the client can only read.
  describe("no client-side activation", () => {
    it("does not expose a createSubscription method", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile(),
      });
      mockGetActiveSubscription.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        (result.current as unknown as Record<string, unknown>).createSubscription
      ).toBeUndefined();
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel subscription and update state", async () => {
      const mockSub = createMockSubscription();
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: true }),
      });
      mockGetActiveSubscription.mockResolvedValue(mockSub);
      mockCancelSubscription.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.subscription).toEqual(mockSub);
      });

      await act(async () => {
        await result.current.cancelSubscription();
      });

      expect(result.current.subscription).toBeNull();
      expect(mockCancelSubscription).toHaveBeenCalledWith(mockSub.id);
    });

    it("should throw error when no active subscription", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile(),
      });
      mockGetActiveSubscription.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.cancelSubscription()).rejects.toThrow(
        "No active subscription"
      );
    });
  });

  describe("refresh", () => {
    it("should reload subscription data", async () => {
      const mockSub = createMockSubscription();
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id" },
        profile: createMockProfile({ has_active_subscription: true }),
      });
      mockGetActiveSubscription.mockResolvedValue(mockSub);

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear and setup new mock
      mockGetActiveSubscription.mockClear();
      const updatedSub = createMockSubscription({ plan_type: "PLAN_PREMIUM" });
      mockGetActiveSubscription.mockResolvedValue(updatedSub);

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockGetActiveSubscription).toHaveBeenCalledWith("test-user-id");
      expect(result.current.subscription?.plan_type).toBe("PLAN_PREMIUM");
    });
  });
});
