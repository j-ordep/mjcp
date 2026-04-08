import { WandSparkles } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function ScheduleSetupHero() {
  return (
    <View
      style={{
        backgroundColor: "#111827",
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <WandSparkles size={20} color="#fff" />
      </View>
      <Text style={{ color: "#fff", fontSize: 21, fontWeight: "700", marginBottom: 6 }}>
        Monte a escala em duas etapas
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
        Primeiro defina o contexto da escala. Depois adicione pessoas e funcoes
        em um fluxo dedicado e mais compacto.
      </Text>
    </View>
  );
}
