import React from "react";
import { View } from "react-native";

export type PhotoDragAreaProps = {
  children: React.ReactNode;
  enabled: boolean;
  index: number;
  count: number;
  onChange: (index: number) => void;
};

export function PhotoDragArea({ children }: PhotoDragAreaProps) {
  return <View>{children}</View>;
}
