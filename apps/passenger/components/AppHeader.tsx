import React, { useState } from 'react'
import { View, Text, StyleSheet, Image, Pressable, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { useBranding } from '@/contexts/BrandingContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import Ionicons from '@expo/vector-icons/Ionicons'

function abbreviateCentralName(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function AppHeader() {
  const { branding } = useBranding()
  const router = useRouter()
  const [userImage, setUserImage] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const url = data.user?.user_metadata?.avatar_url ?? data.user?.user_metadata?.picture
      if (url) setUserImage(url)
    })
  }, [])

  const abbr = abbreviateCentralName(branding.name)

  const closeMenu = () => setMenuOpen(false)

  const handlePerfil = () => {
    closeMenu()
    router.push('/(tabs)/perfil')
  }

  const handleSair = async () => {
    closeMenu()
    if (isSupabaseConfigured) await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <>
      <View style={styles.bar}>
        <View style={styles.left}>
          {branding.logo ? (
            <Image source={{ uri: branding.logo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: branding.primaryColor }]}>
              <Text style={styles.logoLetter}>{branding.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.abbr}>{abbr}</Text>
        </View>

        <View style={styles.right}>
          <Pressable style={styles.avatarWrap} onPress={handlePerfil}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            )}
          </Pressable>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Pressable style={styles.menuItem} onPress={handlePerfil}>
              <Ionicons name="person-outline" size={20} color="#fff" />
              <Text style={styles.menuText}>Perfil</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleSair}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.menuText}>Sair</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050505',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  abbr: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    padding: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    padding: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menuCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    minWidth: 180,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
})
