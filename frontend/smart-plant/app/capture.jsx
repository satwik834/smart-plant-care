// app/capture.jsx
import { useState } from "react";
import {
    View,
    Text,
    Pressable,
    Image,
    ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { predictImage } from "../lib/api";

export default function CaptureScreen() {
    const [imageUri, setImageUri] = useState(null);
    const [predicting, setPredicting] = useState(false);
    const [result, setResult] = useState(null);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            alert("Camera permission needed.");
            return;
        }

        const img = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            base64: false,
        });

        if (!img.canceled) setImageUri(img.assets[0].uri);
    };

    const chooseFromGallery = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            quality: 0.8,
            base64: false,
        });

        if (!res.canceled) setImageUri(res.assets[0].uri);
    };

    const runAnalysis = async () => {
        if (!imageUri) return;

        setPredicting(true);
        setResult(null);

        try {
            const form = new FormData();
            form.append("image", {
                uri: imageUri,
                name: "photo.jpg",
                type: "image/jpeg",
            });

            const data = await predictImage(form);

            const pred = data.prediction; // backend returns dict or string

            setResult({
                label: pred.label ?? pred,
                confidence: pred.confidence ?? pred.confidence ?? 0,
            });

        } catch (e) {
            console.error("Prediction error:", e);
            alert("Prediction failed. Check backend logs.");
        } finally {
            setPredicting(false);
        }
    };

    const renderResult = () => {
        if (!result) return null;

        const healthy = result.label.toLowerCase() === "healthy";

        return (
            <View
                className={`px-4 py-2 rounded-xl mt-4 ${
                    healthy ? "bg-[#D4F5DD]" : "bg-[#F8D4D4]"
                }`}
            >
                <Text
                    className={`text-base font-semibold ${
                        healthy ? "text-[#2D7A3D]" : "text-[#9C2F2F]"
                    }`}
                >
                    {result.label} ({Math.round(result.confidence * 100)}%)
                </Text>
            </View>
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Analyze Photo",
                    headerBackTitle: "Back",
                }}
            />

            <View className="flex-1 bg-[#FAFAF8] px-5 pt-6">
                {!imageUri && (
                    <>
                        <Pressable
                            onPress={takePhoto}
                            className="bg-[#6AB47C] py-4 rounded-xl mb-4"
                        >
                            <Text className="text-center text-white font-medium">
                                Take Photo
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={chooseFromGallery}
                            className="bg-[#E3E3E3] py-4 rounded-xl"
                        >
                            <Text className="text-center text-[#2D2D2D] font-medium">
                                Choose From Gallery
                            </Text>
                        </Pressable>
                    </>
                )}

                {imageUri && (
                    <>
                        <Image
                            source={{ uri: imageUri }}
                            style={{
                                width: "100%",
                                height: 260,
                                borderRadius: 14,
                                marginBottom: 12,
                                resizeMode: "cover",
                            }}
                        />

                        <Pressable
                            onPress={runAnalysis}
                            disabled={predicting}
                            className={`py-4 rounded-xl ${
                                predicting ? "bg-[#E3E3E3]" : "bg-[#6AB47C]"
                            }`}
                        >
                            {predicting ? (
                                <ActivityIndicator color="#2D2D2D" />
                            ) : (
                                <Text className="text-center text-white font-medium">
                                    Run Analysis
                                </Text>
                            )}
                        </Pressable>

                        {renderResult()}

                        <Pressable
                            onPress={() => {
                                setImageUri(null);
                                setResult(null);
                            }}
                            className="mt-4 py-3 rounded-xl bg-[#E3E3E3]"
                        >
                            <Text className="text-center text-[#2D2D2D] font-medium">
                                Choose Another Image
                            </Text>
                        </Pressable>
                    </>
                )}
            </View>
        </>
    );
}
