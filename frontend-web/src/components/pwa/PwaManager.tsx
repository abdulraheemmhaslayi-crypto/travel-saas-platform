'use client';

import React, { useEffect, useState } from 'react';
import { 
  Download, Bell, X, Share, PlusSquare, Sparkles, Star, ShieldCheck, Zap 
} from 'lucide-react';

const VAPID_PUBLIC_KEY = 
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BID0ExjDkQXy3onl3AKZtuX5j687y-gzIZ7_Qq6xi8spRVUaXjIjqEBgYbQUjqT-7Q14O7xmmjd4uvOTpM7Agls';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if already installed / standalone
    const standaloneCheck = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(standaloneCheck);

    // If already installed, NEVER show install popup
    if (standaloneCheck) {
      registerServiceWorker();
      return;
    }

    // 2. Detect if mobile view strictly (< 768px or touch mobile)
    const checkMobile = () => {
      const mobileWidth = window.innerWidth < 768;
      const userAgentMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      return mobileWidth || userAgentMobile;
    };
    const mobile = checkMobile();
    setIsMobile(mobile);

    // 3. Detect iOS Safari
    const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // 4. Register Service Worker
    registerServiceWorker();

    // 5. Check if user dismissed prompt recently (snooze 24 hours)
    const dismissedTime = localStorage.getItem('kokan_pwa_dismissed');
    const isSnoozed = dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 24 * 60 * 60 * 1000;

    // 6. Capture beforeinstallprompt (Chrome / Android / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (mobile && !standaloneCheck && !isSnoozed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If on mobile and not standalone and not snoozed, display popup after fluid delay
    if (mobile && !standaloneCheck && !isSnoozed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('kokan_pwa_installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register Service Worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        setSwRegistration(reg);

        if ('Notification' in window) {
          setNotificationPermission(Notification.permission);
          if (Notification.permission === 'granted') {
            subscribePushUser(reg);
          }
        }
      } catch (err) {
        console.warn('[PWA] Service Worker registration failed:', err);
      }
    }
  };

  // Subscribe to Web Push
  const subscribePushUser = async (reg: ServiceWorkerRegistration) => {
    try {
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setPushSubscribed(true);
        await syncSubscriptionWithBackend(existingSub);
        return;
      }

      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setPushSubscribed(true);
      await syncSubscriptionWithBackend(newSub);
    } catch (err) {
      console.warn('[PWA] Push subscription error:', err);
    }
  };

  // Sync push subscription with backend
  const syncSubscriptionWithBackend = async (subscription: PushSubscription) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      await fetch(`${apiUrl}/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh') || [])))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth') || []))))
          },
          userAgent: navigator.userAgent
        })
      });
    } catch (e) {
      console.warn('[PWA] Failed to sync push subscription with backend:', e);
    }
  };

  // Handle Install button click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowPrompt(false);
    }
  };

  // Handle Request Notifications
  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) return;
    setIsSubscribingPush(true);
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted' && swRegistration) {
        await subscribePushUser(swRegistration);
      }
    } catch (err) {
      console.warn('[PWA] Permission request failed:', err);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('kokan_pwa_dismissed', Date.now().toString());
  };

  // Strict check: DO NOT render if already standalone/installed, OR not on mobile view, OR dismissed
  if (isStandalone || !isMobile || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pointer-events-auto sm:hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-[26px] bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-[0_-12px_40px_rgba(15,23,42,0.18)] p-4 max-w-md mx-auto">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 transition-all cursor-pointer z-10"
          aria-label="Dismiss install prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* ── Top Header Row with High-Res App Icon ─────────────────────────── */}
        <div className="flex items-center gap-3.5 pr-6 relative z-10">
          {/* Gemini-Generated 3D Squircle App Icon */}
          <div className="w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] rounded-2xl overflow-hidden shadow-md shadow-indigo-500/20 ring-1 ring-slate-900/10 shrink-0 bg-slate-100">
            <img
              src="/icons/app-icon.webp"
              alt="Kokan Travel App Icon"
              className="w-full h-full object-cover"
            />
          </div>

          {/* App Metadata & Badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                Kokan Travel
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] font-bold text-[10px] border border-indigo-100">
                Official App
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-tight truncate">
              Intercity Rides & Fleet Booking
            </p>

            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/80">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                4.9
              </span>
              <span className="font-semibold text-slate-300">•</span>
              <span className="font-semibold text-emerald-600">Free Install</span>
              <span className="font-semibold text-slate-300">•</span>
              <span className="font-medium text-slate-500">Fast & Lite</span>
            </div>
          </div>
        </div>

        {/* ── Quick Feature Highlights ──────────────────────────────────────── */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-[10px] font-bold text-slate-600">
          <div className="flex items-center justify-center gap-1 truncate">
            <Zap className="w-3 h-3 text-[#4F46E5]" />
            <span>Fast Booking</span>
          </div>
          <div className="flex items-center justify-center gap-1 truncate">
            <Bell className="w-3 h-3 text-indigo-500" />
            <span>Route Alerts</span>
          </div>
          <div className="flex items-center justify-center gap-1 truncate">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Offline Pass</span>
          </div>
        </div>

        {/* ── Push Notification Permission Box if not granted ───────────────── */}
        {notificationPermission !== 'granted' && (
          <div className="mt-2.5 bg-gradient-to-r from-indigo-50/90 to-purple-50/80 border border-indigo-100 rounded-2xl p-2.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">New Trip Alerts</p>
                <p className="text-[10px] text-slate-500 leading-tight truncate">Get notified when new routes are scheduled</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestNotifications}
              disabled={isSubscribingPush}
              className="px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] font-bold shrink-0 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSubscribingPush ? 'Enabling...' : 'Allow'}
            </button>
          </div>
        )}

        {/* ── Action Buttons ────────────────────────────────────────────────── */}
        <div className="mt-3 flex items-center gap-2">
          {isIOS && !deferredPrompt ? (
            /* iOS Instructions */
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">
                To install on your iPhone / iPad:
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span>1. Tap Share</span>
                <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                <span>2. Tap "Add to Home Screen"</span>
                <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" />
              </div>
            </div>
          ) : (
            /* Android / Chrome One-Tap Install */
            <>
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 h-11 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Install Kokan Travel</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Not Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
