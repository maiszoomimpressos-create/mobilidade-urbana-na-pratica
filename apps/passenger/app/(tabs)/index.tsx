import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Text, Alert, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import CityMap from '@/components/CityMap';
import { supabase } from '@/lib/supabase';

const BTN_SIZE = 52;
const AD_BANNER_HEIGHT = 72;
/** Máximo de destinos/paradas permitidos */
const MAX_DESTINOS = 6;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function InicioScreen() {
  const [userName, setUserName] = useState<string>('');
  const [destinos, setDestinos] = useState<string[]>(['']);
  // Altura atual do painel inferior (usado para manter o botão Sem Destino logo acima dele)
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(190);
  const destinosScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name =
        data.user?.user_metadata?.full_name ??
        data.user?.user_metadata?.name ??
        data.user?.email?.split('@')[0] ??
        '';
      setUserName(name);
    });
  }, []);

  const handleChamarCorrida = () => {
    const preenchidos = destinos.filter((d) => d.trim().length > 0);
    Alert.alert('Chamar corrida', `Destinos: ${preenchidos.join(' → ')}. Em breve: cálculo e envio ao motorista.`, [{ text: 'OK' }]);
  };

  const handleAdicionarParada = () => {
    if (destinos.length >= MAX_DESTINOS) return;
    setDestinos((prev) => [...prev, '']);
    // após adicionar, rola para o final para deixar o novo campo em evidência
    setTimeout(() => {
      destinosScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  /** Remove a parada do índice informado */
  const handleRemoverParada = (index: number) => {
    if (destinos.length <= 1) return;
    setDestinos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDestino = (index: number, value: string) => {
    setDestinos((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const temAlgumDestino = destinos.some((d) => d.trim().length > 0);
  const podeAdicionar = destinos.length < MAX_DESTINOS;

  const handleSemDestino = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Localização', 'Ative a localização para chamar o motorista.');
          return;
        }
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      Alert.alert(
        'Chamar sem destino',
        `Sua localização foi enviada. O motorista mais próximo será acionado. (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Área de publicidade no topo */}
      <View style={styles.adSlot}>
        <Text style={styles.adSlotLabel}>Espaço publicitário</Text>
      </View>

      <View style={styles.mapWrap}>
        <CityMap />
        {/* Botão sobre o mapa — posicionado logo acima do painel de solicitações */}
        <Pressable
          style={[styles.semDestinoWrap, { bottom: bottomSheetHeight + 12 }]}
          onPress={handleSemDestino}
        >
          <View style={[styles.roundBtn, { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2 }]}>
            <Ionicons name="navigate" size={24} color="#050505" />
          </View>
          <Text style={styles.btnLabel}>Sem Destino</Text>
        </Pressable>
      </View>

      {/* Painel inferior: saudação + até 6 buscas de endereço + botão chamar (se digitou) */}
      <View
        style={styles.bottomSheet}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0) setBottomSheetHeight(height);
        }}
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.greeting}>
          {getGreeting()}{userName ? `, ${userName}` : ''}
        </Text>
        <ScrollView
          style={styles.destinosScroll}
          contentContainerStyle={styles.destinosScrollContent}
          keyboardShouldPersistTaps="handled"
          ref={destinosScrollRef}
          showsVerticalScrollIndicator={true}
        >
          {destinos.map((valor, index) => (
            <View key={index} style={styles.searchRow}>
              <View style={styles.searchDestinoBar}>
                <Ionicons name="search" size={18} color="#666" />
                <TextInput
                  style={styles.searchDestinoInput}
                  placeholder={index === 0 ? 'Buscar destino' : `Parada ${index}`}
                  placeholderTextColor="#888"
                  value={valor}
                  onChangeText={(v) => updateDestino(index, v)}
                />
              </View>
              {index === destinos.length - 1 && (
                <View style={styles.actionsRow}>
                  {podeAdicionar && (
                    <Pressable
                      style={styles.addParadaBtn}
                      onPress={handleAdicionarParada}
                      hitSlop={8}
                    >
                      <Ionicons name="add-circle-outline" size={28} color="#1a1a1a" />
                    </Pressable>
                  )}
                </View>
              )}
              {destinos.length > 1 && (
                <Pressable
                  style={styles.removeParadaBtn}
                  onPress={() => handleRemoverParada(index)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={26} color="#999" />
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
        {temAlgumDestino && (
          <Pressable style={styles.chamarCorridaBtn} onPress={handleChamarCorrida}>
            <Ionicons name="car" size={26} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adSlot: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  adSlotLabel: {
    alignSelf: 'stretch',
    marginHorizontal: 10, // 10 px de cada lado da tela
    height: 135,
    lineHeight: 135,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
    fontSize: 12,
    textAlign: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  destinosScroll: {
    // altura pensada para exibir aprox. 3 linhas;
    // se houver mais de 3 campos, o conteúdo passa a rolar
    maxHeight: 140,
  },
  destinosScrollContent: {
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchDestinoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchDestinoInput: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 20,
  },
  addParadaBtn: {
    padding: 4,
  },
  removeParadaBtn: {
    padding: 4,
  },
  chamarCorridaBtn: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  semDestinoWrap: {
    position: 'absolute',
    left: 20,
    alignItems: 'center',
  },
  roundBtn: {
    backgroundColor: '#ebb000',
    borderWidth: 2,
    borderColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  btnLabel: {
    color: '#050505',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
});
