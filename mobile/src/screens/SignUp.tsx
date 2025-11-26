import { View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function SignUp({ navigation }) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold mb-8">Cadastro</Text>
      {/* Campos de cadastro aqui */}
      <Button mode="outlined" onPress={() => navigation.goBack()}>
        Fazer login
      </Button>
    </View>
  );
}