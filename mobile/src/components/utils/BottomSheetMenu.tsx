import { Bell, Edit3, LogOut, Share2, X } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Divider, Text } from "react-native-paper";
import ModalBottomSheet from "./BottomSheet";

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
  return (
    <ModalBottomSheet isOpen={isOpen} onClose={onClose} height={320} backdropOpacity={0.3}>
      <TouchableOpacity
        onPress={() => { onEdit(); onClose(); }}
        className="flex-row items-center py-4"
      >
        <Edit3 size={20} color="#222" style={{ marginRight: 16 }} />
        <Text style={{ fontSize: 16 }}>Editar Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { onClose(); alert("Compartilhar perfil") }}
        className="flex-row items-center py-4"
      >
        <Share2 size={20} color="#222" style={{ marginRight: 16 }} />
        <Text style={{ fontSize: 16 }}>Compartilhar perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { onClose(); alert("Configurações de Notificação") }}
        className="flex-row items-center py-4"
      >
        <Bell size={20} color="#222" style={{ marginRight: 16 }} />
        <Text style={{ fontSize: 16 }}>Configurações de Notificação</Text>
      </TouchableOpacity>

      <Divider style={{ marginVertical: 8 }} />

      <TouchableOpacity
        onPress={() => { onLogout(); onClose(); }}
        className="flex-row items-center py-3"
      >
        <LogOut size={20} color="#d32f2f" style={{ marginRight: 16 }} />
        <Text style={{ fontSize: 16, color: "#d32f2f" }}>Sair</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} className="flex-row items-center justify-center bg-gray-100 rounded-xl mt-5 py-4">
        <X size={20} color="#222" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 16 }}>Cancelar</Text>
      </TouchableOpacity>
    </ModalBottomSheet>
  );
}