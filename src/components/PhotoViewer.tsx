import React, { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Asset } from "expo-asset";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PlantPhoto } from "../catalog.mjs";
import { plantImages } from "../data/plant-images";
import { clampPhotoOffset, clampZoom, fitPhoto, focalOffset } from "../photoZoom.mjs";
import { palette } from "../theme";
import { PhotoCredit } from "./PhotoCredit";
import { BackIcon, ForwardIcon } from "./icons";

export function PhotoViewer({ photos, initialIndex, name, onClose }: {
  photos: PlantPhoto[];
  initialIndex: number;
  name: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 1024;
  const [index, setIndex] = useState(initialIndex);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [resetVersion, setResetVersion] = useState(0);
  const photo = photos[index];
  function navigateFromBackground(direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= photos.length) onClose();
    else setIndex(next);
  }
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} presentationStyle="fullScreen" statusBarTranslucent navigationBarTranslucent>
      <GestureHandlerRootView style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.toolbar}>
          <Text style={styles.title} numberOfLines={1}>{name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar foto ampliada" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Fechar ✕</Text>
          </Pressable>
        </View>
        <View style={styles.viewport} testID="photo-viewer-viewport" onLayout={({ nativeEvent: { layout } }) => setViewport({ width: layout.width, height: layout.height })}>
          {viewport.width > 0 && viewport.height > 0 && (
            <ZoomablePhoto
              key={`${photo.id}:${viewport.width}:${viewport.height}`}
              photo={photo}
              name={name}
              width={viewport.width}
              height={viewport.height}
              resetVersion={resetVersion}
              onBackgroundPrevious={desktop ? () => navigateFromBackground(-1) : undefined}
              onBackgroundNext={desktop ? () => navigateFromBackground(1) : undefined}
            />
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.hint}>{desktop ? "Dois toques para ampliar" : "Use dois dedos ou dois toques para ampliar"}</Text>
          {!!photo.caption && <Text style={styles.caption} numberOfLines={2}>{photo.caption}</Text>}
          <View style={styles.navigation}>
            <Pressable accessibilityRole="button" accessibilityLabel="Foto anterior" disabled={index === 0} accessibilityState={{ disabled: index === 0 }} onPress={() => setIndex(index - 1)} style={[styles.button, index === 0 && styles.disabled]}>
              <BackIcon color={palette.paper} size={26} />
            </Pressable>
            <Text style={[styles.caption, desktop && styles.desktopCounter]} testID="photo-viewer-counter">{index + 1} / {photos.length}</Text>
            {!desktop && <Pressable accessibilityRole="button" accessibilityLabel="Restaurar tamanho da foto" onPress={() => setResetVersion(v => v + 1)} style={styles.button}>
              <Text style={styles.buttonText}>Restaurar</Text>
            </Pressable>}
            <Pressable accessibilityRole="button" accessibilityLabel="Foto seguinte" disabled={index === photos.length - 1} accessibilityState={{ disabled: index === photos.length - 1 }} onPress={() => setIndex(index + 1)} style={[styles.button, index === photos.length - 1 && styles.disabled]}>
              <ForwardIcon color={palette.paper} size={26} />
            </Pressable>
          </View>
          <PhotoCredit photo={photo} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomablePhoto({ photo, name, width, height, resetVersion, onBackgroundPrevious, onBackgroundNext }: {
  photo: PlantPhoto; name: string; width: number; height: number; resetVersion: number;
  onBackgroundPrevious?: () => void; onBackgroundNext?: () => void;
}) {
  const source = plantImages[photo.fileName];
  const asset = typeof source === "number" ? Asset.fromModule(source) : !Array.isArray(source) ? source : undefined;
  const fitted = fitPhoto(asset?.width || width, asset?.height || height, width, height);
  const [failed, setFailed] = useState(false);
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focusX = useSharedValue(0);
  const focusY = useSharedValue(0);
  const pinching = useSharedValue(false);
  const singlePointer = useSharedValue(false);
  const imageWidth = fitted.width;
  const imageHeight = fitted.height;

  useEffect(() => {
    scale.value = withTiming(1, { duration: 200 });
    x.value = withTiming(0, { duration: 200 });
    y.value = withTiming(0, { duration: 200 });
  }, [resetVersion, scale, x, y]);

  function stopAnimation() {
    "worklet";
    cancelAnimation(scale);
    cancelAnimation(x);
    cancelAnimation(y);
  }

  const pinch = Gesture.Pinch()
    .onStart(event => {
      stopAnimation();
      pinching.value = true;
      singlePointer.value = false;
      startScale.value = scale.value;
      startX.value = x.value;
      startY.value = y.value;
      focusX.value = event.focalX - width / 2;
      focusY.value = event.focalY - height / 2;
    })
    .onUpdate(event => {
      const next = clampZoom(startScale.value * event.scale);
      x.value = clampPhotoOffset(focalOffset(focusX.value, event.focalX - width / 2, startX.value, startScale.value, next), imageWidth, width, next);
      y.value = clampPhotoOffset(focalOffset(focusY.value, event.focalY - height / 2, startY.value, startScale.value, next), imageHeight, height, next);
      scale.value = next;
    })
    .onFinalize(() => {
      pinching.value = false;
      singlePointer.value = false;
    });

  const pan = Gesture.Pan().minDistance(3).averageTouches(true)
    .onStart(() => {
      stopAnimation();
      singlePointer.value = false;
    })
    .onChange(event => {
      if (pinching.value || event.numberOfPointers !== 1) {
        singlePointer.value = false;
        return;
      }
      // Rebase after fingers are added/removed: Android and iOS differ in which
      // pointer drives pan translation. Never apply that transition's jump.
      if (singlePointer.value) {
        x.value = clampPhotoOffset(x.value + event.changeX, imageWidth, width, scale.value);
        y.value = clampPhotoOffset(y.value + event.changeY, imageHeight, height, scale.value);
      }
      singlePointer.value = true;
    });

  const doubleTap = Gesture.Tap().numberOfTaps(2).maxDuration(250).maxDelay(300).maxDistance(18)
    .onEnd((event, success) => {
      if (!success) return;
      stopAnimation();
      const next = scale.value > 1.01 ? 1 : 2.5;
      const targetX = clampPhotoOffset(focalOffset(event.x - width / 2, event.x - width / 2, x.value, scale.value, next), imageWidth, width, next);
      const targetY = clampPhotoOffset(focalOffset(event.y - height / 2, event.y - height / 2, y.value, scale.value, next), imageHeight, height, next);
      x.value = withTiming(targetX, { duration: 200 });
      y.value = withTiming(targetY, { duration: 200 });
      scale.value = withTiming(next, { duration: 200 });
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));
  const leftBackgroundStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.min(width, width / 2 + x.value - imageWidth * scale.value / 2)),
  }));
  const rightBackgroundStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.min(width, width / 2 - x.value - imageWidth * scale.value / 2)),
  }));

  return (
    <View style={styles.viewport}>
      <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)} touchAction="none">
      <View style={styles.gestureArea} collapsable={false}>
        {!failed && source ? (
          <Animated.Image testID="photo-viewer-image" source={source} accessibilityLabel={`${name}: ${photo.caption || "foto iNaturalist"}`} resizeMode="contain" style={[{ width: imageWidth, height: imageHeight }, imageStyle]} onError={() => setFailed(true)} />
        ) : <Text style={styles.caption}>Não foi possível abrir a foto.</Text>}
      </View>
      </GestureDetector>
      {onBackgroundPrevious && <Animated.View style={[styles.backgroundSide, { left: 0 }, leftBackgroundStyle]}>
        <Pressable testID="photo-viewer-background-left" accessibilityRole="button" accessibilityLabel="Fundo à esquerda: foto anterior ou fechar"
          onPress={onBackgroundPrevious} style={StyleSheet.absoluteFillObject} />
      </Animated.View>}
      {onBackgroundNext && <Animated.View style={[styles.backgroundSide, { right: 0 }, rightBackgroundStyle]}>
        <Pressable testID="photo-viewer-background-right" accessibilityRole="button" accessibilityLabel="Fundo à direita: foto seguinte ou fechar"
          onPress={onBackgroundNext} style={StyleSheet.absoluteFillObject} />
      </Animated.View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ink },
  toolbar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  title: { flex: 1, color: palette.paper, fontSize: 16, fontWeight: "600" },
  button: { minWidth: 48, minHeight: 48, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  buttonText: { color: palette.paper, fontSize: 16 },
  viewport: { flex: 1, overflow: "hidden" },
  gestureArea: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  footer: { paddingHorizontal: 12, paddingTop: 8 },
  navigation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  desktopCounter: { flex: 1, marginTop: 0 },
  backgroundSide: { position: "absolute", top: 0, bottom: 0, overflow: "hidden" },
  hint: { color: palette.moss, fontSize: 12, textAlign: "center" },
  caption: { color: palette.paper, fontSize: 13, textAlign: "center", marginTop: 4 },
  credit: { minHeight: 44, justifyContent: "center" },
  disabled: { opacity: 0.3 },
});
