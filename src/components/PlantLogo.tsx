import React from "react";
import { Image } from "react-native";

export function PlantLogo({ size }: { size: number }) {
  return <Image source={require("../../assets/branding/mandevilla-logo.png")}
    accessibilityLabel="Logo de Plantas do Rio: Mandevilla crassinoda"
    resizeMode="contain" style={{ width: size, height: size, flexShrink: 0 }} />;
}
