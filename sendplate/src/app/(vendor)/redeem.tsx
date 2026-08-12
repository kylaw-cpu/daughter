import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  PackageGlyph,
  Screen,
  Text,
  TextField,
  toast,
} from '@/components';
import { useOnline } from '@/hooks/useOnline';
import { api, ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/dates';
import { Order } from '@/models/types';
import { useVendorQueue } from '@/store/vendorQueueStore';
import { useTheme } from '@/theme/ThemeProvider';

type Phase = 'idle' | 'found' | 'submitting' | 'success';
type CameraMode = 'scan' | 'photo' | null;

/**
 * Vendor Redeem (spec §6.4): scan or type a code, see the hand-over
 * checklist, confirm with a photo, submit. Offline confirmations are queued
 * locally and synced later with a visible pending indicator (spec §11).
 */
export default function Redeem() {
  const theme = useTheme();
  const { t } = useTranslation();
  const online = useOnline();
  const enqueue = useVendorQueue((s) => s.enqueue);
  const syncQueue = useVendorQueue((s) => s.sync);
  const pendingCount = useVendorQueue((s) => s.items.filter((i) => i.status === 'pending').length);

  const [phase, setPhase] = useState<Phase>('idle');
  const [cameraMode, setCameraMode] = useState<CameraMode>(null);
  const [manualCode, setManualCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [looking, setLooking] = useState(false);
  const [queued, setQueued] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const scannedOnce = useRef(false);

  const lookup = async (code: string) => {
    if (!code.trim() || looking) return;
    setLooking(true);
    setError(undefined);
    try {
      const found = await api.redeemLookup(code);
      setOrder(found);
      setPhase('found');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'ALREADY_REDEEMED') {
          setError(
            t('vendor.alreadyRedeemed', { date: e.detail ? formatDateTime(e.detail) : '—' })
          );
        } else if (e.code === 'EXPIRED_CODE') {
          setError(t('vendor.expiredCode'));
        } else {
          setError(t('vendor.invalidCode'));
        }
      } else {
        setError(t('common.errorNoConnection'));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLooking(false);
    }
  };

  const openCamera = async (mode: Exclude<CameraMode, null>) => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        // No camera — manual entry / photo-less confirm still work.
        if (mode === 'scan') toast(t('vendor.enterManually'), 'info');
        return;
      }
    }
    scannedOnce.current = false;
    setCameraMode(mode);
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.4 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch {
      // Keep going without a photo rather than blocking the hand-over.
    }
    setCameraMode(null);
  };

  const submit = async () => {
    if (!order) return;
    setPhase('submitting');
    const idemKey = `redeem_${order.id}`;
    try {
      if (!online) throw new ApiError('NETWORK');
      await api.redeemConfirm({ orderId: order.id, photoUri, idemKey });
      await enqueue({ orderId: order.id, claimCode: order.claimCode, photoUri });
      // Record it as already synced in history.
      useVendorQueue.setState((s) => ({
        items: s.items.map((i) => (i.orderId === order.id ? { ...i, status: 'synced' } : i)),
      }));
      setQueued(false);
      setPhase('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_REDEEMED') {
        setError(t('vendor.alreadyRedeemed', { date: e.detail ? formatDateTime(e.detail) : '—' }));
        setPhase('idle');
        setOrder(null);
        return;
      }
      // Offline or flaky network: queue locally and finish the hand-over.
      await enqueue({ orderId: order.id, claimCode: order.claimCode, photoUri });
      setQueued(true);
      setPhase('success');
    }
  };

  const resetAll = () => {
    setPhase('idle');
    setOrder(null);
    setPhotoUri(undefined);
    setManualCode('');
    setError(undefined);
    setQueued(false);
    syncQueue();
  };

  // ---- camera modal (shared by scan + photo modes) ----
  const cameraModal = (
    <Modal visible={cameraMode !== null} animationType="slide" onRequestClose={() => setCameraMode(null)}>
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={cameraMode === 'scan' ? { barcodeTypes: ['qr'] } : undefined}
          onBarcodeScanned={
            cameraMode === 'scan'
              ? ({ data }) => {
                  if (scannedOnce.current) return;
                  scannedOnce.current = true;
                  setCameraMode(null);
                  lookup(data);
                }
              : undefined
          }
        />
        {cameraMode === 'photo' ? (
          <View style={styles.cameraFooter}>
            <Text variant="bodyStrong" style={styles.cameraHint}>
              {t('vendor.photoHint')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('vendor.confirmPhoto')}
              onPress={takePhoto}
              style={styles.shutter}
            />
          </View>
        ) : (
          <View style={styles.cameraFooter}>
            <Text variant="bodyStrong" style={styles.cameraHint}>
              {t('vendor.scanCode')}
            </Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => setCameraMode(null)}
          style={styles.cameraClose}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );

  if (phase === 'success') {
    return (
      <Screen footer={<Button label={t('common.done')} onPress={resetAll} />}>
        <View style={styles.successWrap}>
          <View style={[styles.successCircle, { backgroundColor: theme.colors.accentTint }]}>
            <Feather name="check" size={48} color={theme.colors.accent} />
          </View>
          <Text variant="display" align="center">
            {t('vendor.successTitle')}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {queued ? t('vendor.queuedOffline') : t('vendor.successBody')}
          </Text>
        </View>
      </Screen>
    );
  }

  if (phase === 'found' || phase === 'submitting') {
    return (
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {!photoUri ? (
              <Button
                label={t('vendor.confirmPhoto')}
                variant="secondary"
                onPress={() => openCamera('photo')}
                icon={<Feather name="camera" size={18} color={theme.colors.primaryDark} />}
              />
            ) : (
              <Button label={t('vendor.retakePhoto')} variant="ghost" onPress={() => openCamera('photo')} />
            )}
            <Button
              label={phase === 'submitting' ? t('vendor.submitting') : t('vendor.submit')}
              onPress={submit}
              loading={phase === 'submitting'}
            />
          </View>
        }
      >
        <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.md }}>
          <Text variant="h1">{t('vendor.orderFound')}</Text>
          {order ? (
            <>
              <Card>
                <View style={styles.orderRow}>
                  <PackageGlyph glyph={order.glyph} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text variant="title">{order.templateName}</Text>
                    <Text variant="body" color="secondary">
                      {t('vendor.recipientLabel', { name: order.recipientName })}
                    </Text>
                  </View>
                </View>
              </Card>
              <Card>
                <View style={{ gap: 10 }}>
                  <Text variant="title">{t('vendor.handOver')}</Text>
                  {order.items.map((item) => (
                    <View key={item.key} style={styles.checkRow}>
                      <Feather name="square" size={20} color={theme.colors.textMuted} />
                      <Text variant="body" style={{ flex: 1 }}>
                        {item.label}
                      </Text>
                      <Text variant="bodyStrong" color="secondary">
                        ×{item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
              <View style={styles.photoNote}>
                <Feather name="camera" size={16} color={theme.colors.textMuted} />
                <Text variant="caption" color="muted" style={{ flex: 1 }}>
                  {t('vendor.photoHint')}
                </Text>
                {photoUri ? <Feather name="check-circle" size={18} color={theme.colors.success} /> : null}
              </View>
            </>
          ) : null}
        </View>
        {cameraModal}
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.md }}>
        <Text variant="h1">{t('vendor.redeemTitle')}</Text>

        {pendingCount > 0 ? (
          <View
            style={[styles.pendingChip, { backgroundColor: theme.colors.warningTint, borderRadius: theme.radius.pill }]}
          >
            <Feather name="upload-cloud" size={14} color={theme.isDark ? theme.colors.warning : '#8A6404'} />
            <Text variant="caption" style={{ color: theme.isDark ? theme.colors.warning : '#8A6404' }}>
              {t('common.pendingSync', { count: pendingCount })}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('vendor.scanCode')}
          onPress={() => openCamera('scan')}
          style={[styles.scanButton, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg }]}
        >
          <Feather name="camera" size={44} color={theme.colors.textOnPrimary} />
          <Text variant="h2" color="onPrimary">
            {t('vendor.scanCode')}
          </Text>
        </Pressable>

        <Text variant="bodyStrong" color="secondary" align="center">
          {t('vendor.enterManually')}
        </Text>
        <TextField
          placeholder={t('vendor.codePlaceholder')}
          value={manualCode}
          onChangeText={(v) => {
            setManualCode(v.toUpperCase());
            setError(undefined);
          }}
          autoCapitalize="characters"
          errorText={error}
        />
        <Button
          label={t('vendor.lookup')}
          variant="secondary"
          onPress={() => lookup(manualCode)}
          loading={looking}
          disabled={!manualCode.trim()}
        />
      </View>
      {cameraModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoNote: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  successWrap: { alignItems: 'center', gap: 12, paddingTop: 64 },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  cameraFooter: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  cameraHint: { color: '#FFFFFF', textAlign: 'center', paddingHorizontal: 32 },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cameraClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
