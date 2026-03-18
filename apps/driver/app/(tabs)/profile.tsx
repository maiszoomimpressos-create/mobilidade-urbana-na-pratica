import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]
  const { driver, user, signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true)
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Text style={styles.avatarText}>
            {driver?.name?.charAt(0)?.toUpperCase() || '👤'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {driver?.name || 'Motorista'}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {user?.email || ''}
        </Text>

        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={[styles.ratingText, { color: colors.text }]}>
            {driver?.rating?.toFixed(1) || '5.0'}
          </Text>
          <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
            ({driver?.totalRides || 0} corridas)
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: driver?.isApproved
                ? colors.success + '20'
                : colors.warning + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: driver?.isApproved ? colors.success : colors.warning },
            ]}
          >
            {driver?.isApproved ? '✓ Aprovado' : '⏳ Em análise'}
          </Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Veículo
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Modelo
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {driver?.vehicleModel || 'Não informado'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Placa
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {driver?.vehiclePlate || 'Não informado'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Cor
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {driver?.vehicleColor || 'Não informado'}
          </Text>
        </View>
      </View>

      {/* Documents */}
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Documentos
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            CPF
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {driver?.cpf ? '***.***.***-**' : 'Não informado'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            CNH
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {driver?.cnh ? '***********' : 'Não informado'}
          </Text>
        </View>
      </View>

      {/* Contact */}
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Contato
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Telefone
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {driver?.phone || 'Não informado'}
          </Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Atualizar documentos
          </Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={styles.menuIcon}>🚗</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Atualizar veículo
          </Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Notificações
          </Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}
        >
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>
            Ajuda
          </Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color={colors.error} />
        ) : (
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Sair da conta
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Mai Drive Motorista v1.0.0
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  ratingStar: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingLabel: {
    fontSize: 14,
  },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    margin: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 24,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
  },
})
