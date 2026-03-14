import React from 'react';
import { Modal, View, StyleSheet, Pressable, Alert, Text, Image } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import RideRequestCard from '@/components/RideRequestCard';

const BTN_SIZE = 52;

type ModalPedirCorridaProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalPedirCorrida({ visible, onClose }: ModalPedirCorridaProps) {
  const handleRequestWithDestinations = (destinations: string[]) => {
    Alert.alert(
      'Pedido com destino',
      `Destinos: ${destinations.join(' → ')}. Em breve: cálculo de corrida e envio ao motorista.`,
      [{ text: 'OK' }]
    );
  };

  const handleMacaneta = () => {
    Alert.alert('Maçaneta', 'Em breve: identificar veículo e abrir porta.');
  };

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Pressable style={styles.semDestinoWrap} onPress={handleSemDestino}>
          <View style={[styles.roundBtn, { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2 }]}>
            <Ionicons name="navigate" size={24} color="#050505" />
          </View>
          <Text style={styles.btnLabel}>Sem Destino</Text>
        </Pressable>
        <Pressable style={styles.entrarCarroWrap} onPress={handleMacaneta}>
          <View style={[styles.roundBtn, { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2 }]}>
            <Image
              source={require('@/assets/images/macaneta-icon.png')}
              style={styles.macanetaIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.btnLabel}>Maçaneta</Text>
        </Pressable>
        <View style={styles.modalContent}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <RideRequestCard
            onRequestWithDestinations={handleRequestWithDestinations}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  modalContent: {
    position: 'relative',
    marginBottom: 60,
    zIndex: 5,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  semDestinoWrap: {
    position: 'absolute',
    left: 12,
    bottom: 335,
    zIndex: 20,
    alignItems: 'center',
  },
  entrarCarroWrap: {
    position: 'absolute',
    left: 96,
    bottom: 335,
    zIndex: 20,
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
  macanetaIcon: {
    width: 44,
    height: 28,
  },
});
