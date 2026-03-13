// app/_layout.js
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import '../global.css'
export default function RootLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
            <StatusBar style="dark" />

            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: "#FFFFFF",
                    },
                    headerShadowVisible: false,
                    headerTintColor: "#2D2D2D",
                    headerTitleStyle: {
                        fontSize: 18,
                        fontWeight: "600",
                    },
                    contentStyle: {
                        backgroundColor: "#FAFAF8",
                    },
                }}
            >
                {/* Dashboard */}
                <Stack.Screen
                    name="index"
                    options={{
                        title: "Nursery Dashboard",
                    }}
                />

                {/* Dynamic Zone Page */}
                <Stack.Screen
                    name="zone/[id]"
                    options={{
                        title: "Zone",
                        headerBackTitle: "Back",
                    }}
                />
            </Stack>
        </View>
    );
}
