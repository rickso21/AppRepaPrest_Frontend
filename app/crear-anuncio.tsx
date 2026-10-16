import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/services/conector/api";

const BRAND = "#940000";
const BG = "#0F0F17";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";

const PLANES = [
  {
    id: 1,
    nombre: "Básico",
    precio: 199,
    dias: 7,
    descripcion: "7 días en la comunidad",
  },
  {
    id: 2,
    nombre: "Estándar",
    precio: 349,
    dias: 15,
    descripcion: "15 días + prioridad",
  },
  {
    id: 3,
    nombre: "Premium",
    precio: 599,
    dias: 30,
    descripcion: "30 días + máxima prioridad",
  },
];

/**
 * 🔧 FIX #18: agrega https:// si el link no trae esquema ("wa.me/52...",
 * "www.mitienda.com"). Sin esquema, el anuncio se guardaba y luego AdCard
 * no podía abrirlo.
 */
function normalizarLink(raw: string): string {
  const u = raw.trim();
  if (!u) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
  return `https://${u.replace(/^\/+/, "")}`;
}

export default function CrearAnuncio() {
  const router = useRouter();

  // 🔧 FIX #18: recuerda el anuncio YA creado (pendiente de pago) y con qué
  //    contenido. Si el usuario toca "Cancelar" en el aviso de pago y vuelve a
  //    pulsar "Pagar y publicar", antes se creaba OTRO anuncio pendiente cada vez
  //    (duplicados huérfanos en la base de datos).
  const anuncioCreadoRef = useRef<{ id: number; firma: string } | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [telefono, setTelefono] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [planId, setPlanId] = useState<number>(1);
  const [enviando, setEnviando] = useState(false);

  const seleccionarImagen = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setImagen(result.assets[0].uri);
    }
  };

  const handlePublicar = async () => {
    // ============================================================
    // VALIDACIONES
    // ============================================================
    if (!titulo.trim()) {
      Alert.alert("Atención", "Ingresa un título para tu anuncio.");
      return;
    }
    if (!imagen) {
      Alert.alert("Atención", "Selecciona una imagen.");
      return;
    }

    if (!linkUrl.trim() && !telefono.trim()) {
      Alert.alert(
        "Atención",
        "Ingresa al menos un link (WhatsApp, web) o un teléfono para que los clientes puedan contactarte.",
      );
      return;
    }

    setEnviando(true);
    try {
      const linkFinal = normalizarLink(linkUrl);
      const firma = JSON.stringify([
        titulo.trim(),
        descripcion.trim(),
        linkFinal,
        telefono.trim(),
        imagen,
      ]);

      let adId: number;

      if (anuncioCreadoRef.current?.firma === firma) {
        // 🔧 Mismo contenido que el anuncio ya creado → solo se reintenta el pago
        adId = anuncioCreadoRef.current.id;
      } else {
        // ============================================================
        // 1. Crear el anuncio (status_id = 0, pendiente de pago)
        // ============================================================
        const form = new FormData();
        form.append("title", titulo.trim());
        form.append("description", descripcion.trim());
        form.append("link_url", linkFinal);
        form.append("phone", telefono.trim());
        form.append("plan_id", String(planId));
        form.append("cta_text", "Ver más");

        const ext = imagen.split(".").pop()?.toLowerCase() || "jpg";
        // @ts-ignore
        form.append("image", {
          uri: imagen,
          name: `ad_${Date.now()}.${ext}`,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });

        const { data: createData } = await api.post("/ads/create", form, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });

        if (!createData?.res) {
          Alert.alert(
            "Error",
            createData?.msg ?? "No se pudo crear el anuncio.",
          );
          return;
        }

        // 🔧 antes `createData.ad.id` lanzaba TypeError si `ad` no venía
        const nuevoId = createData?.ad?.id;
        if (!nuevoId) {
          Alert.alert(
            "Error",
            "El anuncio se creó pero no recibimos su identificador. Contacta a soporte.",
          );
          return;
        }
        adId = nuevoId;
        anuncioCreadoRef.current = { id: nuevoId, firma };
      }
      //console.log("[crear-anuncio] Anuncio creado:", adId);

      // ============================================================
      // 2. Generar preferencia de pago (MercadoPago)
      // ============================================================
      const { data: payData } = await api.post(`/ads/${adId}/pay`, {
        plan_id: planId,
      });

      //console.log("[crear-anuncio] payData:", payData);

      // ============================================================
      // 3. Si hay init_point → abrir MercadoPago
      // ============================================================
      if (payData?.res && payData?.init_point) {
        Alert.alert(
          "Pago listo",
          "Serás redirigido a MercadoPago para completar el pago. Al confirmarse, tu anuncio se activará automáticamente.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Ir a pagar",
              onPress: async () => {
                try {
                  await Linking.openURL(payData.init_point);
                  router.replace("/panel");
                } catch (err) {
                  Alert.alert(
                    "Error",
                    "No se pudo abrir MercadoPago. Intenta de nuevo.",
                  );
                }
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Pago no disponible",
          payData?.msg ??
            "No se pudo generar el pago en este momento. Contacta a soporte para activar tu anuncio.",
          [{ text: "OK", onPress: () => router.replace("/panel") }],
        );
      }
    } catch (e: any) {
      //console.error("[crear-anuncio] error:", e);
      console.error("[crear-anuncio] response:", e?.response?.data);

      const msg =
        e?.response?.data?.msg ??
        e?.response?.data?.message ??
        e?.message ??
        "Error de red";

      Alert.alert("Error", msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Text style={styles.title}>Crear anuncio</Text>
        <Text style={styles.subtitle}>
          Completa la información y elige tu plan
        </Text>

        {/* Título */}
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Pizzería Don Pepe 2x1"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={titulo}
          onChangeText={setTitulo}
          editable={!enviando}
        />

        {/* Descripción */}
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe tu promoción..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
          editable={!enviando}
        />

        {/* Link */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Link (WhatsApp, web, etc.)</Text>
          <Text style={styles.labelHint}>Opcional si pones teléfono</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="https://wa.me/5215512345678"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={linkUrl}
          onChangeText={setLinkUrl}
          autoCapitalize="none"
          editable={!enviando}
        />

        {/* Teléfono */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.labelHint}>Opcional si pones link</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="5512345678"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          editable={!enviando}
        />

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={BRAND} />
          <Text style={styles.infoText}>
            Debes ingresar al menos un link o un teléfono para que los clientes
            puedan contactarte.
          </Text>
        </View>

        {/* Imagen */}
        <Text style={styles.label}>Imagen del anuncio</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={seleccionarImagen}
          disabled={enviando}
        >
          {imagen ? (
            <Image source={{ uri: imagen }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={42}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.imageHint}>Seleccionar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Planes */}
        <Text style={styles.label}>Elige tu plan</Text>
        {PLANES.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.plan, planId === plan.id && styles.planActive]}
            onPress={() => setPlanId(plan.id)}
            disabled={enviando}
          >
            <View style={styles.planLeft}>
              <Text style={styles.planName}>{plan.nombre}</Text>
              <Text style={styles.planDesc}>{plan.descripcion}</Text>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>${plan.precio}</Text>
              <Text style={styles.planDays}>{plan.dias} días</Text>
            </View>

            {planId === plan.id && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={20} color={BRAND} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Botón */}
        <Pressable
          style={[styles.primaryBtn, enviando && { opacity: 0.6 }]}
          onPress={handlePublicar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Pagar y publicar</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 6,
  },
  labelHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    lineHeight: 17,
  },

  imagePicker: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "dashed",
    overflow: "hidden",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", gap: 8 },
  imageHint: { color: "rgba(255,255,255,0.4)", fontSize: 13 },

  plan: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  planActive: {
    borderColor: BRAND,
    backgroundColor: "rgba(255,107,53,0.08)",
  },
  planLeft: { flex: 1 },
  planName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  planDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  planRight: { alignItems: "flex-end", marginRight: 10 },
  planPrice: { color: BRAND, fontSize: 18, fontWeight: "800" },
  planDays: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  checkmark: { position: "absolute", top: 8, right: 8 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: BRAND,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
