import React, { JSX } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  userName: string;
  subtitle: string;
  onPressAvatar?: () => void; // abre "Mi cuenta" al tocar el círculo
};

export default function AppHeader({ userName, subtitle, onPressAvatar }: Props): JSX.Element {
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.header}>
      <Pressable style={styles.avatar} onPress={onPressAvatar} hitSlop={6}>
        <Text style={styles.avatarText}>{initials}</Text>
      </Pressable>

      <View style={styles.headerContent}>
        <Text style={styles.userName} numberOfLines={1}>
          {userName}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Pressable style={styles.bellButton} hitSlop={8}>
        <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.85)" />
        <View style={styles.badge} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.35)',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerContent: { flex: 1, marginLeft: 13 },
  userName: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  subtitle: { fontSize: 11.5, color: '#FF6B35', fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    borderWidth: 1.5,
    borderColor: '#0F0F17',
  },
});