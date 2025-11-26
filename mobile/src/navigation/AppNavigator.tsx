import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";

// pilha de telas - Login → Home → Detalhes → Config
const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  return (
    <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
              
        <Stack.Screen 
          name="Login"
          component={LoginScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: "Home" }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
