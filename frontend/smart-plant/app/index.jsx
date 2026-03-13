import { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    RefreshControl,
    Pressable,
    View,
    Text,
    Image,
    Switch,
} from "react-native";
import { fetchZones, triggerIrrigation, updateMode, getUploadUrl } from "../lib/api";
import { Stack, useRouter } from "expo-router";

export default function DashboardScreen() {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingMode, setUpdatingMode] = useState(null);
    const router = useRouter();

    // Add header with camera button
    const Header = (
        <Stack.Screen
            options={{
                title: "Nursery Dashboard",
                headerRight: () => (
                    <Pressable
                        onPress={() => router.push("/capture")}
                        style={{ padding: 8, marginRight: 4 }}
                    >
                        <Text style={{ fontSize: 20, fontWeight: "600", color: "#2D2D2D" }}>
                            📸
                        </Text>
                    </Pressable>
                ),
            }}
        />
    );

    // Fetch all zones
    const loadZones = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchZones();
            setZones(data);
        } catch (e) {
            console.error("Failed to fetch zones:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadZones();
        const interval = setInterval(loadZones, 8000);
        return () => clearInterval(interval);
    }, [loadZones]);

    const handleIrrigation = async (id, action) => {
        try {
            await triggerIrrigation(id, action);
            await loadZones();
        } catch (e) {
            console.error(e);
        }
    };

    const handleModeToggle = async (zone) => {
        const newMode = zone.irrigation_mode === "auto" ? "manual" : "auto";
        setUpdatingMode(zone.id);
        try {
            await updateMode(zone.id, newMode);
            await loadZones();
        } catch (e) {
            console.error("Failed to update mode:", e);
        } finally {
            setUpdatingMode(null);
        }
    };

    const predictionBadge = (zone) => {
        const img = zone.latest_image;

        if (!img || !img.prediction_label) {
            return (
                <View className="mt-2">
                    <Text className="text-[#A1A1A1] text-sm">Health: Pending analysis</Text>
                </View>
            );
        }

        const healthy = img.prediction_label.toLowerCase() === "healthy";

        return (
            <View
                className={`px-3 py-1 rounded-lg self-start mt-2 ${
                    healthy ? "bg-[#D4F5DD]" : "bg-[#F8D4D4]"
                }`}
            >
                <Text
                    className={`text-sm font-medium ${
                        healthy ? "text-[#2D7A3D]" : "text-[#9C2F2F]"
                    }`}
                >
                    {img.prediction_label} ({Math.round(img.prediction_confidence * 100)}%)
                </Text>
            </View>
        );
    };

    return (
        <>
            {Header}

            <ScrollView
                className="flex-1 bg-[#FAFAF8] px-5 pt-6"
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadZones} />}
            >
                {zones.map((zone) => {
                    const img = zone.latest_image;
                    const previewUrl = img ? getUploadUrl(img.filename) : null;

                    return (
                        <Pressable
                            key={zone.id}
                            onPress={() => router.push(`/zone/${zone.id}`)}
                            className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-[#F2F2F2]"
                            style={{ elevation: 3 }}
                        >
                            {/* Top row: Title + Mode Switch */}
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-semibold text-[#2D2D2D]">
                                    {zone.name}
                                </Text>

                                <View className="flex-row items-center">
                                    <Text className="text-[#6E6E6E] mr-2">
                                        {zone.irrigation_mode === "auto" ? "Auto" : "Manual"}
                                    </Text>
                                    <Switch
                                        value={zone.irrigation_mode === "auto"}
                                        onValueChange={() => handleModeToggle(zone)}
                                        trackColor={{ false: "#C6C6C6", true: "#A0E7B2" }}
                                        thumbColor={
                                            zone.irrigation_mode === "auto"
                                                ? "#6AB47C"
                                                : "#f4f3f4"
                                        }
                                        disabled={updatingMode === zone.id}
                                    />
                                </View>
                            </View>

                            {/* Small Image Preview */}
                            {previewUrl && (
                                <Image
                                    source={{ uri: previewUrl }}
                                    style={{
                                        width: "100%",
                                        height: 120,
                                        borderRadius: 12,
                                        resizeMode: "cover",
                                        marginBottom: 10,
                                    }}
                                />
                            )}

                            {/* Prediction Badge */}
                            {predictionBadge(zone)}

                            {/* Sensor Readings */}
                            <Text className="text-[#6E6E6E] mt-2">
                                Moisture: {zone.last_reading?.moisture ?? "--"}%
                            </Text>
                            <Text className="text-[#6E6E6E]">
                                Temperature: {zone.last_reading?.temperature ?? "--"}°C
                            </Text>
                            <Text className="text-[#6E6E6E]">
                                Humidity: {zone.last_reading?.humidity ?? "--"}%
                            </Text>

                            {/* Irrigation Status */}
                            <Text
                                className={`text-base font-medium mt-4 ${
                                    zone.irrigation_on ? "text-[#6AB47C]" : "text-[#C15E5E]"
                                }`}
                            >
                                {zone.irrigation_on ? "Irrigation: ON" : "Irrigation: OFF"}
                            </Text>

                            {/* Start / Stop Buttons */}
                            <View className="flex-row justify-between mt-5">
                                <Pressable
                                    onPress={() => handleIrrigation(zone.id, "start")}
                                    className={`flex-1 mr-2 py-3 rounded-xl ${
                                        zone.irrigation_mode === "manual"
                                            ? "bg-[#6AB47C]"
                                            : "bg-[#E3E3E3]"
                                    }`}
                                    disabled={zone.irrigation_mode !== "manual"}
                                >
                                    <Text
                                        className={`text-center font-medium ${
                                            zone.irrigation_mode === "manual"
                                                ? "text-white"
                                                : "text-[#A1A1A1]"
                                        }`}
                                    >
                                        Start
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => handleIrrigation(zone.id, "stop")}
                                    className={`flex-1 ml-2 py-3 rounded-xl ${
                                        zone.irrigation_mode === "manual"
                                            ? "bg-[#E3E3E3]"
                                            : "bg-[#F5F5F5]"
                                    }`}
                                    disabled={zone.irrigation_mode !== "manual"}
                                >
                                    <Text
                                        className={`text-center font-medium ${
                                            zone.irrigation_mode === "manual"
                                                ? "text-[#2D2D2D]"
                                                : "text-[#A1A1A1]"
                                        }`}
                                    >
                                        Stop
                                    </Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </>
    );
}
