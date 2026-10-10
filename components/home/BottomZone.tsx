import { StyleSheet, Text, View } from "react-native";
import ConnectionButton from "../buttons/ConnectionButton";
import MicrofonoButton from "../buttons/MicrofonoButton";
import PanicButton from "../buttons/PanicButton";

type Props = {
  conectado: boolean;
  cargandoConexion: boolean;
  cargandoPanico: boolean;
  panicoActivo: boolean;
  onToggleConexion: () => void;
  onTogglePanico: () => void;
  onMicChange?: (activo: boolean) => void;
};

export default function BottomZone({
  conectado,
  cargandoConexion,
  cargandoPanico,
  panicoActivo,
  onToggleConexion,
  onTogglePanico,
  onMicChange,
}: Props) {
  return (
    <View style={styles.bottomZone}>
      <View style={styles.buttonRow}>
        <ConnectionButton
          conectado={conectado}
          cargando={cargandoConexion}
          disabled={cargandoPanico}
          onPress={onToggleConexion}
        />
        <MicrofonoButton disabled={!conectado} onChange={onMicChange} />
      </View>

      <PanicButton
        activo={panicoActivo}
        cargando={cargandoPanico}
        disabled={!conectado}
        onPress={onTogglePanico}
      />

      {!conectado && (
        <Text style={styles.ayudaTexto}>
          Conéctate para ver a tu agrupación ¡buen camino!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomZone: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  buttonRow: { flexDirection: "row", gap: 10 },
  ayudaTexto: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
  },
});
