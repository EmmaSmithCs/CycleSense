import { useState } from "react";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
  const [message, setMessage] = useState("No period logged yet");

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        {message}
      </Text>
      <Button
        title="Log period start"
        onPress={() => setMessage("Period logged 💖")}
      />
    </View>
  );
}
