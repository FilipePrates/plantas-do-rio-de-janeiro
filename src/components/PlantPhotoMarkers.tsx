import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { markerLabels, markerPaths } from "../catalog.mjs";
import type { PhotoMarker } from "../catalog.mjs";
import { palette } from "../theme";

export function PlantPhotoMarkers({ markers }: { markers: PhotoMarker[] }) {
  return (
    <View style={styles.markers}>
      {markers
        .filter(
          (marker): marker is Exclude<PhotoMarker, "unknown"> =>
            marker !== "unknown",
        )
        .map((marker) => (
          <PlantPhotoMarker key={marker} marker={marker} />
        ))}
    </View>
  );
}
export function PlantPhotoMarker({
  marker,
}: {
  marker: Exclude<PhotoMarker, "unknown">;
}) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={markerLabels[marker]}
      style={styles.badge}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Path
          d={markerPaths[marker]}
          fill="none"
          stroke={palette.paper}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({
  markers: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    maxWidth: "53%",
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(36,49,39,0.72)",
  },
});
