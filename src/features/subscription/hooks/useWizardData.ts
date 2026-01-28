"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { wizardDataService } from "../services/wizard-data-service";
import type { WizardData } from "../types";

export function useWizardData() {
  const { user } = useAuth();
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = typeof window !== "undefined"
    ? localStorage.getItem("wizard_session_id") || createSessionId()
    : "";

  const loadWizardData = useCallback(async () => {
    try {
      setIsLoading(true);

      if (user) {
        const data = await wizardDataService.getWizardData(user.id);
        setWizardData(data);
      } else {
        // Load anonymous data
        const anonymousData = wizardDataService.getAnonymousWizardData(sessionId);
        if (anonymousData) {
          setWizardData({
            id: "anonymous",
            user_id: "anonymous",
            data: anonymousData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading wizard data");
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionId]);

  useEffect(() => {
    loadWizardData();
  }, [loadWizardData]);

  const saveData = async (data: Record<string, unknown>) => {
    try {
      if (user) {
        const saved = await wizardDataService.saveWizardData(user.id, data);
        setWizardData(saved);
        return saved;
      } else {
        // Save for anonymous user
        wizardDataService.saveWizardDataForAnonymous(sessionId, data);
        setWizardData({
          id: "anonymous",
          user_id: "anonymous",
          data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving wizard data");
      throw err;
    }
  };

  const migrateAnonymousData = async () => {
    if (!user) return;

    const anonymousData = wizardDataService.getAnonymousWizardData(sessionId);
    if (anonymousData) {
      await wizardDataService.saveWizardData(user.id, anonymousData);
      wizardDataService.clearAnonymousWizardData(sessionId);
      await loadWizardData();
    }
  };

  return {
    wizardData,
    isLoading,
    error,
    saveData,
    migrateAnonymousData,
    refresh: loadWizardData,
  };
}

function createSessionId(): string {
  const id = `wizard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  if (typeof window !== "undefined") {
    localStorage.setItem("wizard_session_id", id);
  }
  return id;
}
