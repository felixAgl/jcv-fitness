import { createClient } from "@/lib/supabase/client";
import type { WizardData } from "../types";

export class WizardDataService {
  private getSupabase() {
    const supabase = createClient();
    if (!supabase) {
      throw new Error("Supabase not initialized");
    }
    return supabase;
  }

  async saveWizardData(userId: string, data: Record<string, unknown>): Promise<WizardData> {
    // Check if wizard data already exists
    const { data: existing } = await this.getSupabase()
      .from("wizard_data")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing
      const { data: updated, error } = await this.getSupabase()
        .from("wizard_data")
        .update({ data })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Failed to update wizard data");
      return updated;
    }

    // Create new
    const { data: created, error } = await this.getSupabase()
      .from("wizard_data")
      .insert({ user_id: userId, data })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!created) throw new Error("Failed to save wizard data");
    return created;
  }

  async getWizardData(userId: string): Promise<WizardData | null> {
    const { data, error } = await this.getSupabase()
      .from("wizard_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async saveWizardDataForAnonymous(sessionId: string, data: Record<string, unknown>): Promise<void> {
    // Store in localStorage for anonymous users until they register
    if (typeof window !== "undefined") {
      localStorage.setItem(`wizard_data_${sessionId}`, JSON.stringify(data));
    }
  }

  getAnonymousWizardData(sessionId: string): Record<string, unknown> | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(`wizard_data_${sessionId}`);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  clearAnonymousWizardData(sessionId: string): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`wizard_data_${sessionId}`);
    }
  }
}

export const wizardDataService = new WizardDataService();
