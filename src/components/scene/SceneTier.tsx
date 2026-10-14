"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { detectSceneTier, type SceneTier } from "@/lib/capability";

let cached: SceneTier | null = null;
const getTier = () => (cached ??= detectSceneTier());
const noopSubscribe = () => () => {};

type Ctx = { tier: SceneTier | null; downgrade: () => void };
const SceneTierContext = createContext<Ctx>({ tier: null, downgrade: () => {} });

/**
 * Detects once on the client whether to run WebGL. Server render and first hydration
 * pass see `null`, so markup matches; the client then resolves to none/low/high.
 */
export function SceneTierProvider({ children }: { children: ReactNode }) {
  const detected = useSyncExternalStore(noopSubscribe, getTier, () => null);
  const [lost, setLost] = useState(false);
  const downgrade = useCallback(() => setLost(true), []);
  const value = useMemo<Ctx>(() => ({ tier: lost ? "none" : detected, downgrade }), [lost, detected, downgrade]);
  return <SceneTierContext.Provider value={value}>{children}</SceneTierContext.Provider>;
}

export const useSceneTier = () => useContext(SceneTierContext);
