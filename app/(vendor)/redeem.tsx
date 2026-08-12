import React, { useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Screen,
  ScreenHeader,
  Text,
  TextField,
} from '@/components';
import { api, ApiError, Order } from '@/api';
import { keys } from '@/hooks/queries';
import { track } from '@/analytics/analytics';
import { useOnline } from '@/store/network';
import { useOfflineQueue, usePendingSyncCount } from '@/store/offlineQueue';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Mode = 'idle' | 'scan' | 'found' | 'photo' | 'captured' | 'done';

/**
 * Vendor redeem (spec §6.4): scan or type a claim code, hand over the
 * checklist, confirm with a photo (of the goods, not faces), submit — with
 * offline queueing and clear invalid/redeemed/expired messages.
 */
export default function RedeemScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const online = useOnline();
  const pending = usePendingSyncCount();
  const enqueue = useOfflineQueue((s) => s.enqueue);

  const [mode, setMode] = useState<Mode>('idle');
  const [manualCode, setManualCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [queued, setQueued] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const scannedOnce = useRef(false);

  const errorFor = (e: unknown): string => {
    if (e instanceof ApiError) {
      if (e.code === 'already_redeemed') return t('vendor.alreadyRedeemed', { date: e.meta?.date ?? '' });
      if (e.code === 'expired_code') return t('vendor.expiredCode');
      if (e.code === 'invalid_code') return t('vendor.invalidCode');
    }
    return t('common.genericError');
  };

  const lookup = async (code: string) => {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const found = await api.redeemLookup(code);
      setOrder(found);
      setMode('found');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setError(errorFor(e));
      setMode('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
      scannedOnce.current = false;
    }
  };

  const startScan = async () => {
    setError(null);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError(t('vendor.noCameraBody'));
        return;
      }
    }
    scannedOnce.current = false;
    setMode('scan');
  };

  const capture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.4 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setMode('captured');
      }
    } catch {
      setError(t('common.genericError'));
      setMode('found');
    }
  };

  const submit = async () => {
    if (!order || !photoUri) return;
    setBusy(true);
    setError(null);
    const idemKey = `redeem-${order.id}`;
    try {
      if (!online) {
        // Offline: queue locally and sync later (spec §11).
        await enqueue({ orderId: order.id, claimCode: order.claimCode, photoUri, note: note.trim() || undefined });
        setQueued(true);
        setMode('done');
      } else {
        await api.redeemConfirm({ orderId: order.id, photoUri, note: note.trim() || undefined, idemKey });
        setQueued(false);
        setMode('done');
        qc.invalidateQueries({ queryKey: keys.orders('sender') });
        qc.invalidateQueries({ queryKey: keys.orders('recipient') });
      }
      track('code_redeemed', { orderId: order.id, offline: String(!online) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setError(errorFor(e));
      setMode('found');
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    setMode('idle');
    setOrder(null);
    setManualCode('');
    setPhotoUri(null);
    setNote('');
    setError(null);
    setQueued(false);
  };

  // ---- Scan & photo modes are full-bleed camera views ----
  if (mode === 'scan' || mode === 'photo') {
    const scanning = mode === 'scan';
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, borderRadius: radius.lg, overflow: 'hidden' }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={scanning ? { barcodeTypes: ['qr'] } : undefined}
            onBarcodeScanned={
              scanning
                ? ({ data }) => {
                    if (scannedOnce.current) return;
                    scannedOnce.current = true;
                    setMode('idle');
                    lookup(data);
                  }
                : undefined
            }
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 230,
                height: 230,
                borderWidth: 3,
                borderColor: colors.onPrimary,
                borderRadius: radius.lg,
                opacity: 0.9,
              }}
            />
          </View>
        </View>
        <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
          {!scanning && (
            <Button label={t('vendor.takePhoto')} onPress={capture} icon={<Feather name="camera" size={20} color={colors.onPrimary} />} />
          )}
          {!scanning && (
            <Text variant="caption" color="secondary" align="center">
              {t('vendor.photoHint')}
            </Text>
          )}
          <Button label={t('common.cancel')} variant="ghost" onPress={() => setMode(scanning ? 'idle' : 'found')} />
        </View>
      </Screen>
    );
  }

  // ---- Success ----
  if (mode === 'done') {
    return (
      <Screen scroll={false} footer={<Button label={t('common.done')} onPress={resetAll} />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: colors.accentTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="check" size={56} color={colors.accent} />
          </View>
          <Text variant="display" align="center">
            {t('vendor.redeemedTitle')}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {queued ? t('vendor.offlineQueued') : t('vendor.redeemedBody')}
          </Text>
        </View>
      </Screen>
    );
  }

  // ---- Found: checklist + confirm ----
  if (mode === 'found' || mode === 'captured') {
    const recipientLabel = order?.message?.content;
    return (
      <Screen
        footer={
          mode === 'captured' ? (
            <Button label={t('vendor.submit')} onPress={submit} loading={busy} />
          ) : (
            <Button
              label={t('vendor.confirmPhoto')}
              onPress={() => setMode('photo')}
              icon={<Feather name="camera" size={20} color={colors.onPrimary} />}
            />
          )
        }
      >
        <ScreenHeader title={order?.claimCode ?? ''} back={false} />
        {error != null && <ErrorCard message={error} />}
        <View style={{ gap: spacing.md }}>
          <Card>
            <Text variant="title" style={{ marginBottom: spacing.xs }}>
              {t('vendor.handOver')}
            </Text>
            <View style={{ gap: spacing.sm }}>
              {(order?.items ?? []).map((item) => (
                <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Feather name="square" size={22} color={colors.accent} />
                  <Text variant="body" style={{ fontSize: 17, flex: 1 }}>
                    {item.label}
                    {item.quantity > 1 ? `  ×${item.quantity}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {recipientLabel != null && recipientLabel !== '' && (
            <Card>
              <Text variant="body" color="secondary" style={{ fontStyle: 'italic' }}>
                “{recipientLabel}”
              </Text>
            </Card>
          )}

          {mode === 'captured' && photoUri != null && (
            <View style={{ gap: spacing.sm }}>
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.border }}
              />
              <Button label={t('vendor.retakePhoto')} variant="secondary" onPress={() => setMode('photo')} />
              <TextField
                label={t('sender.vendorNote')}
                value={note}
                onChangeText={setNote}
                placeholder="Karibu!"
              />
            </View>
          )}
          <Text variant="caption" color="muted" align="center">
            {t('vendor.photoHint')}
          </Text>
        </View>
      </Screen>
    );
  }

  // ---- Idle: big scan button + manual entry ----
  return (
    <Screen>
      <ScreenHeader title={t('vendor.tabRedeem')} />
      {pending > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: colors.warning,
            borderRadius: radius.md,
            padding: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <Feather name="upload-cloud" size={16} color="#241E1A" />
          <Text variant="caption" style={{ color: '#241E1A' }}>
            {t('common.pendingSync', { count: pending })}
          </Text>
        </View>
      )}
      {error != null && <ErrorCard message={error} />}
      <View style={{ gap: spacing.xl }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            paddingVertical: spacing.giant,
            gap: spacing.md,
          }}
        >
          <Feather name="maximize" size={64} color={colors.primary} />
          <Button
            label={t('vendor.scanCode')}
            onPress={startScan}
            fullWidth={false}
            icon={<Feather name="camera" size={20} color={colors.onPrimary} />}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong" color="secondary">
            {t('vendor.enterCode')}
          </Text>
          <TextField
            placeholder={t('vendor.codePlaceholder')}
            value={manualCode}
            onChangeText={(v) => setManualCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Button
            label={t('vendor.lookup')}
            variant="secondary"
            onPress={() => lookup(manualCode)}
            loading={busy}
            disabled={!manualCode.trim()}
          />
        </View>
      </View>
    </Screen>
  );
}

function ErrorCard({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ borderWidth: 1.5, borderColor: colors.danger, marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <Feather name="alert-circle" size={20} color={colors.danger} />
        <Text variant="body" style={{ flex: 1 }} accessibilityLiveRegion="assertive">
          {message}
        </Text>
      </View>
    </Card>
  );
}
