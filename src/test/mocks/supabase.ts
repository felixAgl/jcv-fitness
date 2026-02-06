import { vi } from "vitest";

// Mock Supabase client factory
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockNeq = vi.fn();
  const mockGte = vi.fn();
  const mockLt = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();

  // Chain methods
  const chainMethods = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    gte: mockGte,
    lt: mockLt,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  // Make each method return the chain
  Object.values(chainMethods).forEach((method) => {
    method.mockReturnValue(chainMethods);
  });

  mockFrom.mockReturnValue(chainMethods);

  const client = {
    from: mockFrom,
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  };

  return {
    client,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      neq: mockNeq,
      gte: mockGte,
      lt: mockLt,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    },
  };
};

// Helper to set up successful query response
export const mockQuerySuccess = <T>(mock: ReturnType<typeof vi.fn>, data: T) => {
  mock.mockResolvedValue({ data, error: null });
};

// Helper to set up error response
export const mockQueryError = (mock: ReturnType<typeof vi.fn>, message: string) => {
  mock.mockResolvedValue({ data: null, error: { message } });
};

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  ...overrides,
});

// Mock profile factory
export const createMockProfile = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  full_name: "Test User",
  has_active_subscription: false,
  current_plan: null,
  subscription_end_date: null,
  has_free_plan_used: false,
  free_plan_expires_at: null,
  active_plan_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Mock subscription factory
export const createMockSubscription = (overrides = {}) => {
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  return {
    id: "test-subscription-id",
    user_id: "test-user-id",
    plan_type: "PLAN_PRO" as const,
    status: "active" as const,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    payment_provider: "mercadopago" as const,
    payment_reference: "test-payment-ref",
    amount_paid: 39900,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
};

// Mock session factory
export const createMockSession = (user = createMockUser()) => ({
  user,
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: "bearer",
});
