import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderSecondary from '../../components/Header/HeaderSecondary';
import { useNavigation } from '@react-navigation/native';

export default function CreateScheduleScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <HeaderSecondary title="Criar Escala" onBack={() => navigation.goBack()} />
      <View className="flex-1 items-center justify-center px-10">
        <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 20 }}>
          Formulário de Nova Escala
        </Text>
        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 40 }}>
          (Implementação do formulário completo em breve)
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ borderRadius: 8 }}>
          Voltar
        </Button>
      </View>
    </SafeAreaView>
  );
}
