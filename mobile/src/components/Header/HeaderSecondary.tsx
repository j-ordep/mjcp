import { ChevronLeft } from "lucide-react-native"
import { TouchableOpacity, View } from "react-native"
import { Text } from "react-native-paper";

interface HeaderSecondaryProps {
  title: string;
  onBack: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

export default function HeaderSecondary(props: HeaderSecondaryProps) {
  return (
    <View className="flex-row items-center px-5 pt-5 pb-3">
      <TouchableOpacity onPress={props.onBack}>
        <ChevronLeft size={24} color="#000" />
      </TouchableOpacity>
      
      <Text style={{
        fontWeight: "bold",
        fontSize: 18,
        flex: 1,
        textAlign: "center",
      }}>
        {props.title}
      </Text>

      {props.rightIcon ? (
        <TouchableOpacity 
          onPress={props.onRightPress}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {props.rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} /> // Placeholder for balance
      )}
    </View>
  );
}
