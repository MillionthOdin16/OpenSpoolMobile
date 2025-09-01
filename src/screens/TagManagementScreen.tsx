import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

import Button from '../components/Button';
import CustomDropdown, { DropdownOption } from '../components/CustomDropdown';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, HEIGHTS } from '../constants/theme';
import { FILAMENT_COLORS, FILAMENT_TYPES, FILAMENT_DEFAULTS, TEMPERATURE_OPTIONS } from '../constants/filament';
import { tagProtocolService, TagProtocol, ExtendedFilamentData } from '../services/TagProtocolService';
import { appStateManager } from '../utils/AppStateManager';

const TagManagementScreen: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [color, setColor] = useState('magenta');
  const [type, setType] = useState('pla');
  const [minTemp, setMinTemp] = useState('180');
  const [maxTemp, setMaxTemp] = useState('210');
  const [selectedProtocol, setSelectedProtocol] = useState<TagProtocol>(TagProtocol.OPENSPOOL);

  // Modal state
  const [readTagModalOpen, setReadTagModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Read Tag');
  const [lastScannedFilament, setLastScannedFilament] = useState<ExtendedFilamentData | null>(null);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 720,
      useNativeDriver: true,
    }).start(() => {
      setIsLoading(false);
    });

    // Load last scanned filament from shared state
    const lastFilament = appStateManager.getLastScannedFilament();
    if (lastFilament) {
      setLastScannedFilament(lastFilament);
    }
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Convert constants to dropdown options
  const colorOptions: DropdownOption[] = FILAMENT_COLORS.map(colorItem => ({
    label: colorItem.label,
    value: colorItem.value,
    hex: colorItem.hex,
  }));

  const typeOptions: DropdownOption[] = FILAMENT_TYPES.map(typeItem => ({
    label: typeItem.label,
    value: typeItem.value,
  }));

  const protocolOptions: DropdownOption[] = tagProtocolService.getAllProtocols().map(protocol => ({
    label: `${protocol.label} v${protocol.version}`,
    value: protocol.value,
  }));

  const temperatureOptions: DropdownOption[] = TEMPERATURE_OPTIONS.map(temp => ({
    label: temp.label,
    value: temp.value,
  }));

  const verifyAndSetMinTemp = (temp: string) => {
    const tempValue = Number(temp);
    const maxTempValue = Number(maxTemp);

    if (isNaN(tempValue) || tempValue < 0 || tempValue > 500) {
      Alert.alert('Invalid Temperature', 'Minimum temperature must be between 0°C and 500°C.');
      return;
    }

    if (tempValue >= maxTempValue) {
      const newMaxTemp = Math.min(tempValue + 5, 280);
      setMaxTemp(String(newMaxTemp));
    }

    setMinTemp(temp);
  };

  const verifyAndSetMaxTemp = (temp: string) => {
    const tempValue = Number(temp);
    const minTempValue = Number(minTemp);

    if (isNaN(tempValue) || tempValue < 0 || tempValue > 500) {
      Alert.alert('Invalid Temperature', 'Maximum temperature must be between 0°C and 500°C.');
      return;
    }

    if (tempValue <= minTempValue) {
      Alert.alert('Temperature Error', 'Maximum temperature must be greater than minimum temperature.');
      return;
    }

    setMaxTemp(temp);
  };

  const setTypeAndDefaults = (newType: string) => {
    setType(newType);
    const defaults = FILAMENT_DEFAULTS[newType];
    if (defaults) {
      setMinTemp(String(defaults.minTemp));
      setMaxTemp(String(defaults.maxTemp));
    }
  };

  const checkNfcSupportedAndEnabled = async () => {
    const isNfcSupported = await NfcManager.isSupported();
    if (!isNfcSupported) {
      Alert.alert('NFC Not Supported', 'NFC is not supported on this device.');
      return false;
    }

    const isNfcEnabled = await NfcManager.isEnabled();
    if (!isNfcEnabled) {
      Alert.alert('NFC Disabled', 'NFC is disabled. Please enable it in your device settings.');
      return false;
    }

    return true;
  };

  const readNdef = async () => {
    try {
      if (Platform.OS === 'android') {
        setModalTitle('Read Tag');
        setReadTagModalOpen(true);
      }

      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        const rawValue = tag.ndefMessage.map(record =>
          String.fromCharCode(...record.payload)
        ).join('').trim();

        if (!rawValue) {
          Alert.alert('Empty Tag', 'The tag appears to be empty or contains no readable data.');
          return;
        }

        const parseResult = tagProtocolService.parseTagData(rawValue, selectedProtocol);

        if (parseResult) {
          const { data: parsedData, protocol: detectedProtocol } = parseResult;

          if (!parsedData.color_hex || !parsedData.type || !parsedData.min_temp || !parsedData.max_temp) {
            Alert.alert('Invalid Tag Data', 'The tag contains incomplete filament information.');
            return;
          }

          // Update UI with parsed data
          const matchingColor = FILAMENT_COLORS.find(c => c.hex.toLowerCase() === parsedData.color_hex.toLowerCase());
          const matchingType = FILAMENT_TYPES.find(t => t.value.toLowerCase() === parsedData.type.toLowerCase());

          const newColor = matchingColor?.value ?? 'blue';
          const newType = matchingType?.value ?? 'pla';

          setColor(newColor);
          setType(newType);
          setMinTemp(parsedData.min_temp.toString());
          setMaxTemp(parsedData.max_temp.toString());

          if (detectedProtocol !== selectedProtocol) {
            setSelectedProtocol(detectedProtocol);
            const protocolName = detectedProtocol === TagProtocol.OPENSPOOL ? 'OpenSpool' : 'OpenTag3D';
            Alert.alert(
              'Protocol Auto-Detected',
              `Tag uses ${protocolName} protocol. Protocol selection has been updated.`
            );
          }

          setLastScannedFilament(parsedData);
          appStateManager.setLastScannedFilament(parsedData);

          Alert.alert(
            'Tag Read Successfully',
            `Filament: ${parsedData.brand} ${parsedData.type.toUpperCase()}\nColor: ${parsedData.color_hex}\nTemperature: ${parsedData.min_temp}°C - ${parsedData.max_temp}°C`
          );
        } else {
          Alert.alert(
            'Invalid Tag',
            'Unable to parse tag data. Please ensure the tag contains valid OpenSpool or OpenTag3D filament information.'
          );
        }
      } else {
        Alert.alert('Empty Tag', 'No NDEF message found on the tag.');
      }
    } catch (ex) {
      console.warn('NFC read failed', ex);
      Alert.alert(
        'Read Failed',
        'Failed to read the tag. Please ensure NFC is enabled and try holding the tag closer to your device.'
      );
    } finally {
      if (Platform.OS === 'android') {
        setReadTagModalOpen(false);
      }
      NfcManager.cancelTechnologyRequest();
    }
  };

  const writeNdef = async () => {
    const minTempValue = Number(minTemp);
    const maxTempValue = Number(maxTemp);

    if (isNaN(minTempValue) || isNaN(maxTempValue) || minTempValue >= maxTempValue) {
      Alert.alert('Temperature Error', 'Please ensure minimum temperature is less than maximum temperature.');
      return;
    }

    if (minTempValue < 0 || maxTempValue > 500) {
      Alert.alert('Temperature Range Error', 'Temperatures must be between 0°C and 500°C.');
      return;
    }

    const selectedColor = FILAMENT_COLORS.find(c => c.value === color);
    if (!selectedColor) {
      Alert.alert('Color Error', 'Please select a valid color.');
      return;
    }

    try {
      if (Platform.OS === 'android') {
        setModalTitle('Write To Tag');
        setReadTagModalOpen(true);
      }

      await NfcManager.requestTechnology(NfcTech.Ndef);

      const protocolDefaults = tagProtocolService.getDefaultDataForProtocol(selectedProtocol);
      const filamentData: ExtendedFilamentData = {
        color_hex: selectedColor.hex,
        type: type,
        min_temp: minTempValue,
        max_temp: maxTempValue,
        brand: 'Generic',
        ...protocolDefaults,
      };

      const formattedData = tagProtocolService.formatTagData(filamentData, selectedProtocol);

      if (!formattedData) {
        Alert.alert('Format Error', 'Failed to format tag data for selected protocol.');
        return;
      }

      const ndefRecords = Ndef.record(Ndef.TNF_MIME_MEDIA, 'application/json', '1', formattedData);
      const bytes = await Ndef.encodeMessage([ndefRecords]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert('Success', `Tag written successfully using ${selectedProtocol === TagProtocol.OPENSPOOL ? 'OpenSpool' : 'OpenTag3D'} protocol.`);

        // Update last scanned filament for easy transfer to printer
        setLastScannedFilament(filamentData);
        appStateManager.setLastScannedFilament(filamentData);
      }
    } catch (error) {
      if (Platform.OS === 'android') {
        Alert.alert('Write Failed', 'Failed to write to tag. If corrupted, try again and keep tag in place for 1 full second.');
      } else {
        Alert.alert('Write Failed', 'Failed to write to tag. Please try again.');
      }
      console.error('Error writing:', error);
    } finally {
      if (Platform.OS === 'android') {
        setReadTagModalOpen(false);
      }
      NfcManager.cancelTechnologyRequest();
    }
  };

  const closeModalAndCancelRead = () => {
    setReadTagModalOpen(false);
    NfcManager.cancelTechnologyRequest();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>NFC Tag Management</Text>
          <Text style={styles.subtitle}>Create and read filament tags</Text>
        </View>

        <View style={styles.circleContainer}>
          <View style={styles.circleWrapper}>
            <View
              style={[
                styles.circle,
                isLoading
                  ? styles.loadingCircle
                  : { backgroundColor: `#${FILAMENT_COLORS.find(c => c.value === color)?.hex}` || color },
              ]}
            />
            <Animated.Image
              source={require('../../assets/openspool-transparent.png')}
              style={[
                styles.overlayImage,
                {
                  transform: [{ rotate: isLoading ? spin : '0deg' }],
                },
              ]}
              resizeMode="cover"
            />
          </View>
        </View>

        <View style={styles.formContainer}>
          <CustomDropdown
            label="Color"
            data={colorOptions}
            value={color}
            onChange={(item) => setColor(item.value)}
            placeholder="Select color"
            searchable={true}
          />

          <CustomDropdown
            label="Filament Type"
            data={typeOptions}
            value={type}
            onChange={(item) => setTypeAndDefaults(item.value)}
            placeholder="Select type"
          />

          <CustomDropdown
            label="Protocol"
            data={protocolOptions}
            value={selectedProtocol}
            onChange={(item) => setSelectedProtocol(item.value as TagProtocol)}
            placeholder="Select protocol"
          />

          <View style={styles.temperatureContainer}>
            <View style={styles.temperatureField}>
              <CustomDropdown
                label="Min Temperature"
                data={temperatureOptions.slice(0, -1)}
                value={minTemp}
                onChange={(item) => verifyAndSetMinTemp(item.value)}
                placeholder="Min temp"
              />
            </View>

            <View style={styles.temperatureField}>
              <CustomDropdown
                label="Max Temperature"
                data={temperatureOptions.filter(temp => parseInt(temp.value, 10) > parseInt(minTemp, 10))}
                value={maxTemp}
                onChange={(item) => verifyAndSetMaxTemp(item.value)}
                placeholder="Max temp"
              />
            </View>
          </View>
        </View>

        {lastScannedFilament && (
          <View style={styles.lastScannedContainer}>
            <Text style={styles.lastScannedTitle}>Last Scanned Filament</Text>
            <Text style={styles.lastScannedText}>
              {lastScannedFilament.brand} {lastScannedFilament.type.toUpperCase()}
            </Text>
            <Text style={styles.lastScannedDetails}>
              Color: #{lastScannedFilament.color_hex} | {lastScannedFilament.min_temp}°C - {lastScannedFilament.max_temp}°C
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Read Tag"
            onPress={async () => {
              const isNfcReady = await checkNfcSupportedAndEnabled();
              if (isNfcReady) {
                readNdef();
              }
            }}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="Write Tag"
            onPress={async () => {
              const isNfcReady = await checkNfcSupportedAndEnabled();
              if (isNfcReady) {
                writeNdef();
              }
            }}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* NFC Modal */}
      {Platform.OS === 'android' && (
        <Modal
          visible={readTagModalOpen}
          transparent={false}
          animationType="slide"
          onRequestClose={closeModalAndCancelRead}
          presentationStyle="overFullScreen"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <TouchableOpacity onPress={closeModalAndCancelRead}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>Waiting for tag...</Text>
                <Text style={styles.modalSubtext}>Hold Tag To Phone For 1 Second</Text>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DARK,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontFamily: 'Orbitron-Regular',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  circleWrapper: {
    position: 'relative',
    width: HEIGHTS.CIRCLE,
    height: HEIGHTS.CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: HEIGHTS.CIRCLE,
    height: HEIGHTS.CIRCLE,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: 'black',
  },
  overlayImage: {
    position: 'absolute',
    width: HEIGHTS.CIRCLE,
    height: HEIGHTS.CIRCLE,
    opacity: 1.0,
  },
  loadingCircle: {
    backgroundColor: COLORS.PRIMARY,
  },
  formContainer: {
    marginBottom: SPACING.LG,
  },
  temperatureContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  temperatureField: {
    flex: 1,
  },
  lastScannedContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.SUCCESS,
  },
  lastScannedTitle: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  lastScannedText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  lastScannedDetails: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    fontSize: FONT_SIZES.XL,
    color: COLORS.TEXT_PRIMARY,
  },
  modalBody: {
    alignItems: 'center',
  },
  modalText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  modalSubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
});

export default TagManagementScreen;
