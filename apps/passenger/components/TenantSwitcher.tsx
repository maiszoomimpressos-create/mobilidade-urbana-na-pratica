import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useBranding } from '@/contexts/BrandingContext'
import type { AvailableTenant } from '@/lib/branding'

export function TenantSwitcher() {
  const {
    branding,
    availableTenants,
    canSwitchTenant,
    hasOverride,
    switchToTenant,
    clearOverride,
  } = useBranding()

  const [modalVisible, setModalVisible] = useState(false)
  const [search, setSearch] = useState('')

  if (!canSwitchTenant || availableTenants.length < 2) {
    return null
  }

  const filteredTenants = availableTenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.linkedCity?.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (tenant: AvailableTenant) => {
    await switchToTenant(tenant.slug)
    setModalVisible(false)
    setSearch('')
  }

  const handleClearOverride = async () => {
    await clearOverride()
    setModalVisible(false)
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.switchButton,
          { backgroundColor: branding.primaryColor },
          hasOverride && styles.switchButtonOverride,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="swap-horizontal" size={18} color="#fff" />
        <Text style={styles.switchButtonText} numberOfLines={1}>
          {branding.name}
        </Text>
        {hasOverride && (
          <View style={styles.overrideBadge}>
            <Ionicons name="alert-circle" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Central</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {hasOverride && (
              <TouchableOpacity
                style={styles.clearOverrideButton}
                onPress={handleClearOverride}
              >
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.clearOverrideText}>
                  Voltar para detecção automática
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar central..."
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={filteredTenants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tenantItem,
                    item.slug === branding.slug && styles.tenantItemActive,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.tenantInfo}>
                    <Text
                      style={[
                        styles.tenantName,
                        item.slug === branding.slug && styles.tenantNameActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.linkedCity && (
                      <Text style={styles.tenantCity}>
                        {item.linkedCity.name} — {item.linkedCity.state}
                      </Text>
                    )}
                    <Text style={styles.tenantSlug}>{item.slug}</Text>
                  </View>
                  {item.slug === branding.slug && (
                    <Ionicons name="checkmark-circle" size={24} color="#ebb000" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhuma central encontrada</Text>
              }
              style={styles.list}
            />
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: 200,
  },
  switchButtonOverride: {
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  switchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  overrideBadge: {
    backgroundColor: '#ff9800',
    borderRadius: 10,
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearOverrideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  clearOverrideText: {
    color: '#666',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
  },
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  tenantItemActive: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ebb000',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  tenantNameActive: {
    color: '#ebb000',
  },
  tenantCity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  tenantSlug: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
})
