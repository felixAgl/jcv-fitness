import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";
import { createMockUser, createMockProfile, createMockSupabaseClient } from "@/test/mocks/supabase";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  redirect: vi.fn(),
}));

// Mock useAuth
const mockUseAuth = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";

describe("SettingsPage", () => {
  const user = userEvent.setup();
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(mockSupabase.client as never);
    mockRefreshSession.mockResolvedValue(undefined);
  });

  describe("Rendering", () => {
    it("should render settings page with user info", async () => {
      const mockUser = createMockUser({ email: "john@example.com" });
      const mockProfile = createMockProfile({
        full_name: "John Doe",
        has_active_subscription: true,
        current_plan: "PLAN_PRO",
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      expect(screen.getByText("Configuración")).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre completo/i)).toHaveValue("John Doe");
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("should show subscription status", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({
        has_active_subscription: true,
        current_plan: "PLAN_PRO",
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      expect(screen.getByText("Suscripción activa")).toBeInTheDocument();
      expect(screen.getByText("PRO")).toBeInTheDocument();
    });

    it("should show 'Sin suscripcion' when no active subscription", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({
        has_active_subscription: false,
        current_plan: null,
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      expect(screen.getByText("Sin suscripción")).toBeInTheDocument();
      expect(screen.getByText("Free")).toBeInTheDocument();
    });

    it("should show pricing link when no subscription", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({
        has_active_subscription: false,
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      expect(screen.getByText("Ver planes de suscripción")).toBeInTheDocument();
    });
  });

  describe("Profile Update", () => {
    it("should save updated name", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({ full_name: "Old Name" });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      mockSupabase.mocks.eq.mockResolvedValue({ data: null, error: null });

      render(<SettingsPage />);

      const input = screen.getByLabelText(/nombre completo/i);
      await user.clear(input);
      await user.type(input, "New Name");

      const saveButton = screen.getByText("Guardar cambios");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
          full_name: "New Name",
        });
      });

      expect(mockRefreshSession).toHaveBeenCalled();
    });

    it("should show success message after save", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({ full_name: "Old Name" });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      mockSupabase.mocks.eq.mockResolvedValue({ data: null, error: null });

      render(<SettingsPage />);

      const input = screen.getByLabelText(/nombre completo/i);
      await user.clear(input);
      await user.type(input, "New Name");

      await user.click(screen.getByText("Guardar cambios"));

      await waitFor(() => {
        expect(screen.getByText("Cambios guardados correctamente")).toBeInTheDocument();
      });
    });

    it("should show error message on save failure", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({ full_name: "Old Name" });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      // Create error that will be thrown
      const updateError = new Error("Update failed");
      mockSupabase.mocks.eq.mockRejectedValue(updateError);

      render(<SettingsPage />);

      const input = screen.getByLabelText(/nombre completo/i);
      await user.clear(input);
      await user.type(input, "New Name");

      await user.click(screen.getByText("Guardar cambios"));

      await waitFor(() => {
        expect(screen.getByText("Update failed")).toBeInTheDocument();
      });
    });

    it("should disable save button when name unchanged", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({ full_name: "John Doe" });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      const saveButton = screen.getByText("Guardar cambios");
      expect(saveButton).toBeDisabled();
    });

    it("should enable save button when name changed", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({ full_name: "John Doe" });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      const input = screen.getByLabelText(/nombre completo/i);
      await user.clear(input);
      await user.type(input, "Jane Doe");

      const saveButton = screen.getByText("Guardar cambios");
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe("Member Since Date", () => {
    it("should format member since date correctly", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({
        created_at: "2024-01-15T10:30:00Z",
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      // Check for the formatted date (locale-dependent)
      expect(screen.getByText(/15 de enero de 2024/)).toBeInTheDocument();
    });
  });

  describe("Subscription End Date", () => {
    it("should show subscription end date when active", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({
        has_active_subscription: true,
        subscription_end_date: "2024-06-15T10:30:00Z",
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      expect(screen.getByText(/15 de junio de 2024/)).toBeInTheDocument();
    });
  });

  describe("Danger Zone", () => {
    it("should show contact support link", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      expect(screen.getByText("Zona de peligro")).toBeInTheDocument();
      const supportLink = screen.getByText("Contactar soporte");
      expect(supportLink).toBeInTheDocument();
      expect(supportLink.closest("a")).toHaveAttribute(
        "href",
        expect.stringContaining("wa.me")
      );
    });
  });

  describe("Navigation", () => {
    it("should have back to dashboard link", async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        refreshSession: mockRefreshSession,
      });

      render(<SettingsPage />);

      const backLink = screen.getByText("Volver al panel");
      expect(backLink.closest("a")).toHaveAttribute("href", "/dashboard");
    });
  });
});
