import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionService } from "../subscription-service";
import {
  createMockSupabaseClient,
  createMockSubscription,
} from "@/test/mocks/supabase";

// Mock the createClient function
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";

describe("SubscriptionService", () => {
  let service: SubscriptionService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(mockSupabase.client as never);
    service = new SubscriptionService();
  });

  describe("getActiveSubscription", () => {
    it("should return active subscription when found", async () => {
      const mockSub = createMockSubscription();
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: mockSub,
        error: null,
      });

      const result = await service.getActiveSubscription("test-user-id");

      expect(result).toEqual(mockSub);
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith("subscriptions");
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith("user_id", "test-user-id");
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith("status", "active");
    });

    it("should return null when no subscription found", async () => {
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getActiveSubscription("test-user-id");

      expect(result).toBeNull();
    });

    it("should return null and log error on query error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await service.getActiveSubscription("test-user-id");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[SubscriptionService] Error fetching subscription:",
        expect.any(Object)
      );
      consoleSpy.mockRestore();
    });
  });

  // SECURITY: createSubscription was removed. The service must NEVER write a
  // subscriptions row or a profiles entitlement column — those are granted only
  // by the verified-payment webhook (service role). These tests lock that in.
  describe("no client entitlement writes", () => {
    it("does not expose a createSubscription method", () => {
      expect(
        (service as unknown as Record<string, unknown>).createSubscription
      ).toBeUndefined();
    });

    it("does not expose a checkAndExpireSubscriptions method", () => {
      expect(
        (service as unknown as Record<string, unknown>).checkAndExpireSubscriptions
      ).toBeUndefined();
    });

    it("getActiveSubscription performs no insert/update", async () => {
      mockSupabase.mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

      await service.getActiveSubscription("test-user-id");

      expect(mockSupabase.mocks.insert).not.toHaveBeenCalled();
      expect(mockSupabase.mocks.update).not.toHaveBeenCalled();
    });
  });

  describe("findSubscriptionByPaymentReference (activation poll)", () => {
    it("returns the webhook-created subscription without any write", async () => {
      const mockSub = createMockSubscription({ payment_reference: "mp-123" });
      mockSupabase.mocks.maybeSingle.mockResolvedValue({ data: mockSub, error: null });

      const result = await service.findSubscriptionByPaymentReference("mp-123");

      expect(result).toEqual(mockSub);
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith("subscriptions");
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith("payment_reference", "mp-123");
      // Purely a read — no writes.
      expect(mockSupabase.mocks.insert).not.toHaveBeenCalled();
      expect(mockSupabase.mocks.update).not.toHaveBeenCalled();
      expect(mockSupabase.mocks.rpc).not.toHaveBeenCalled();
    });

    it("returns null for an empty reference without querying", async () => {
      const result = await service.findSubscriptionByPaymentReference("");
      expect(result).toBeNull();
      expect(mockSupabase.mocks.from).not.toHaveBeenCalled();
    });

    it("returns null and logs on query error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "boom" },
      });

      const result = await service.findSubscriptionByPaymentReference("mp-x");

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("cancelSubscription (SECURITY DEFINER RPC path)", () => {
    it("routes cancellation through the cancel_subscription RPC, not a direct update", async () => {
      mockSupabase.mocks.rpc.mockResolvedValue({ data: true, error: null });

      await service.cancelSubscription("test-subscription-id");

      expect(mockSupabase.mocks.rpc).toHaveBeenCalledWith("cancel_subscription", {
        p_subscription_id: "test-subscription-id",
      });
      // Must NOT touch subscriptions/profiles directly from the client.
      expect(mockSupabase.mocks.update).not.toHaveBeenCalled();
      expect(mockSupabase.mocks.insert).not.toHaveBeenCalled();
    });

    it("throws when the RPC reports the subscription was not found/owned", async () => {
      mockSupabase.mocks.rpc.mockResolvedValue({ data: false, error: null });

      await expect(
        service.cancelSubscription("non-existent-id")
      ).rejects.toThrow("Subscription not found");
    });

    it("throws on RPC error", async () => {
      mockSupabase.mocks.rpc.mockResolvedValue({
        data: null,
        error: { message: "rpc failed" },
      });

      await expect(
        service.cancelSubscription("test-subscription-id")
      ).rejects.toThrow("rpc failed");
    });
  });

  describe("getSubscriptionHistory", () => {
    it("should return all subscriptions for user", async () => {
      const mockSubs = [
        createMockSubscription({ id: "sub-1" }),
        createMockSubscription({ id: "sub-2", status: "expired" }),
      ];
      mockSupabase.mocks.order.mockResolvedValue({
        data: mockSubs,
        error: null,
      });

      const result = await service.getSubscriptionHistory("test-user-id");

      expect(result).toEqual(mockSubs);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no history", async () => {
      mockSupabase.mocks.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getSubscriptionHistory("test-user-id");

      expect(result).toEqual([]);
    });

    it("should throw error on query failure", async () => {
      mockSupabase.mocks.order.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      await expect(
        service.getSubscriptionHistory("test-user-id")
      ).rejects.toThrow("Query failed");
    });
  });
});
