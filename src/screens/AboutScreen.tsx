import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';

import Button from '../components/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

const AboutScreen: React.FC = () => {
  const openLink = (url: string, title: string) => {
    Alert.alert(
      'Open Link',
      `Would you like to open ${title}?\n\n${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => {
          // In a real app, this would use Linking.openURL(url)
          Alert.alert('Link would open', url);
        }},
      ]
    );
  };

  const showFeatures = () => {
    Alert.alert(
      'Key Features',
      `✅ NFC Tag Reading & Writing
✅ OpenSpool & OpenTag3D v0.003 Support
✅ Bambu Lab Printer Integration
✅ MQTT Bidirectional Communication
✅ Real-time Printer Status
✅ Comprehensive Filament Management
✅ Auto Protocol Detection
✅ Enhanced Error Handling
✅ Professional UI/UX Design`,
      [{ text: 'OK' }]
    );
  };

  const showTechnicalSpecs = () => {
    Alert.alert(
      'Technical Specifications',
      `🔧 React Native 0.76.5
🔧 TypeScript Support
🔧 NFC Manager Integration
🔧 MQTT Protocol Implementation
🔧 Real-time Status Updates
🔧 TLS-secured Connections
🔧 Comprehensive Validation
🔧 Event-driven Architecture
🔧 Professional Error Recovery`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/openspool-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>OpenSpool Mobile</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.subtitle}>Professional NFC Filament Management</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About OpenSpool</Text>
          <Text style={styles.description}>
            OpenSpool Mobile is a comprehensive NFC-based filament management system designed for 3D printing enthusiasts and professionals.
            It provides seamless integration with modern 3D printers and supports industry-standard protocols for maximum compatibility.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Capabilities</Text>
          <View style={styles.capabilityContainer}>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityIcon}>📱</Text>
              <View style={styles.capabilityText}>
                <Text style={styles.capabilityTitle}>NFC Tag Management</Text>
                <Text style={styles.capabilityDescription}>Read, write, and validate filament tags</Text>
              </View>
            </View>

            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityIcon}>🖨️</Text>
              <View style={styles.capabilityText}>
                <Text style={styles.capabilityTitle}>Printer Integration</Text>
                <Text style={styles.capabilityDescription}>Direct communication with Bambu Lab printers</Text>
              </View>
            </View>

            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityIcon}>🔄</Text>
              <View style={styles.capabilityText}>
                <Text style={styles.capabilityTitle}>Real-time Monitoring</Text>
                <Text style={styles.capabilityDescription}>Live status updates and bidirectional MQTT</Text>
              </View>
            </View>

            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityIcon}>📊</Text>
              <View style={styles.capabilityText}>
                <Text style={styles.capabilityTitle}>Protocol Support</Text>
                <Text style={styles.capabilityDescription}>OpenSpool & OpenTag3D v0.003 compliant</Text>
              </View>
            </View>
          </View>

          <Button
            title="View All Features"
            onPress={showFeatures}
            variant="secondary"
            style={styles.featureButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Information</Text>
          <View style={styles.techInfoContainer}>
            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Framework</Text>
              <Text style={styles.techInfoValue}>React Native 0.76.5</Text>
            </View>

            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Language</Text>
              <Text style={styles.techInfoValue}>TypeScript</Text>
            </View>

            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>NFC Library</Text>
              <Text style={styles.techInfoValue}>react-native-nfc-manager</Text>
            </View>

            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>MQTT Protocol</Text>
              <Text style={styles.techInfoValue}>sp-react-native-mqtt</Text>
            </View>

            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Navigation</Text>
              <Text style={styles.techInfoValue}>React Navigation 6</Text>
            </View>
          </View>

          <Button
            title="View Technical Details"
            onPress={showTechnicalSpecs}
            variant="secondary"
            style={styles.techButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community & Support</Text>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://github.com/spuder/OpenSpool', 'OpenSpool Project')}
          >
            <Text style={styles.linkIcon}>🔗</Text>
            <View style={styles.linkText}>
              <Text style={styles.linkTitle}>OpenSpool Project</Text>
              <Text style={styles.linkDescription}>github.com/spuder/OpenSpool</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://opentag3d.info', 'OpenTag3D Specification')}
          >
            <Text style={styles.linkIcon}>📋</Text>
            <View style={styles.linkText}>
              <Text style={styles.linkTitle}>OpenTag3D Specification</Text>
              <Text style={styles.linkDescription}>opentag3d.info</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://github.com/bambulab', 'Bambu Lab GitHub')}
          >
            <Text style={styles.linkIcon}>🛠️</Text>
            <View style={styles.linkText}>
              <Text style={styles.linkTitle}>Bambu Lab Integration</Text>
              <Text style={styles.linkDescription}>Official MQTT API Support</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Source</Text>
          <Text style={styles.description}>
            This application is built on open-source foundations and contributes to the 3D printing community.
            It implements industry-standard protocols and maintains compatibility with existing ecosystem tools.
          </Text>

          <View style={styles.licenseContainer}>
            <Text style={styles.licenseTitle}>License & Attribution</Text>
            <Text style={styles.licenseText}>
              • Built with React Native and open-source libraries{'\n'}
              • Implements OpenSpool and OpenTag3D specifications{'\n'}
              • Integrates with Bambu Lab MQTT API{'\n'}
              • Designed for community compatibility
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for the 3D printing community
          </Text>
          <Text style={styles.copyrightText}>
            © 2024 OpenSpool Mobile
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    marginBottom: SPACING.XL,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: SPACING.MD,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: FONT_SIZES.XXXL,
    fontFamily: 'Orbitron-Regular',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  version: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  description: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    textAlign: 'justify',
  },
  capabilityContainer: {
    marginBottom: SPACING.MD,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  capabilityIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },
  capabilityText: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  capabilityDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  featureButton: {
    marginTop: SPACING.SM,
  },
  techInfoContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  techInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  techInfoLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  techInfoValue: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  techButton: {
    marginTop: SPACING.SM,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: SPACING.MD,
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  linkArrow: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  licenseContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.MD,
  },
  licenseTitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  licenseText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.XL,
    paddingTop: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_DEFAULT,
  },
  footerText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SPACING.XL,
  },
});

export default AboutScreen;
