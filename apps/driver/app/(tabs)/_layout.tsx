import { Tabs } from 'expo-router'
import { useColorScheme, Text } from 'react-native'
import { Colors } from '@/constants/Colors'

function TabBarIcon({ name, size = 22 }: { name: string; color: string; size?: number }) {
  const icons: Record<string, string> = {
    home: '🏠',
    car: '🚗',
    history: '📋',
    wallet: '💰',
    user: '👤',
  }
  return (
    <Text style={{ fontSize: size }}>{icons[name] || '📱'}</Text>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Corridas',
          tabBarIcon: ({ color }) => <TabBarIcon name="car" color={color} />,
          headerTitle: 'Corridas Disponíveis',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          headerTitle: 'Histórico de Corridas',
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Ganhos',
          tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
          headerTitle: 'Meus Ganhos',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTitle: 'Meu Perfil',
        }}
      />
    </Tabs>
  )
}
