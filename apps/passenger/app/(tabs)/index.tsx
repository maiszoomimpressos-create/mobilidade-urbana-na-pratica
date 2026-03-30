import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import CityMap from '@/components/CityMap';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { AdBanner } from '@/components/AdBanner';
import { RideTypeCarousel } from '@/components/RideTypeCarousel';
import { DestinoComSugestoes } from '@/components/DestinoComSugestoes';
import { supabase } from '@/lib/supabase';
import { useBranding } from '@/contexts/BrandingContext';
import type { AppRideType } from '@/lib/rideTypes';
import { fetchNearestTenants } from '@/lib/nearestTenant';
import type { AddressSuggestion } from '@/lib/addressAutocomplete';
import {
  getRideTrack,
  parseTripCoords,
  postCreateRide,
  postPassengerEnsure,
  type TrackRideResponse,
} from '@/lib/rides';

const BTN_SIZE = 52;
const MAX_DESTINOS = 6;

type DestStop = { label: string; lat: number | null; lng: number | null };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const TERMINAL = new Set(['COMPLETED', 'CANCELLED']);

export default function InicioScreen() {
  const {
    branding,
    brandingReady,
    loadAvailableTenants,
    availableTenants,
    hasOverride,
    setTenantFromSlug,
  } = useBranding();
  const [userName, setUserName] = useState<string>('');
  const [selectedRideType, setSelectedRideType] = useState<AppRideType | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [passengerCoords, setPassengerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestCityId, setNearestCityId] = useState<string | null>(null);
  const [focusedDestinoIndex, setFocusedDestinoIndex] = useState<number | null>(null);
  const nearestAppliedRef = useRef(false);
  const prevHasOverrideRef = useRef(hasOverride);

  const [destinos, setDestinos] = useState<DestStop[]>([{ label: '', lat: null, lng: null }]);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<TrackRideResponse | null>(null);
  const [requestingRide, setRequestingRide] = useState(false);

  const [hasConnectedDriver, setHasConnectedDriver] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(190);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const destinosScrollRef = useRef<ScrollView | null>(null);

  const rideTypesCityId = useMemo(() => {
    const switcherCity =
      availableTenants.find((t) => t.slug === branding.slug)?.linkedCity?.id ?? null;
    if (switcherCity) return switcherCity;
    if (!hasOverride && nearestCityId) return nearestCityId;
    if (availableTenants.length === 1) return availableTenants[0].linkedCity?.id ?? null;
    return null;
  }, [availableTenants, branding.slug, hasOverride, nearestCityId]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const loadUserAndTenants = async () => {
      const { data } = await supabase.auth.getUser();
      const name =
        data.user?.user_metadata?.full_name ??
        data.user?.user_metadata?.name ??
        data.user?.email?.split('@')[0] ??
        '';
      setUserName(name);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? null;
      setAuthToken(token);
      if (token) {
        await loadAvailableTenants(token);
      }
    };
    loadUserAndTenants();
  }, [loadAvailableTenants]);

  useEffect(() => {
    if (!brandingReady || !authToken) return;
    postPassengerEnsure(authToken, branding.slug).catch(() => {
      /* silencioso: pode falhar se ainda não houver central no banco */
    });
  }, [brandingReady, authToken, branding.slug]);

  useEffect(() => {
    if (prevHasOverrideRef.current && !hasOverride) {
      nearestAppliedRef.current = false;
    }
    prevHasOverrideRef.current = hasOverride;
  }, [hasOverride]);

  useEffect(() => {
    if (!brandingReady || hasOverride || nearestAppliedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const la = loc.coords.latitude;
        const lo = loc.coords.longitude;
        if (cancelled) return;

        setPassengerCoords({ lat: la, lng: lo });

        const list = await fetchNearestTenants(la, lo);
        if (cancelled) return;

        if (list.length === 0) return;

        const best = list[0];
        setNearestCityId(best.primaryCityId ?? null);

        if (best.slug && best.slug !== branding.slug) {
          await setTenantFromSlug(best.slug);
        }
      } catch {
        /* GPS ou rede indisponível */
      } finally {
        if (!cancelled) nearestAppliedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandingReady, hasOverride, branding.slug, setTenantFromSlug]);

  useEffect(() => {
    setSelectedRideType(null);
  }, [branding.slug]);

  useEffect(() => {
    if (!activeRideId || !authToken) {
      setTrackData(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const t = await getRideTrack(authToken, activeRideId);
        if (cancelled) return;
        setTrackData(t);
        if (TERMINAL.has(t.status)) {
          setActiveRideId(null);
          setHasConnectedDriver(false);
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const iv = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [activeRideId, authToken]);

  const onSelectRideType = useCallback((rt: AppRideType | null) => {
    setSelectedRideType(rt);
  }, []);

  const handleChamarCorrida = async () => {
    const dest = destinos[0];
    if (!dest?.label.trim()) {
      Alert.alert('Destino', 'Informe para onde você vai.');
      return;
    }
    if (dest.lat == null || dest.lng == null) {
      Alert.alert(
        'Destino',
        'Escolha um endereço na lista de sugestões para localizar no mapa.'
      );
      return;
    }
    if (!selectedRideType) {
      Alert.alert('Modalidade', 'Selecione o tipo de corrida.');
      return;
    }
    if (!passengerCoords) {
      Alert.alert('Localização', 'Ative o GPS para definir o ponto de embarque.');
      return;
    }
    if (!authToken) {
      Alert.alert('Login', 'Entre na sua conta para solicitar a corrida.');
      return;
    }

    setRequestingRide(true);
    try {
      const res = await postCreateRide(authToken, {
        tenantSlug: branding.slug,
        rideTypeId: selectedRideType.id,
        originLatitude: passengerCoords.lat,
        originLongitude: passengerCoords.lng,
        destinationLatitude: dest.lat,
        destinationLongitude: dest.lng,
        originAddress: 'Minha localização',
        destinationAddress: dest.label,
      });
      setActiveRideId(res.ride.id);
      setHasConnectedDriver(true);
      Alert.alert(
        'Corrida solicitada',
        `Valor estimado: R$ ${Number(res.ride.estimatedPrice).toFixed(2)}\n` +
          (res.ride.driverAssigned
            ? 'Um motorista foi vinculado. Acompanhe no mapa.'
            : 'Procurando motorista próximo. Acompanhe no mapa.')
      );
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível criar a corrida.');
    } finally {
      setRequestingRide(false);
    }
  };

  const handleAdicionarParada = () => {
    if (destinos.length >= MAX_DESTINOS) return;
    setDestinos((prev) => [...prev, { label: '', lat: null, lng: null }]);
    setTimeout(() => {
      destinosScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  const handleRemoverParada = (index: number) => {
    if (destinos.length <= 1) return;
    setDestinos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDestino = (index: number, patch: Partial<DestStop>) => {
    setDestinos((prev) => {
      const next = [...prev];
      const cur = next[index] ?? { label: '', lat: null, lng: null };
      next[index] = { ...cur, ...patch };
      return next;
    });
  };

  const onPickSuggestion = (index: number, s: AddressSuggestion) => {
    updateDestino(index, {
      label: s.label,
      lat: s.latitude != null && Number.isFinite(s.latitude) ? s.latitude : null,
      lng: s.longitude != null && Number.isFinite(s.longitude) ? s.longitude : null,
    });
  };

  const temAlgumDestino = destinos.some((d) => d.label.trim().length > 0);
  const podeAdicionar = destinos.length < MAX_DESTINOS;
  const hasAssignedTenant = branding.slug.trim().length > 0 && branding.slug !== 'mai-drive';
  const shouldShowAdSlot = branding.showPassengerAds && hasAssignedTenant;

  const tripCoords = parseTripCoords(trackData?.tripRouteCoords);
  const approachCoords = trackData?.approachRouteCoords
    ? parseTripCoords(trackData.approachRouteCoords)
    : [];
  const driverPos = trackData?.driverPosition ?? null;

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
      setPassengerCoords({ lat: latitude, lng: longitude });
      setHasConnectedDriver(true);
      Alert.alert(
        'Chamar sem destino',
        `Sua localização foi enviada. (${latitude.toFixed(4)}, ${longitude.toFixed(4)})\nEm breve: corrida só com embarque.`
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
  };

  const showDemoDrivers = hasConnectedDriver && !activeRideId;

  return (
    <View style={styles.container}>
      {!keyboardVisible && (
        <View style={styles.topBar}>
          <TenantSwitcher />
        </View>
      )}

      {shouldShowAdSlot && !keyboardVisible && (
        <View style={styles.adSlot}>
          <AdBanner position="PASSENGER_HOME" />
        </View>
      )}

      <View style={styles.mapWrap}>
        <CityMap
          showDemoDrivers={showDemoDrivers}
          tripCoordinates={tripCoords}
          approachCoordinates={approachCoords}
          driverTrackingPosition={driverPos}
          liveUserTracking={activeRideId != null}
        />
        {!keyboardVisible && (
          <Pressable
            style={[styles.semDestinoWrap, { bottom: bottomSheetHeight + 12 }]}
            onPress={handleSemDestino}
          >
            <View style={[styles.roundBtn, { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2 }]}>
              <Ionicons name="navigate" size={24} color="#050505" />
            </View>
            <Text style={styles.btnLabel}>Sem Destino</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View
          style={[styles.bottomSheet, keyboardVisible && styles.bottomSheetKeyboard]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0 && !keyboardVisible) setBottomSheetHeight(height);
          }}
        >
          <View style={styles.sheetHandle} />
          {!keyboardVisible && (
            <Text style={styles.greeting}>
              {getGreeting()}
              {userName ? `, ${userName}` : ''}
            </Text>
          )}
          <ScrollView
            style={[styles.destinosScroll, keyboardVisible && styles.destinosScrollKeyboard]}
            contentContainerStyle={styles.destinosScrollContent}
            keyboardShouldPersistTaps="handled"
            ref={destinosScrollRef}
            showsVerticalScrollIndicator={true}
          >
            {!keyboardVisible && (
              <RideTypeCarousel
                tenantSlug={branding.slug}
                cityId={rideTypesCityId}
                primaryColor={branding.primaryColor}
                selectedId={selectedRideType?.id ?? null}
                onSelect={onSelectRideType}
              />
            )}
            {destinos.map((stop, index) => (
              <View
                key={index}
                style={[styles.searchRow, focusedDestinoIndex === index && styles.searchRowFocused]}
              >
                <DestinoComSugestoes
                  value={stop.label}
                  onChangeText={(v) =>
                    updateDestino(index, { label: v, lat: null, lng: null })
                  }
                  onPickSuggestion={(s) => onPickSuggestion(index, s)}
                  placeholder={index === 0 ? 'Buscar destino' : `Parada ${index}`}
                  isActive={focusedDestinoIndex === index}
                  onActivate={() => setFocusedDestinoIndex(index)}
                  onDeactivate={() =>
                    setFocusedDestinoIndex((cur) => (cur === index ? null : cur))
                  }
                  authToken={authToken}
                  tenantSlug={branding.slug}
                  userLatitude={passengerCoords?.lat ?? null}
                  userLongitude={passengerCoords?.lng ?? null}
                />
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
            <Pressable
              style={[styles.chamarCorridaBtn, requestingRide && styles.chamarCorridaBtnDisabled]}
              onPress={handleChamarCorrida}
              disabled={requestingRide}
            >
              {requestingRide ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="car" size={26} color="#fff" />
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 30,
  },
  adSlot: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  bottomSheet: {
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
  bottomSheetKeyboard: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingBottom: 12,
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
  destinosScroll: { maxHeight: 280 },
  destinosScrollKeyboard: { maxHeight: 200 },
  destinosScrollContent: { paddingBottom: 8 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  searchRowFocused: {
    zIndex: 40,
    elevation: 8,
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addParadaBtn: { padding: 4 },
  removeParadaBtn: { padding: 4 },
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
  chamarCorridaBtnDisabled: { opacity: 0.7 },
  mapWrap: { flex: 1, position: 'relative' },
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
