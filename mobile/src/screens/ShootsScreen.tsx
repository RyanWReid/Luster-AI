import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

type Shoot = {
  id: string
  name: string
  date: string
  photoCount: number
  thumbnail?: string
}

const MOCK_SHOOTS: Shoot[] = [
  {
    id: '1',
    name: '123 Main Street',
    date: '2024-01-15',
    photoCount: 12,
  },
  {
    id: '2',
    name: '456 Oak Avenue',
    date: '2024-01-14',
    photoCount: 8,
  },
]

export default function ShootsScreen() {
  const renderShoot = ({ item }: { item: Shoot }) => (
    <TouchableOpacity style={styles.shootCard}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="images" size={32} color="#9ca3af" />
          </View>
        )}
      </View>
      <View style={styles.shootInfo}>
        <Text style={styles.shootName}>{item.name}</Text>
        <Text style={styles.shootDate}>{item.date}</Text>
        <Text style={styles.photoCount}>{item.photoCount} photos</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_SHOOTS}
        renderItem={renderShoot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No shoots yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by enhancing your first photo
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    padding: 16,
  },
  shootCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  thumbnailContainer: {
    marginRight: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shootInfo: {
    flex: 1,
  },
  shootName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  shootDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  photoCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
})