import { Camera } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Avatar, Divider, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";
import { updateProfile } from "../../services/profileService";
import { useAuthStore } from "../../stores/useAuthStore";

export default function EditProfileScreen({ navigation }) {
  const { profile, session, setProfile } = useAuthStore();

  function applyPhoneMask(raw: string) {
    if (!raw) return "";
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 7)
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
    if (clean.length > 2)
      return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    return clean;
  }

  const [name, setName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(applyPhoneMask(profile?.phone || ""));
  const [avatar, setAvatar] = useState(
    profile?.avatar_url || "https://avatar.iran.liara.run/public/46",
  );
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Erro", "O Nome não pode ficar vazio.");
      return;
    }

    const rawPhone = phone.replace(/\D/g, "");
    if (rawPhone.length > 0 && rawPhone.length < 10) {
      Alert.alert("Erro", "Telefone inválido. Digite o DDD e o número.");
      return;
    }

    setIsLoading(true);
    const updates = {
      full_name: name.trim(),
      phone: rawPhone, // Salva só os números pro sistema de SMS ler certinho depois
      avatar_url: avatar,
    };

    const { error } = await updateProfile(session?.user?.id || "", updates);
    setIsLoading(false);

    if (error) {
      Alert.alert("Erro ao salvar perfil", error);
    } else {
      // Atualiza o Zustand Store localmente para não precisar baixar de novo
      if (profile) {
        setProfile({ ...profile, ...updates });
      }
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <HeaderSecondary
        title="Editar Perfil"
        onBack={() => navigation.goBack()}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({
            ios: "padding",
            android: "padding",
            web: undefined,
          })}
          keyboardVerticalOffset={Platform.select({
            ios: 12,
            android: 8,
            web: 0,
          })}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View
              style={{ alignItems: "center", marginTop: 32, marginBottom: 24 }}
            >
              <View style={{ position: "relative" }}>
                <Avatar.Image
                  size={110}
                  source={{
                    uri:
                      avatar ||
                      "https://ui-avatars.com/api/?name=" + (name || ""),
                  }}
                />
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    backgroundColor: "#000",
                    borderRadius: 20,
                    padding: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    /* lógica para trocar foto */
                  }}
                >
                  <Camera size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  color: "#6b7280",
                  marginTop: 10,
                }}
              >
                Alterar foto
              </Text>
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  label="Nome"
                  mode="outlined"
                  activeOutlineColor="black"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={true}
                  spellCheck={true}
                  returnKeyType="next"
                  style={{ backgroundColor: "transparent" }}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  ref={emailRef}
                  label="Email"
                  mode="outlined"
                  activeOutlineColor="black"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  editable={false}
                  style={{ backgroundColor: "transparent", opacity: 0.6 }}
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
              </View>
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  ref={phoneRef}
                  label="Telefone"
                  mode="outlined"
                  activeOutlineColor="black"
                  value={phone}
                  onChangeText={(text) => setPhone(applyPhoneMask(text))}
                  keyboardType="number-pad"
                  maxLength={15} // (XX) XXXXX-XXXX
                  returnKeyType="done"
                  style={{ backgroundColor: "transparent" }}
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            <Divider style={{ marginHorizontal: 24 }} />
            <View
              style={{
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 24,
              }}
            >
              {isLoading ? (
                <View className="items-center py-3">
                  <Text style={{ color: "#888" }}>Salvando...</Text>
                </View>
              ) : (
                <DefaultButton variant="primary" onPress={handleSave}>
                  Salvar
                </DefaultButton>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
