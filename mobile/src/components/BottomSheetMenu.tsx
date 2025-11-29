import { Modal, View, TouchableOpacity } from "react-native";
import { Text, Divider } from "react-native-paper";
import { Edit3, Share2, Bell, LogOut, X } from "lucide-react-native";

interface BottomSheetMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onLogout: () => void;
}

export default function BottomSheetMenu({
  isOpen,
  onClose,
  onEdit,
  onLogout,
}: BottomSheetMenuProps) {
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          elevation: 8,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 }} />
        </View>
        <TouchableOpacity
          onPress={() => { onEdit(); onClose(); }}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}
        >
          <Edit3 size={20} color="#222" style={{ marginRight: 16 }} />
          <Text style={{ fontSize: 16 }}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { onClose(); alert("Compartilhar perfil"); }}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}
        >
          <Share2 size={20} color="#222" style={{ marginRight: 16 }} />
          <Text style={{ fontSize: 16 }}>Compartilhar perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { onClose(); alert("Configurações de Notificação"); }}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}
        >
          <Bell size={20} color="#222" style={{ marginRight: 16 }} />
          <Text style={{ fontSize: 16 }}>Configurações de Notificação</Text>
        </TouchableOpacity>
        <Divider style={{ marginVertical: 8 }} />
        <TouchableOpacity
          onPress={() => { onLogout(); onClose(); }}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}
        >
          <LogOut size={20} color="#d32f2f" style={{ marginRight: 16 }} />
          <Text style={{ fontSize: 16, color: "#d32f2f" }}>Sair</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
            marginTop: 12,
            paddingVertical: 14,
          }}
        >
          <X size={20} color="#222" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16 }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}