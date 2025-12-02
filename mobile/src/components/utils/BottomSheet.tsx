import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, View } from 'react-native';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  height?: number; // altura desejada do sheet; default 0.4 * screen
  children: React.ReactNode;
  backdropOpacity?: number; // opacidade do backdrop (0-1)
};

export default function BottomSheet({ isOpen, onClose, height, children, backdropOpacity = 0.3 }: BottomSheetProps) {
  const screenH = Dimensions.get('window').height;
  const sheetH = Math.min(height ?? Math.round(screenH * 0.4), screenH * 0.9);

  const translateY = useRef(new Animated.Value(sheetH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  // abrir/fechar com animação
  useEffect(() => {
    if (isOpen) {
      // garantir montagem para animar entrada
      setVisible(true);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: backdropOpacity, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (visible) {
      // animar saída e desmontar ao final
      Animated.parallel([
        Animated.timing(translateY, { toValue: sheetH, duration: 200, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setVisible(false);
      });
    }
  }, [isOpen, visible, sheetH, backdropOpacity, translateY, backdrop]);

  // pan para fechar
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4,
        onPanResponderMove: (_, gesture) => {
          const y = Math.max(0, gesture.dy);
          translateY.setValue(y);
          const opacity = Math.max(0, backdropOpacity - (y / sheetH) * backdropOpacity);
          backdrop.setValue(opacity);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > sheetH * 0.25 || gesture.vy > 0.75) {
            Animated.parallel([
              Animated.timing(translateY, { toValue: sheetH, duration: 180, useNativeDriver: true }),
              Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
            ]).start(() => onClose());
          } else {
            Animated.parallel([
              Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
              Animated.timing(backdrop, { toValue: backdropOpacity, duration: 180, useNativeDriver: true }),
            ]).start();
          }
        },
      }),
    [sheetH, backdropOpacity, onClose]
  );

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
      <Animated.View
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'black',
          opacity: backdrop,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetH,
          transform: [{ translateY }],
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }} />
        </View>
        {children}
      </Animated.View>
    </View>
  );
}
