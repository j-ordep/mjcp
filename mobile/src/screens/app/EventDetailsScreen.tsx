import { ScrollView, View } from "react-native";
import { Divider, Text } from "react-native-paper";
import CardButton from "../../components/button/CardButton";
import { SafeAreaView } from 'react-native-safe-area-context'
import ReturnButton from "../../components/button/ReturnButton";

export default function EventDetailsScreen({ route, navigation }) {
  const { title, date, role } = route.params || {};

  function handleConfirm() {
    alert("Presença confirmada!");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 }} edges={['top', 'left', 'right']}>
      <View className="flex-1 bg-white">

        <View className="p-4">
          <ReturnButton onPress={handleConfirm}/>
        </View>

        <ScrollView className="px-4">
          <Text className="text-3xl font-bold mb-4">{title}</Text>

          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-1">Data e Hora</Text>
            <Text className="text-xl text-blue-600 font-semibold">{date}</Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-1">Sua Função</Text>
            <Text className="text-lg font-medium">{role || "Não definida"}</Text>
          </View>

          <Divider className="my-4" />

          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-1">Local</Text>
            <Text className="text-lg">Templo Central</Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-1">Descrição</Text>
            <Text className="text-base text-gray-700">
              Ensaio geral da banda para o culto de domingo. Comparecer com 30 minutos de antecedência.
            </Text>
          </View>

          <View className="flex-row gap-2 mt-8 mb-6">
            <View className="flex-1">
              <CardButton variant="outline" onPress={() => navigation.goBack()}>
                Voltar
              </CardButton>
            </View>
            <View className="flex-1">
              <CardButton variant="secondary" onPress={() => { }}>
                Confirmar Presença
              </CardButton>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}