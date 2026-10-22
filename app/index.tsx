import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import WelcomeScreen from "@/components/WelcomeScreen";
import { authService } from "@/services/auth/AuthService";
import { getRouteByRole } from "@/services/auth/roleRouting";

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; postId?: string }>();

  const [booting, setBooting] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const token = await authService.getToken();
        const user = await authService.getUserData();
        if (!active) return;

        if (token && user) {
          setAuthed(true);
          const target = getRouteByRole(user);

          // ✅ Usamos un setTimeout para evitar el error de "component hasn't mounted"
          //    Esto le da 100ms a Expo Router para montar el Stack de navegación.
          setTimeout(() => {
            if (!active) return;

            if (params?.tab) {
              router.replace({
                pathname: target as any,
                params: {
                  tab: params.tab,
                  postId: params.postId,
                },
              });
            } else {
              router.replace(target);
            }
          }, 100);
        } else {
          setAuthed(false);
        }
      } catch (e) {
        console.log("[Index bootstrap] error:", e);
        setAuthed(false);
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router, params.tab, params.postId]);

  if (booting || authed) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#940000" />
      </View>
    );
  }

  return <WelcomeScreen />;
}
