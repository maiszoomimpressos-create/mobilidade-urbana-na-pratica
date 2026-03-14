import { useState, useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useBranding } from '@/contexts/BrandingContext';

export default function PerfilScreen() {
  const { branding } = useBranding();
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAnonymous(data.session?.user?.is_anonymous ?? false);
    };
    check();
  }, []);

  const handleSair = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const handleVincularConta = () => {
    router.push('/(auth)/vincular-conta');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#22c55e' }]}>
      <Text style={[styles.title, { color: '#fff' }]}>Perfil</Text>
      <Text style={[styles.hint, { color: 'rgba(255,255,255,0.9)' }]}>Configurações e dados da sua conta.</Text>
      {isAnonymous && isSupabaseConfigured && (
        <Pressable
          style={({ pressed }) => [
            styles.buttonLink,
            { backgroundColor: branding.primaryColor },
            pressed && styles.buttonPressed,
          ]}
          onPress={handleVincularConta}
        >
          <Text style={styles.buttonLinkText}>Vincular conta (e-mail e senha)</Text>
        </Pressable>
      )}
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleSair}>
        <Text style={styles.buttonText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.8,
  },
  buttonLink: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonLinkText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonPressed: { opacity: 0.9 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
