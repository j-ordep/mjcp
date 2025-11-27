import { IconButton } from "react-native-paper";

export default function ReturnButton({ onPress }: { onPress: () => void }) {
  return (
    <IconButton
      icon="arrow-left"
      iconColor="#fff"
      size={26}
      onPress={onPress}
      style={{ marginLeft: 4, backgroundColor: '#000000' }}
      accessibilityLabel="Voltar"
    />
  );
}