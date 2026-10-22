import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useBackgroundSync(
  conectado: boolean,
  onForeground: () => void,
) {
  const cbRef = useRef(onForeground);
  cbRef.current = onForeground;

  useEffect(() => {
    if (!conectado) return;
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") cbRef.current();
    });
    return () => sub.remove();
  }, [conectado]);
}
