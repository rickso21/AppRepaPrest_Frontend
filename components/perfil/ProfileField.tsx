import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

type KeyboardType = "default" | "email-address" | "phone-pad";

type Props = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText?: (t: string) => void;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: KeyboardType;
  editable?: boolean;
};

export default function ProfileField({
  icon,
  placeholder,
  value,
  onChangeText,
  focused = false,
  onFocus,
  onBlur,
  keyboardType = "default",
  editable = true,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        focused && styles.focused,
        !editable && styles.disabled,
      ]}
    >
      <Ionicons
        name={icon as any}
        size={19}
        color={
          !editable
            ? "rgba(255,255,255,0.3)"
            : focused
              ? "#FF6B35"
              : "rgba(255,255,255,0.5)"
        }
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]} // ← un solo style (array)
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={value}
        onChangeText={editable ? onChangeText : undefined}
        onFocus={editable ? onFocus : undefined}
        onBlur={editable ? onBlur : undefined}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        editable={editable}
      />
      {!editable && (
        <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 14,
  },
  focused: {
    borderColor: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.08)",
  },
  disabled: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.05)",
    opacity: 0.7,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14.5, color: "#fff" },
  inputDisabled: { color: "rgba(255,255,255,0.5)" },
});
