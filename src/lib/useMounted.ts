import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Custom hook to safely detect client-side mounting without triggering
 * cascading renders or ESLint react-hooks/set-state-in-effect warnings.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
