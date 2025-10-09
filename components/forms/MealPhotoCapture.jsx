import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MealPhotoCapture = ({ onPhotoTaken, onClose, existingPhoto = null }) => {
    const colorScheme = useColorScheme();
    const [hasPermission, setHasPermission] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [facing, setFacing] = useState('back');
    const [flashMode, setFlashMode] = useState('off');
    const [capturedPhoto, setCapturedPhoto] = useState(existingPhoto);
    const cameraRef = useRef(null);

    const isDark = colorScheme === 'dark';
    const colors = {
        background: '#000000',
        text: '#ffffff',
        accent: '#4CAF50',
        warning: '#FF9800',
        overlay: 'rgba(0, 0, 0, 0.7)',
        buttonBackground: 'rgba(255, 255, 255, 0.2)',
    };

    React.useEffect(() => {
        getCameraPermissions();
    }, []);

    const getCameraPermissions = async () => {
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

        setHasPermission(
            cameraStatus.status === 'granted' && mediaLibraryStatus.status === 'granted'
        );
    };

    const onCameraReady = () => {
        setCameraReady(true);
    };

    const takePicture = async () => {
        if (!cameraRef.current || !cameraReady) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
                skipProcessing: false,
            });

            setCapturedPhoto(photo.uri);
        } catch (error) {
            console.error('Error taking picture:', error);
            Alert.alert('Error', 'Failed to take picture. Please try again.');
        }
    };

    const pickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setCapturedPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image from gallery.');
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => current === 'back' ? 'front' : 'back');
    };

    const toggleFlash = () => {
        setFlashMode(current => {
            switch (current) {
                case 'off': return 'on';
                case 'on': return 'auto';
                case 'auto': return 'off';
                default: return 'off';
            }
        });
    };

    const getFlashIcon = () => {
        switch (flashMode) {
            case 'on': return 'flash';
            case 'auto': return 'flash-outline';
            case 'off': return 'flash-off';
            default: return 'flash-off';
        }
    };

    const confirmPhoto = () => {
        if (capturedPhoto) {
            onPhotoTaken(capturedPhoto);
        }
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
    };

    const deletePhoto = () => {
        Alert.alert(
            'Delete Photo',
            'Are you sure you want to delete this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setCapturedPhoto(null);
                        onPhotoTaken(null); // Send null to indicate deletion
                    },
                },
            ]
        );
    };

    if (hasPermission === null) {
        return (
            <View style={[styles.container, styles.centeredContainer]}>
                <Text style={[styles.permissionText, { color: colors.text }]}>
                    Requesting permissions...
                </Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, styles.centeredContainer]}>
                <Ionicons name="camera-outline" size={80} color={colors.text} />
                <Text style={[styles.permissionTitle, { color: colors.text }]}>
                    Camera Permission Required
                </Text>
                <Text style={[styles.permissionText, { color: colors.text }]}>
                    Please grant camera and photo library permissions to capture meal photos
                </Text>
                <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: colors.accent }]}
                    onPress={getCameraPermissions}
                >
                    <Text style={styles.permissionButtonText}>Grant Permissions</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Photo preview screen
    if (capturedPhoto) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity onPress={retakePhoto} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Meal Photo
                    </Text>
                    <TouchableOpacity onPress={deletePhoto} style={styles.headerButton}>
                        <Ionicons name="trash-outline" size={24} color={colors.warning} />
                    </TouchableOpacity>
                </View>

                {/* Footer Controls */}
                <View style={[styles.previewFooter, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity
                        style={[styles.footerButton, { backgroundColor: colors.buttonBackground }]}
                        onPress={retakePhoto}
                    >
                        <Ionicons name="camera-outline" size={24} color={colors.text} />
                        <Text style={[styles.footerButtonText, { color: colors.text }]}>
                            Retake
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.footerButton, { backgroundColor: colors.accent }]}
                        onPress={confirmPhoto}
                    >
                        <Ionicons name="checkmark" size={24} color="white" />
                        <Text style={[styles.footerButtonText, { color: 'white' }]}>
                            Use Photo
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Camera screen
    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                flash={flashMode}
                ref={cameraRef}
                onCameraReady={onCameraReady}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Take Meal Photo
                    </Text>
                    <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
                        <Ionicons name={getFlashIcon()} size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Camera Frame Guide */}
                <View style={styles.cameraFrame}>
                    <View style={styles.frameGuide}>
                        <View style={[styles.frameCorner, styles.topLeft]} />
                        <View style={[styles.frameCorner, styles.topRight]} />
                        <View style={[styles.frameCorner, styles.bottomLeft]} />
                        <View style={[styles.frameCorner, styles.bottomRight]} />
                    </View>
                    <Text style={[styles.frameText, { color: colors.text }]}>
                        Frame your meal
                    </Text>
                </View>

                {/* Camera Controls */}
                <View style={[styles.cameraControls, { backgroundColor: colors.overlay }]}>
                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: colors.buttonBackground }]}
                        onPress={pickFromGallery}
                    >
                        <Ionicons name="images-outline" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, { backgroundColor: colors.accent }]}
                        onPress={takePicture}
                        disabled={!cameraReady}
                    >
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: colors.buttonBackground }]}
                        onPress={toggleCameraFacing}
                    >
                        <Ionicons name="camera-reverse-outline" size={24} color={colors.text} />
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
    centeredContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
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
    cameraFrame: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frameGuide: {
        width: 280,
        height: 200,
        position: 'relative',
    },
    frameCorner: {
        position: 'absolute',
        width: 25,
        height: 25,
        borderColor: '#4CAF50',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    frameText: {
        position: 'absolute',
        bottom: -40,
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    cameraControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        paddingVertical: 30,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    previewImage: {
        flex: 1,
        width: '100%',
        resizeMode: 'cover',
    },
    previewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        paddingVertical: 30,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 120,
        justifyContent: 'center',
    },
    footerButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
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
});

export default MealPhotoCapture;