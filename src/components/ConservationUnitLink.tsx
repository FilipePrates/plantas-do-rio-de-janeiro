import React from 'react';
import { Text } from 'react-native';

export interface ConservationUnitLinkProps { name: string; onOpen: (name: string) => void; href?: string }
export function ConservationUnitLink({ name, onOpen }: ConservationUnitLinkProps) {
  return <Text accessibilityRole="link" onPress={() => onOpen(name)}>{name}</Text>;
}
