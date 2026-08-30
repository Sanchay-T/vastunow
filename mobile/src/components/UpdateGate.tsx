import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { COLORS } from '@/constants/colors';

type Phase = 'checking' | 'downloading' | 'restarting' | 'open';

/** How long launch may wait on the update check before the app is shown anyway. */
const CHECK_BUDGET_MS = 3000;

/** Native screen shown across the runtime restart, so the reload is not a white flash. */
const RELOAD_SCREEN = {
  backgroundColor: COLORS.primary,
  spinner: { enabled: true, color: COLORS.white, size: 'large' as const },
  fade: true,
};

/**
 * Applies a pending OTA update at launch behind a branded loader, then restarts
 * the app itself. The check is time-boxed: if it is slow the app opens on the
 * current version and the update is left staged for the next launch, so an
 * update can never interrupt someone mid-task.
 */
export default function UpdateGate({ children }: { children: React.ReactNode }) {
  const enabled = Updates.isEnabled && !__DEV__;
  const [phase, setPhase] = useState<Phase>(enabled ? 'checking' : 'open');
  const { isUpdatePending, downloadProgress } = Updates.useUpdates();
  const openedRef = useRef(!enabled);

  // Time-box the check so a slow or offline network never stalls the launch.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      setPhase((current) => {
        if (current !== 'checking') return current;
        openedRef.current = true;
        return 'open';
      });
    }, CHECK_BUDGET_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (cancelled || openedRef.current) return;
        if (!check.isAvailable) {
          openedRef.current = true;
          setPhase('open');
          return;
        }
        setPhase('downloading');
        await Updates.fetchUpdateAsync();
      } catch {
        // Offline, rate limited, or unreachable: keep running what we have.
        if (!cancelled && !openedRef.current) {
          openedRef.current = true;
          setPhase('open');
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Applies both the update we just fetched and one staged by a background check.
  useEffect(() => {
    if (!isUpdatePending || openedRef.current) return;
    setPhase('restarting');
    Updates.reloadAsync({ reloadScreenOptions: RELOAD_SCREEN }).catch(() => {
      openedRef.current = true;
      setPhase('open');
    });
  }, [isUpdatePending]);

  if (phase === 'open') return <>{children}</>;

  const pct = Math.round(Math.min(Math.max(downloadProgress ?? 0, 0), 1) * 100);

  return (
    <View style={s.container}>
      <Text style={s.title}>My Vaastu Pandit</Text>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={s.message}>
        {phase === 'checking' && 'Checking for updates…'}
        {phase === 'downloading' && 'Downloading the latest version…'}
        {phase === 'restarting' && 'Restarting to apply the update…'}
      </Text>
      {phase === 'downloading' && (
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.max(pct, 5)}%` }]} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: COLORS.background,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
