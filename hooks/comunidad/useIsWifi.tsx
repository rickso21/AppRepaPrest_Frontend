import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useIsWifi() {
  const [isWifi, setIsWifi] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const tipo = state.type;
      const detalle = (state.details as any)?.type;

      const wifi = tipo === "wifi" || detalle === "wifi";

      setIsWifi(wifi);
    });

    NetInfo.fetch().then((state) => {
      const tipo = state.type;
      const detalle = (state.details as any)?.type;
      const wifi = tipo === "wifi" || detalle === "wifi";

      setIsWifi(wifi);
    });

    return () => unsubscribe();
  }, []);

  return isWifi;
}
