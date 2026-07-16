import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NewPurchaseScreen() {
  return (
    <View>
      <Stack.Screen options={{ title: "Purchase check" }} />
      <Text>Financial coaching service is not configured.</Text>
    </View>
  );
}
