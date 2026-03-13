import { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    RefreshControl,
    View,
    Text,
    Image,
    Pressable,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import {
    fetchZoneDetails,
    fetchLatestPrediction,
    getUploadUrl,
} from "../../lib/api";
import { TextInput } from "react-native";
import { updateThreshold } from "../../lib/api";

export default function ZoneDetailsScreen() {
    const { id } = useLocalSearchParams();

    const [zone, setZone] = useState(null);
    const [loading, setLoading] = useState(false);
    const [runningPrediction, setRunningPrediction] = useState(false);
    const [prediction, setPrediction] = useState(null);

    const loadZone = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchZoneDetails(id);

            setZone({
                ...data.zone,
                readings: data.readings || [],
                latest_image: data.latest_image || null,
            });

            // If latest image has prediction saved, use that
            if (data.latest_image?.prediction_label) {
                setPrediction({
                    label: data.latest_image.prediction_label,
                    confidence: data.latest_image.prediction_confidence,
                    cached: true,
                });
            }
        } catch (e) {
            console.error("Failed to load zone:", e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadZone();
    }, [loadZone]);

    const runAnalysis = async () => {
        if (!zone?.latest_image) return;

        try {
            setRunningPrediction(true);
            const result = await fetchLatestPrediction(id);

            setPrediction({
                label: result.prediction_label,
                confidence: result.confidence,
                cached: result.cached,
            });

            // Reload zone to refresh cached values
            loadZone();
        } catch (e) {
            console.error("Prediction failed:", e);
        } finally {
            setRunningPrediction(false);
        }
    };

    if (!zone) {
        return (
            <View className="flex-1 items-center justify-center bg-[#FAFAF8]">
                <Text className="text-[#6E6E6E] text-base">Loading zone...</Text>
            </View>
        );
    }

    const previewUrl = zone.latest_image
        ? getUploadUrl(zone.latest_image.filename)
        : null;

    const renderPredictionBadge = () => {
        if (!prediction) {
            return (
                <Text className="text-[#A1A1A1] mt-2">
                    No prediction available. Run analysis.
                </Text>
            );
        }

        const healthy = prediction.label.toLowerCase() === "healthy";

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
                    {prediction.label} ({Math.round(prediction.confidence * 100)}%)
                </Text>
            </View>
        );
    };

    return (
        <>
            {/* Dynamic screen title */}
            <Stack.Screen
                options={{
                    title: zone.name,
                    headerBackTitle: "Back",
                }}
            />

            <ScrollView
                className="flex-1 bg-[#FAFAF8] px-5 pt-6"
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadZone} />
                }
            >
                {/* Image Preview */}
                {previewUrl ? (
                    <Image
                        source={{ uri: previewUrl }}
                        style={{
                            width: "100%",
                            height: 180,
                            borderRadius: 14,
                            marginBottom: 12,
                            resizeMode: "cover",
                        }}
                    />
                ) : (
                    <Text className="text-[#A1A1A1] mb-3">
                        No image uploaded for this zone.
                    </Text>
                )}

                {/* Prediction Badge */}
                {renderPredictionBadge()}

                {/* Run Analysis Button */}
                {zone.latest_image && (
                    <Pressable
                        onPress={runAnalysis}
                        disabled={runningPrediction}
                        className={`mt-4 py-3 rounded-xl ${
                            runningPrediction ? "bg-[#E3E3E3]" : "bg-[#6AB47C]"
                        }`}
                    >
                        <Text
                            className={`text-center font-medium ${
                                runningPrediction ? "text-[#A1A1A1]" : "text-white"
                            }`}
                        >
                            {runningPrediction ? "Running..." : "Run Analysis"}
                        </Text>
                    </Pressable>
                )}

                {/* Irrigation Mode */}
                <Text className="text-[#6E6E6E] mt-5">
                    Mode: {zone.irrigation_mode}
                </Text>

                {/* Latest Reading Card */}
                <View
                    className="bg-white p-5 rounded-2xl shadow-sm border border-[#F2F2F2] mt-4"
                    style={{ elevation: 3 }}
                >
                    <Text className="text-lg font-semibold text-[#2D2D2D] mb-2">
                        Latest Reading
                    </Text>

                    <Text className="text-[#6E6E6E]">
                        Moisture: {zone.last_reading?.moisture ?? "--"}%
                    </Text>
                    <Text className="text-[#6E6E6E]">
                        Temperature: {zone.last_reading?.temperature ?? "--"}°C
                    </Text>
                    <Text className="text-[#6E6E6E]">
                        Humidity: {zone.last_reading?.humidity ?? "--"}%
                    </Text>
                </View>
                {/* Threshold Update Section */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-[#F2F2F2] mt-6"
                      style={{ elevation: 3 }}>

                    <Text className="text-lg font-semibold text-[#2D2D2D] mb-2">
                        Moisture Threshold
                    </Text>

                    <Text className="text-[#6E6E6E] mb-3">
                        Current Threshold: {zone.threshold}%
                    </Text>

                    <TextInput
                        keyboardType="numeric"
                        placeholder="Enter new threshold"
                        value={String(zone.thresholdInput ?? "")}
                        onChangeText={(v) => setZone((prev) => ({ ...prev, thresholdInput: v }))}
                        className="border border-[#D9D9D9] rounded-xl px-4 py-3 text-[#2D2D2D]"
                    />

                    <Pressable
                        onPress={async () => {
                            try {
                                const newValue = parseInt(zone.thresholdInput);
                                if (isNaN(newValue)) {
                                    alert("Please enter a valid number.");
                                    return;
                                }

                                await updateThreshold(id, newValue);
                                await loadZone();
                                alert("Threshold updated.");
                            } catch (err) {
                                console.error(err);
                                alert("Update failed.");
                            }
                        }}
                        className="bg-[#6AB47C] py-3 rounded-xl mt-4"
                    >
                        <Text className="text-center text-white font-medium">
                            Update Threshold
                        </Text>
                    </Pressable>
                </View>


                {/* Recent Readings */}
                <View className="mt-8 mb-10">
                    <Text className="text-lg font-semibold text-[#2D2D2D] mb-3">
                        Recent Readings
                    </Text>

                    {zone.readings?.length ? (
                        zone.readings.map((r) => (
                            <View
                                key={r.id}
                                className="bg-white mb-3 rounded-xl p-4 border border-[#F2F2F2]"
                                style={{ elevation: 2 }}
                            >
                                <Text className="text-[#2D2D2D] font-medium mb-1">
                                    Moisture: {r.moisture}% | Temp: {r.temperature}°C | Humidity:{" "}
                                    {r.humidity}%
                                </Text>
                                <Text className="text-[#B0B0B0] text-xs">
                                    {new Date(r.timestamp).toLocaleString()}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-[#6E6E6E] text-base">
                            No recent readings.
                        </Text>
                    )}
                </View>
            </ScrollView>
        </>
    );
}
