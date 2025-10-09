import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BarcodeScanner = ({ onFoodFound, onClose, onError }) => {
    const colorScheme = useColorScheme();
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [torchEnabled, setTorchEnabled] = useState(false);

    const isDark = colorScheme === 'dark';
    const colors = {
        background: isDark ? '#000000' : '#000000', // Camera overlay should be dark
        text: '#ffffff',
        accent: '#4CAF50',
        warning: '#FF9800',
        overlay: 'rgba(0, 0, 0, 0.7)',
    };

    useEffect(() => {
        getCameraPermissions();
    }, []);

    const getCameraPermissions = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned) return;

        setScanned(true);
        setIsLoading(true);

        try {
            // Look up food information using barcode
            const foodInfo = await lookupBarcode(data);

            if (foodInfo) {
                onFoodFound(foodInfo);
            } else {
                Alert.alert(
                    'Product Not Found',
                    'Could not find nutrition information for this product. Try searching manually.',
                    [
                        { text: 'Scan Again', onPress: () => setScanned(false) },
                        { text: 'Cancel', onPress: onClose },
                    ]
                );
            }
        } catch (error) {
            console.error('Barcode lookup error:', error);
            Alert.alert(
                'Lookup Failed',
                'Failed to lookup product information. Please try again or search manually.',
                [
                    { text: 'Scan Again', onPress: () => setScanned(false) },
                    { text: 'Cancel', onPress: onClose },
                ]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Mock barcode lookup function - in a real app, this would call a food database API
    const lookupBarcode = async (barcode) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock database of common barcodes
        const mockDatabase = {
            '012000161155': {
                name: 'Coca-Cola Classic 12oz Can',
                brand: 'Coca-Cola',
                nutrients: {
                    calories: 140,
                    protein: 0,
                    carbs: 39,
                    fat: 0,
                    fiber: 0,
                    sugar: 39,
                    sodium: 45,
                },
                servingSize: 355, // ml
                servingUnit: 'ml',
            },
            '041130002120': {
                name: 'Cheerios Original',
                brand: 'General Mills',
                nutrients: {
                    calories: 110,
                    protein: 3,
                    carbs: 22,
                    fat: 2,
                    fiber: 3,
                    sugar: 2,
                    sodium: 160,
                },
                servingSize: 28, // grams
                servingUnit: 'g',
            },
            '051000012043': {
                name: 'Oreo Original Cookies',
                brand: 'Nabisco',
                nutrients: {
                    calories: 160,
                    protein: 2,
                    carbs: 25,
                    fat: 7,
                    fiber: 1,
                    sugar: 14,
                    sodium: 135,
                },
                servingSize: 34, // grams (3 cookies)
                servingUnit: 'g',
            }
        };

        // Check if barcode exists in mock database
        if (mockDatabase[barcode]) {
            return mockDatabase[barcode];
        }

        // In a real app, you would call APIs like:
        // - Open Food Facts API
        // - USDA FoodData Central API
        // - Edamam Food Database API
        // - FatSecret API

        // For now, return null to simulate "not found"
        return null;
    };

    const toggleTorch = () => {
        setTorchEnabled(!torchEnabled);
    };

    if (hasPermission === null) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Requesting camera permission...
                </Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={80} color={colors.text} />
                    <Text style={[styles.permissionTitle, { color: colors.text }]}>
                        Camera Access Required
                    </Text>
                    <Text style={[styles.permissionText, { color: colors.text }]}>
                        Please grant camera permission to scan product barcodes
                    </Text>
                    <TouchableOpacity
                        style={[styles.permissionButton, { backgroundColor: colors.accent }]}
                        onPress={getCameraPermissions}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                }}
                enableTorch={torchEnabled}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Scan Barcode
                    </Text>
                    <TouchableOpacity onPress={toggleTorch} style={styles.headerButton}>
                        <Ionicons
                            name={torchEnabled ? "flash" : "flash-outline"}
                            size={24}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>

                {/* Scanning Frame */}
                <View style={styles.scanFrame}>
                    <View style={styles.scanArea}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />

                        {/* Scanning line animation would go here */}
                        <View style={styles.scanLine} />
                    </View>
                </View>

                {/* Instructions */}
                <View style={[styles.instructions, { backgroundColor: colors.overlay }]}>
                    <Text style={[styles.instructionTitle, { color: colors.text }]}>
                        {isLoading ? 'Looking up product...' : 'Position barcode within frame'}
                    </Text>
                    <Text style={[styles.instructionText, { color: colors.text }]}>
                        {isLoading
                            ? 'Please wait while we find nutrition information'
                            : 'Line up the barcode with the frame above'
                        }
                    </Text>

                    {isLoading && (
                        <ActivityIndicator
                            size="small"
                            color={colors.accent}
                            style={styles.loadingIndicator}
                        />
                    )}
                </View>

                {/* Manual Entry Button */}
                <View style={[styles.footer, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity
                        style={styles.manualButton}
                        onPress={onClose}
                        disabled={isLoading}
                    >
                        <Text style={[styles.manualButtonText, { color: colors.text }]}>
                            Enter Manually Instead
                        </Text>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scanFrame: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 250,
        height: 150,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#4CAF50',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    scanLine: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#4CAF50',
        opacity: 0.8,
    },
    instructions: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8,
    },
    loadingIndicator: {
        marginTop: 12,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    manualButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    manualButtonText: {
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
        lineHeight: 24,
        marginBottom: 30,
    },
    permissionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default BarcodeScanner;