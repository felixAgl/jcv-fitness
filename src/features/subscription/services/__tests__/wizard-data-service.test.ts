import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WizardDataService } from "../wizard-data-service";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// Mock the createClient function
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";

describe("WizardDataService", () => {
  let service: WizardDataService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(mockSupabase.client as never);
    service = new WizardDataService();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("saveWizardData", () => {
    const testData = {
      goal: "muscle_gain",
      experience: "intermediate",
      frequency: 4,
    };

    it("should update existing wizard data", async () => {
      // Existing data found
      mockSupabase.mocks.maybeSingle.mockResolvedValueOnce({
        data: { id: "existing-id" },
        error: null,
      });
      // Update successful
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: "existing-id", user_id: "test-user-id", data: testData },
        error: null,
      });

      const result = await service.saveWizardData("test-user-id", testData);

      expect(result.data).toEqual(testData);
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({ data: testData });
    });

    it("should create new wizard data when none exists", async () => {
      // No existing data
      mockSupabase.mocks.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      // Insert successful
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: { id: "new-id", user_id: "test-user-id", data: testData },
        error: null,
      });

      const result = await service.saveWizardData("test-user-id", testData);

      expect(result.data).toEqual(testData);
      expect(mockSupabase.mocks.insert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        data: testData,
      });
    });

    it("should throw error when update fails", async () => {
      mockSupabase.mocks.maybeSingle.mockResolvedValueOnce({
        data: { id: "existing-id" },
        error: null,
      });
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        service.saveWizardData("test-user-id", testData)
      ).rejects.toThrow("Update failed");
    });

    it("should throw error when insert fails", async () => {
      mockSupabase.mocks.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      mockSupabase.mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(
        service.saveWizardData("test-user-id", testData)
      ).rejects.toThrow("Insert failed");
    });
  });

  describe("getWizardData", () => {
    it("should return wizard data when found", async () => {
      const mockData = {
        id: "wizard-id",
        user_id: "test-user-id",
        data: { goal: "weight_loss" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.getWizardData("test-user-id");

      expect(result).toEqual(mockData);
    });

    it("should return null when no data found", async () => {
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getWizardData("test-user-id");

      expect(result).toBeNull();
    });

    it("should return null and log error on query error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.mocks.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await service.getWizardData("test-user-id");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("saveWizardDataForAnonymous", () => {
    it("should save data to localStorage", async () => {
      const testData = { goal: "endurance" };

      await service.saveWizardDataForAnonymous("session-123", testData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "wizard_data_session-123",
        JSON.stringify(testData)
      );
    });
  });

  describe("getAnonymousWizardData", () => {
    it("should return parsed data from localStorage", () => {
      const testData = { goal: "flexibility" };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(testData));

      const result = service.getAnonymousWizardData("session-123");

      expect(result).toEqual(testData);
      expect(localStorage.getItem).toHaveBeenCalledWith("wizard_data_session-123");
    });

    it("should return null when no data in localStorage", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const result = service.getAnonymousWizardData("session-123");

      expect(result).toBeNull();
    });

    it("should return null when JSON parsing fails", () => {
      vi.mocked(localStorage.getItem).mockReturnValue("invalid-json{");

      const result = service.getAnonymousWizardData("session-123");

      expect(result).toBeNull();
    });
  });

  describe("clearAnonymousWizardData", () => {
    it("should remove data from localStorage", () => {
      service.clearAnonymousWizardData("session-123");

      expect(localStorage.removeItem).toHaveBeenCalledWith("wizard_data_session-123");
    });
  });
});
