/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ReactNode, useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Activity, 
  Brain, 
  Coffee, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut, 
  User as UserIcon,
  Zap,
  RefreshCw,
  Clock,
  TrendingUp,
  Smile,
  Frown,
  Battery,
  Target,
  MessageSquare,
  Bell,
  History,
  BarChart3,
  Save,
  ChevronRight,
  Info,
  Sparkles,
  LayoutDashboard,
  PieChart,
  Settings,
  Bluetooth,
  Loader2,
  Wifi,
  Check,
  Power,
  Edit2,
  SlidersHorizontal,
  HeartPulse,
  Radio,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  doc,
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface EEGData {
  id?: string;
  timestamp: any;
  alpha: number;
  beta: number;
  theta: number;
  delta?: number;
  gamma?: number;
  heartRate?: number;
  hrv?: number;
  signalQuality?: number;
  rawVoltage?: number;
  stressLevel: number;
  cognitiveLoad: number;
  mood?: string;
  notes?: string;
}

interface Recommendation {
  id: string;
  type: 'REST' | 'FOCUS' | 'STRETCH';
  message: string;
  timestamp: any;
  read: boolean;
}

// Error Boundary Component
// Removed due to TS compatibility issues in this environment

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  return (
    <BrAIApp />
  );
}

function BrAIApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState<EEGData[]>([]);
  const [mockReadings, setMockReadings] = useState<EEGData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [mockRecommendations, setMockRecommendations] = useState<Recommendation[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentMood, setCurrentMood] = useState<string>('None');
  const [moodNotes, setMoodNotes] = useState<string>('');
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({ enabled: false, interval: 30 });
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'history' | 'ai' | 'recommendations' | 'settings' | 'telemetry'>('dashboard');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [hardwareState, setHardwareState] = useState<'disconnected' | 'searching' | 'connected'>('disconnected');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appState, setAppState] = useState<'preloader' | 'onboarding' | 'generating' | 'dashboard'>('preloader');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [liveBiometrics, setLiveBiometrics] = useState({
    heartRate: 72,
    hrv: 45,
    signalQuality: 98,
    rawVoltage: 0.5
  });

  // Fast-updating live biometrics for demo effect
  useEffect(() => {
    if (hardwareState !== 'connected') return;
    
    const interval = setInterval(() => {
      setLiveBiometrics({
        heartRate: Math.floor(Math.random() * 15) + 65,
        hrv: Math.floor(Math.random() * 20) + 40,
        signalQuality: Math.floor(Math.random() * 5) + 95,
        rawVoltage: (Math.random() * 100 - 50)
      });
    }, 800);

    return () => clearInterval(interval);
  }, [hardwareState]);

  // Generate initial mock data for demo
  useEffect(() => {
    const initialMock: EEGData[] = [];
    const now = Date.now();
    
    let stressMultiplier = 1;
    let loadMultiplier = 1;
    
    if (onboardingData) {
      if (onboardingData.stressFrequency === 'Very Often') stressMultiplier = 1.5;
      if (onboardingData.stressFrequency === 'Rarely') stressMultiplier = 0.6;
      
      if (onboardingData.workingHours === '10+ hours') loadMultiplier = 1.4;
      if (onboardingData.workingHours === '4-6 hours') loadMultiplier = 0.7;
    }

    for (let i = 30; i > 0; i--) {
      const alpha = Math.random() * 40 + 10;
      const beta = (Math.random() * 60 + 20) * stressMultiplier;
      const theta = (Math.random() * 30 + 5) * loadMultiplier;
      const delta = Math.random() * 50 + 20;
      const gamma = Math.random() * 20 + 2;
      
      const stressLevel = (beta * 0.6 + theta * 0.4) - (alpha * 0.2);
      const cognitiveLoad = (beta + theta) / 2;

      initialMock.push({
        id: `mock-${i}`,
        timestamp: { toDate: () => new Date(now - i * 1000) } as any,
        alpha,
        beta,
        theta,
        delta,
        gamma,
        heartRate: Math.floor(Math.random() * 15) + 65,
        hrv: Math.floor(Math.random() * 20) + 40,
        signalQuality: Math.floor(Math.random() * 5) + 95,
        rawVoltage: (Math.random() * 100 - 50),
        stressLevel: Math.max(0, Math.min(100, stressLevel)),
        cognitiveLoad: Math.max(0, Math.min(100, cognitiveLoad)),
        mood: ['Focused', 'Calm', 'Tired', 'Stressed'][Math.floor(Math.random() * 4)],
      });
    }
    setMockReadings(initialMock);

    // Generate initial mock recommendations
    const initialMockRecs: Recommendation[] = [
      {
        id: 'mock-rec-1',
        type: 'FOCUS',
        message: 'Your cognitive load has been consistently high for the past 45 minutes. Consider taking a 5-minute micro-break to maintain optimal performance.',
        timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 5) } as any,
        read: false
      },
      {
        id: 'mock-rec-2',
        type: 'REST',
        message: 'Beta wave activity indicates rising stress levels. A short breathing exercise could help restore baseline calm.',
        timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 25) } as any,
        read: false
      },
      {
        id: 'mock-rec-3',
        type: 'FOCUS',
        message: 'Alpha wave synchronization is optimal. You are in a prime state for deep, focused work.',
        timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 60) } as any,
        read: false
      }
    ];
    setMockRecommendations(initialMockRecs);
  }, [onboardingData]);

  useEffect(() => {
    if (!isSimulating && hardwareState !== 'connected') return;

    let stressMultiplier = 1;
    let loadMultiplier = 1;
    
    if (onboardingData) {
      if (onboardingData.stressFrequency === 'Very Often') stressMultiplier = 1.5;
      if (onboardingData.stressFrequency === 'Rarely') stressMultiplier = 0.6;
      
      if (onboardingData.workingHours === '10+ hours') loadMultiplier = 1.4;
      if (onboardingData.workingHours === '4-6 hours') loadMultiplier = 0.7;
    }

    // Continuous mock data generation for demo effect
    const interval = setInterval(() => {
      setMockReadings(prev => {
        const last = prev[prev.length - 1] || {
          alpha: 25, beta: 40, theta: 15, delta: 35, gamma: 10,
          heartRate: 72, hrv: 50, signalQuality: 98, rawVoltage: 0
        };

        const now = Date.now();
        
        // Realistic drift: small random changes instead of total randomization
        const drift = (val: number, range: number, min: number, max: number) => {
          const change = (Math.random() - 0.5) * (range * 0.2); // 20% of range max change
          return Math.max(min, Math.min(max, val + change));
        };

        const alpha = drift(last.alpha, 40, 10, 50);
        const beta = drift(last.beta, 60, 15, 80) * stressMultiplier;
        const theta = drift(last.theta, 30, 5, 40) * loadMultiplier;
        const delta = drift(last.delta, 50, 10, 70);
        const gamma = drift(last.gamma, 20, 2, 25);
        
        // Correlated metrics
        const stressLevel = (beta * 0.7 + theta * 0.3) - (alpha * 0.1);
        const cognitiveLoad = (beta * 0.4 + theta * 0.6);

        const newReading = {
          id: `mock-${now}`,
          timestamp: { toDate: () => new Date(now) } as any,
          alpha,
          beta,
          theta,
          delta,
          gamma,
          heartRate: drift(last.heartRate, 15, 60, 95),
          hrv: drift(last.hrv, 20, 30, 70),
          signalQuality: Math.max(95, Math.min(100, last.signalQuality + (Math.random() - 0.5))),
          rawVoltage: (Math.random() * 40 - 20), // High frequency noise
          stressLevel: Math.max(0, Math.min(100, stressLevel)),
          cognitiveLoad: Math.max(0, Math.min(100, cognitiveLoad)),
          mood: last.mood || 'Focused',
        };
        
        // Occasionally change mood
        if (Math.random() > 0.95) {
          newReading.mood = ['Focused', 'Calm', 'Tired', 'Stressed'][Math.floor(Math.random() * 4)];
        }
        
        return [...prev.slice(1), newReading];
      });
    }, 500); // Faster updates for smoother feel

    return () => clearInterval(interval);
  }, [isSimulating, hardwareState, onboardingData]);

  const displayReadings = useMemo(() => {
    const formatData = (data: EEGData[]) => data.map((r, idx) => ({
      ...r,
      time: r.timestamp?.toDate ? r.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `T-${idx}`,
      timestampNum: r.timestamp?.toDate ? r.timestamp.toDate().getTime() : Date.now(),
      // Ensure numeric values for Recharts
      beta: Number(r.beta) || 0,
      alpha: Number(r.alpha) || 0,
      theta: Number(r.theta) || 0,
      delta: Number(r.delta) || 0,
      gamma: Number(r.gamma) || 0,
    }));

    // Prioritize mock data during simulation for real-time feel
    if (isSimulating) return formatData(mockReadings);
    if (readings.length >= 30) return formatData(readings);
    if (readings.length === 0) return formatData(mockReadings);
    
    // If we have some real readings, pad with older mock readings
    const needed = 30 - readings.length;
    const firstRealTimestamp = readings[0]?.timestamp?.toDate ? readings[0].timestamp.toDate().getTime() : Date.now();
    
    const paddingData: EEGData[] = [];
    for (let i = needed; i > 0; i--) {
      const mockIdx = Math.max(0, mockReadings.length - i);
      paddingData.push({
        ...(mockReadings[mockIdx] || mockReadings[0]),
        id: `padding-${i}`,
        timestamp: { toDate: () => new Date(firstRealTimestamp - i * 1000) } as any,
      });
    }
    
    return formatData([...paddingData, ...readings]);
  }, [readings, mockReadings, isSimulating]);

  const displayRecommendations = useMemo(() => {
    return recommendations.length > 0 ? recommendations : mockRecommendations;
  }, [recommendations, mockRecommendations]);

  // Correlation Analysis Logic
  const correlationData = useMemo(() => {
    const moodStats: Record<string, { stress: number[], load: number[], count: number }> = {};
    displayReadings.forEach(r => {
      if (r.mood && r.mood !== 'None') {
        if (!moodStats[r.mood]) moodStats[r.mood] = { stress: [], load: [], count: 0 };
        moodStats[r.mood].stress.push(r.stressLevel);
        moodStats[r.mood].load.push(r.cognitiveLoad);
        moodStats[r.mood].count++;
      }
    });

    return Object.entries(moodStats).map(([mood, stats]) => ({
      mood,
      avgStress: stats.stress.reduce((a, b) => a + b, 0) / stats.count,
      avgLoad: stats.load.reduce((a, b) => a + b, 0) / stats.count,
      count: stats.count
    }));
  }, [displayReadings]);

  const moodHistory = useMemo(() => {
    // Combine real readings with mock data for demo
    const realHistory = readings
      .filter(r => (r as any).isManualEntry || r.notes)
      .map(r => ({
        ...r,
        id: r.id || `real-${Math.random()}`
      }));

    const mockData = [];
    const endDate = new Date('2026-03-17T23:59:59Z');
    
    const moodsList = ['Focused', 'Calm', 'Tired', 'Stressed'];
    const notesList = [
      "Feeling really productive today.",
      "A bit overwhelmed with meetings.",
      "Good deep work session.",
      "Didn't sleep well, feeling it now.",
      "Smooth sailing, no major issues.",
      "High cognitive load from the new project.",
      "Relaxed evening after a long day.",
      "Need a break, eyes are tired.",
      "In the zone!",
      "Feeling anxious about the deadline."
    ];

    for (let i = 0; i < 90; i++) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      
      // Randomize time of day
      d.setHours(Math.floor(Math.random() * 14) + 8); // 8 AM to 10 PM
      d.setMinutes(Math.floor(Math.random() * 60));
      
      const progress = (90 - i) / 90; 
      
      // Stress goes down: 75 -> 30
      const baseStress = 75 - (45 * progress);
      const stress = Math.min(100, Math.max(0, baseStress + (Math.random() * 15 - 7.5)));

      // Cognitive Load stabilizes: 80 -> 50
      const baseLoad = 80 - (30 * progress);
      const cognitiveLoad = Math.min(100, Math.max(0, baseLoad + (Math.random() * 15 - 7.5)));

      let mood = '';
      if (stress > 65) {
        mood = 'Stressed';
      } else if (cognitiveLoad > 70) {
        mood = 'Focused';
      } else if (stress < 40 && cognitiveLoad < 50) {
        mood = 'Calm';
      } else {
        mood = moodsList[Math.floor(Math.random() * moodsList.length)];
      }

      mockData.push({
        id: `history-${i}`,
        timestamp: { toDate: () => new Date(d) } as any,
        mood: mood,
        stressLevel: stress,
        cognitiveLoad: cognitiveLoad,
        notes: Math.random() > 0.5 ? notesList[Math.floor(Math.random() * notesList.length)] : undefined
      });
    }
    return [...realHistory, ...mockData].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [readings]);

  // 3-Month Mock Progress Data for MVP Demo
  const threeMonthProgress = useMemo(() => {
    const data = [];
    const now = new Date('2026-03-17T23:59:59Z');
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      
      const progress = (90 - i) / 90; 
      
      // Focus goes up: 40 -> 80
      const baseFocus = 40 + (40 * progress);
      const focus = Math.min(100, Math.max(0, baseFocus + (Math.random() * 15 - 7.5)));
      
      // Stress goes down: 75 -> 30
      const baseStress = 75 - (45 * progress);
      const stress = Math.min(100, Math.max(0, baseStress + (Math.random() * 15 - 7.5)));

      // HRV goes up: 40 -> 65
      const baseHrv = 40 + (25 * progress);
      const hrv = Math.min(100, Math.max(0, baseHrv + (Math.random() * 10 - 5)));

      // Sleep Quality goes up: 50 -> 85
      const baseSleep = 50 + (35 * progress);
      const sleepQuality = Math.min(100, Math.max(0, baseSleep + (Math.random() * 12 - 6)));

      // Recovery goes up: 45 -> 90
      const baseRecovery = 45 + (45 * progress);
      const recoveryScore = Math.min(100, Math.max(0, baseRecovery + (Math.random() * 10 - 5)));

      // Cognitive Load stabilizes: 80 -> 50
      const baseLoad = 80 - (30 * progress);
      const cognitiveLoad = Math.min(100, Math.max(0, baseLoad + (Math.random() * 15 - 7.5)));

      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        focus: Math.round(focus),
        stress: Math.round(stress),
        hrv: Math.round(hrv),
        sleepQuality: Math.round(sleepQuality),
        recoveryScore: Math.round(recoveryScore),
        cognitiveLoad: Math.round(cognitiveLoad)
      });
    }
    return data;
  }, []);

  const moods = [
    { id: 'Focused', icon: <Target className="w-4 h-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', hex: '#10b981' },
    { id: 'Calm', icon: <Smile className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10', hex: '#3b82f6' },
    { id: 'Tired', icon: <Battery className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-500/10', hex: '#f59e0b' },
    { id: 'Stressed', icon: <Frown className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/10', hex: '#ef4444' },
  ];

  // Load reminder settings
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().reminderSettings) {
        setReminderSettings(docSnap.data().reminderSettings);
      }
    };
    fetchSettings();
  }, [user]);

  // Reminder notification logic (simulated with a simple alert for demo)
  useEffect(() => {
    if (!reminderSettings.enabled || !user) return;
    
    const interval = setInterval(() => {
      // In a real app, this would be a push notification
      console.log("REMINDER: Time to log your mood!");
    }, reminderSettings.interval * 60000);

    return () => clearInterval(interval);
  }, [reminderSettings, user]);

  const saveReminderSettings = async (settings: typeof reminderSettings) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        reminderSettings: settings
      }, { merge: true });
      setReminderSettings(settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Ensure user doc exists
        const userRef = doc(db, 'users', u.uid);
        getDoc(userRef).then((snap) => {
          if (!snap.exists()) {
            setDoc(userRef, {
              uid: u.uid,
              email: u.email || null,
              displayName: u.displayName || null,
              photoURL: u.photoURL || null,
              createdAt: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`));
          }
        });
        
        const savedData = localStorage.getItem(`brai_onboarding_data_${u.uid}`);
        if (savedData) {
          const data = JSON.parse(savedData);
          // Force name to admin as requested
          if (data.name !== 'admin') {
            data.name = 'admin';
            localStorage.setItem(`brai_onboarding_data_${u.uid}`, JSON.stringify(data));
          }
          setOnboardingData(data);
        } else {
          // Default for new users
          setOnboardingData({ name: 'admin' });
        }
        setAppState('preloader');
      }
    });
    return () => unsubscribe();
  }, []);

  // App State Transitions
  useEffect(() => {
    if (loading || !user) return;

    if (appState === 'preloader') {
      const timer = setTimeout(() => {
        const hasOnboarded = localStorage.getItem(`brai_onboarded_${user.uid}`);
        if (hasOnboarded) {
          setAppState('dashboard');
        } else {
          setAppState('onboarding');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (appState === 'generating') {
      const timer = setTimeout(() => {
        localStorage.setItem(`brai_onboarded_${user.uid}`, 'true');
        if (onboardingData) {
          localStorage.setItem(`brai_onboarding_data_${user.uid}`, JSON.stringify(onboardingData));
        }
        setAppState('dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [appState, loading, user, onboardingData]);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const readingsQuery = query(
      collection(db, 'users', user.uid, 'readings'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );

    const recsQuery = query(
      collection(db, 'users', user.uid, 'recommendations'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubReadings = onSnapshot(readingsQuery, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EEGData[];
      setReadings(data.reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/readings`);
    });

    const unsubRecs = onSnapshot(recsQuery, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recommendation[];
      setRecommendations(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/recommendations`);
    });

    return () => {
      unsubReadings();
      unsubRecs();
    };
  }, [user]);

  // Simulation Logic
  useEffect(() => {
    if (!isSimulating || !user) return;

    const interval = setInterval(async () => {
      const alpha = Math.random() * 40 + 10;
      const beta = Math.random() * 60 + 20;
      const theta = Math.random() * 30 + 5;
      const delta = Math.random() * 50 + 20;
      const gamma = Math.random() * 20 + 2;
      
      const heartRate = Math.floor(Math.random() * 15) + 65; // 65-80 bpm
      const hrv = Math.floor(Math.random() * 20) + 40; // 40-60 ms
      const signalQuality = Math.floor(Math.random() * 5) + 95; // 95-100%
      const rawVoltage = (Math.random() * 100 - 50); // -50 to 50 µV
      
      // Simple stress calculation logic
      const stressLevel = (beta * 0.6 + theta * 0.4) - (alpha * 0.2);
      const cognitiveLoad = (beta + theta) / 2;

      const reading: Omit<EEGData, 'id'> = {
        timestamp: serverTimestamp(),
        alpha,
        beta,
        theta,
        delta,
        gamma,
        heartRate,
        hrv,
        signalQuality,
        rawVoltage,
        stressLevel: Math.max(0, Math.min(100, stressLevel)),
        cognitiveLoad: Math.max(0, Math.min(100, cognitiveLoad)),
        mood: null,
        notes: null
      };

      if (hardwareState === 'connected') {
        setBatteryLevel(prev => Math.max(0, prev - 0.1));
      }

      try {
        await addDoc(collection(db, 'users', user.uid, 'readings'), {
          ...reading,
          userId: user.uid
        });

        // Trigger recommendation if stress is high
        if (stressLevel > 65 && Math.random() > 0.7) {
          await addDoc(collection(db, 'users', user.uid, 'recommendations'), {
            userId: user.uid,
            timestamp: serverTimestamp(),
            type: 'REST',
            message: 'High cognitive load detected. Time for a 5-minute break.',
            read: false
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/readings`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, user, hardwareState]);

  const saveMoodEntry = async () => {
    if (!user) return;
    setIsSavingMood(true);
    
    // Get current brainwave state from mock or real data
    const latest = readings[readings.length - 1] || mockReadings[mockReadings.length - 1];
    
    try {
      await addDoc(collection(db, 'users', user.uid, 'readings'), {
        timestamp: serverTimestamp(),
        userId: user.uid,
        mood: currentMood !== 'None' ? currentMood : null,
        notes: moodNotes.trim() || null,
        // Include current brainwave snapshot if available
        alpha: latest?.alpha || 0,
        beta: latest?.beta || 0,
        theta: latest?.theta || 0,
        delta: latest?.delta || 0,
        gamma: latest?.gamma || 0,
        stressLevel: latest?.stressLevel || 0,
        cognitiveLoad: latest?.cognitiveLoad || 0,
        isManualEntry: true
      });
      
      // Clear after saving
      setMoodNotes('');
      // Optional: don't clear mood if they want to keep it active
      
      // Show success
      setToastMessage("Session entry logged successfully");
      console.log("Mood entry logged successfully");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/readings`);
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = () => signOut(auth);
  const seedMvpData = async () => {
    if (!user) return;
    setToastMessage("Seeding MVP data...");
    try {
      const batch = writeBatch(db);
      const now = Date.now();
      
      // Generate 30 points of data
      for (let i = 30; i > 0; i--) {
        const alpha = Math.random() * 40 + 10;
        const beta = Math.random() * 60 + 20;
        const theta = Math.random() * 30 + 5;
        const delta = Math.random() * 50 + 20;
        const gamma = Math.random() * 20 + 2;
        
        const stressLevel = (beta * 0.6 + theta * 0.4) - (alpha * 0.2);
        const cognitiveLoad = (beta + theta) / 2;

        const readingRef = doc(collection(db, 'users', user.uid, 'readings'));
        batch.set(readingRef, {
          userId: user.uid,
          timestamp: Timestamp.fromMillis(now - i * 1000),
          alpha,
          beta,
          theta,
          delta,
          gamma,
          stressLevel: Math.max(0, Math.min(100, stressLevel)),
          cognitiveLoad: Math.max(0, Math.min(100, cognitiveLoad)),
          mood: ['Focused', 'Calm', 'Tired', 'Stressed'][Math.floor(Math.random() * 4)],
        });
      }

      await batch.commit();
      setToastMessage("MVP data seeded successfully");
    } catch (err) {
      console.error("Seeding failed:", err);
      setToastMessage("Failed to seed data");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };;

  const toggleHardwareConnection = () => {
    if (hardwareState === 'connected' || hardwareState === 'searching') {
      setHardwareState('disconnected');
      setIsSimulating(false);
    } else {
      setHardwareState('searching');
      setTimeout(() => {
        setHardwareState('connected');
        setIsSimulating(true);
        setBatteryLevel(Math.floor(Math.random() * 20) + 80); // 80-100%
        seedMvpData(); // Seed data when starting MVP demo
      }, 2000);
    }
  };

  const sendHardwareCommand = (command: string) => {
    setToastMessage(`Signal sent to physical hardware: ${command}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const generateAiInsight = async () => {
    if (!user || displayReadings.length === 0) return;
    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const dataSummary = displayReadings.slice(-20).map(r => ({
        time: r.timestamp?.toDate ? r.timestamp.toDate().toLocaleTimeString() : 'now',
        stress: Math.round(r.stressLevel),
        load: Math.round(r.cognitiveLoad),
        mood: r.mood || 'None'
      }));

      const prompt = `As a neuro-adaptive cognitive coach, analyze the following recent EEG and mood data for a knowledge worker:
      ${JSON.stringify(dataSummary)}
      
      Provide a concise, 3-sentence insight about their current mental state and one specific, actionable recommendation to optimize their focus or recovery. Use a professional yet encouraging tone.`;

      const result = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }]
      });

      setAiInsight(result.text || "Unable to generate insights at this time.");
    } catch (err) {
      console.error("AI Generation failed:", err);
      setAiInsight("Error generating AI insights. Please try again.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
              <Brain className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">BrAI</h1>
            <p className="text-zinc-400 text-lg">Neuro-adaptive cognitive optimization for the modern knowledge worker.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-semibold py-4 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3"
          >
            <UserIcon className="w-5 h-5" />
            Sign in with Google
          </button>
          <p className="text-zinc-500 text-sm">
            Connect your EEG device or use the simulation mode to begin.
          </p>
        </motion.div>
      </div>
    );
  }

  if (appState === 'preloader') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8"
        >
          <Brain className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Configuring Hardware</h2>
        <p className="text-zinc-500 mt-2">Establishing neural link...</p>
      </div>
    );
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={(data) => {
      setOnboardingData(data);
      setAppState('generating');
    }} />;
  }

  if (appState === 'generating') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full mb-8"
        />
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Generating Your Profile</h2>
        <p className="text-zinc-500 mt-2">Calibrating baseline metrics...</p>
      </div>
    );
  }

  const updateProfileName = () => {
    if (!user || !newProfileName.trim()) return;
    const updatedData = { ...onboardingData, name: newProfileName };
    setOnboardingData(updatedData);
    localStorage.setItem(`brai_onboarding_data_${user.uid}`, JSON.stringify(updatedData));
    setIsProfileModalOpen(false);
    setToastMessage("Profile updated successfully");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const latestReading = displayReadings[displayReadings.length - 1];

  const getGreeting = (stressLevel: number) => {
    if (stressLevel < 30) return "You're looking calm and focused today.";
    if (stressLevel < 60) return "You're doing well, keep it up.";
    if (stressLevel < 80) return "Things seem a bit tense. Remember to breathe.";
    return "High stress detected. Consider taking a short break.";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans">
      {/* Navigation */}
      <nav className="border-b border-zinc-800/50 bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Brain className="w-5 h-5 sm:w-8 h-8 text-emerald-500" />
            <span className="text-base sm:text-xl font-bold tracking-tight">BrAI</span>
            <div className="hidden lg:flex flex-col ml-6 pl-6 border-l border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Hello, {onboardingData?.name || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                </span>
                <button 
                  onClick={() => {
                    setNewProfileName(onboardingData?.name || '');
                    setIsProfileModalOpen(true);
                  }}
                  className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-zinc-500">
                {latestReading ? getGreeting(latestReading.stressLevel) : 'Analyzing your neural patterns...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Hardware Status & MVP Demo */}
            <div className="flex items-center gap-2 sm:gap-4 border-r border-zinc-800 pr-2 sm:pr-6">
              <div className="flex items-center gap-2">
                {hardwareState === 'disconnected' && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden lg:inline">Disconnected</span>
                  </div>
                )}
                {hardwareState === 'searching' && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Loader2 className="w-3 h-3 sm:w-4 h-4 animate-spin" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden lg:inline">Searching...</span>
                  </div>
                )}
                {hardwareState === 'connected' && (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden lg:inline">Live ({Math.round(batteryLevel)}%)</span>
                  </div>
                )}
              </div>
              <button
                onClick={toggleHardwareConnection}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 sm:gap-2 border",
                  hardwareState === 'connected' || hardwareState === 'searching'
                    ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                )}
              >
                <Bluetooth className="w-3 h-3" />
                <span className="hidden sm:inline">{hardwareState === 'disconnected' ? 'Start MVP Demo' : 'Disconnect'}</span>
                <span className="sm:hidden">{hardwareState === 'disconnected' ? 'Demo' : 'Stop'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1 sm:py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-5 h-5 sm:w-6 h-6 rounded-full" />
              ) : (
                <UserIcon className="w-5 h-5 sm:w-6 h-6 text-zinc-400" />
              )}
              <span className="text-xs sm:text-sm font-medium text-zinc-300 hidden sm:inline">{onboardingData?.name || user.displayName || 'User'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1 sm:p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-full overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Dashboard" 
            />
            <TabButton 
              active={activeTab === 'telemetry'} 
              onClick={() => setActiveTab('telemetry')} 
              icon={<Activity className="w-4 h-4" />} 
              label="90-Day Telemetry" 
            />
            <TabButton 
              active={activeTab === 'analysis'} 
              onClick={() => setActiveTab('analysis')} 
              icon={<PieChart className="w-4 h-4" />} 
              label="Analysis" 
            />
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
              icon={<History className="w-4 h-4" />} 
              label="History" 
            />
            <TabButton 
              active={activeTab === 'ai'} 
              onClick={() => setActiveTab('ai')} 
              icon={<Sparkles className="w-4 h-4" />} 
              label="AI Insights" 
            />
            <TabButton 
              active={activeTab === 'recommendations'} 
              onClick={() => setActiveTab('recommendations')} 
              icon={<Zap className="w-4 h-4" />} 
              label="Advisories" 
            />
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<Settings className="w-4 h-4" />} 
              label="Settings" 
            />
          </div>
        </div>

        <div className="w-full">
          {/* Main Content Area */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Header Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard 
                      label="Stress Level" 
                      value={latestReading?.stressLevel !== undefined ? `${Math.round(latestReading.stressLevel)}%` : '--'} 
                      icon={<AlertTriangle className="w-5 h-5" />}
                      trend={latestReading?.stressLevel > 60 ? 'High' : 'Optimal'}
                      color={latestReading?.stressLevel > 60 ? 'text-orange-500' : 'text-emerald-500'}
                    />
                    <StatCard 
                      label="Cognitive Load" 
                      value={latestReading?.cognitiveLoad !== undefined ? `${Math.round(latestReading.cognitiveLoad)}%` : '--'} 
                      icon={<Activity className="w-5 h-5" />}
                      trend={latestReading?.cognitiveLoad > 70 ? 'High' : latestReading?.cognitiveLoad > 40 ? 'Moderate' : 'Stable'}
                      color={latestReading?.cognitiveLoad > 70 ? 'text-orange-500' : 'text-blue-500'}
                    />
                  </div>

                  {/* Device Controls */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Device Controls
                      </h2>
                      {hardwareState === 'connected' && (
                        <span className="text-[10px] text-emerald-500 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-widest font-bold">
                          Hardware Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => sendHardwareCommand('Turn On')}
                        disabled={hardwareState !== 'connected'}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Power className="w-4 h-4" />
                        Turn On
                      </button>
                      <button
                        onClick={() => sendHardwareCommand('Calibrate')}
                        disabled={hardwareState !== 'connected'}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Calibrate
                      </button>
                      <button
                        onClick={() => sendHardwareCommand('Run Diagnostics')}
                        disabled={hardwareState !== 'connected'}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Activity className="w-4 h-4" />
                        Run Diagnostics
                      </button>
                    </div>
                  </div>

                  {/* Live Biometrics (MVP Demo Only) */}
                  {hardwareState === 'connected' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <HeartPulse className="w-6 h-6 text-rose-500 mb-2" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Heart Rate</span>
                        <span className="text-3xl font-light text-white">{liveBiometrics.heartRate} <span className="text-sm text-zinc-500">bpm</span></span>
                      </div>
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <Activity className="w-6 h-6 text-blue-500 mb-2" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">HRV</span>
                        <span className="text-3xl font-light text-white">{liveBiometrics.hrv} <span className="text-sm text-zinc-500">ms</span></span>
                      </div>
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <Radio className="w-6 h-6 text-emerald-500 mb-2" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Signal Quality</span>
                        <span className="text-3xl font-light text-white">{liveBiometrics.signalQuality} <span className="text-sm text-zinc-500">%</span></span>
                      </div>
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <Waves className="w-6 h-6 text-purple-500 mb-2" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Raw Voltage</span>
                        <span className="text-3xl font-light text-white">{liveBiometrics.rawVoltage.toFixed(1)} <span className="text-sm text-zinc-500">µV</span></span>
                      </div>
                    </motion.div>
                  )}

                  {/* 3-Month Progress (MVP Demo Only) */}
                  {hardwareState === 'connected' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            3-Month Cognitive Evolution
                          </h2>
                          <p className="text-zinc-500 text-sm">Demonstrating long-term neuro-plasticity and stress reduction</p>
                        </div>
                        <span className="text-[10px] text-blue-500 border border-blue-500/20 bg-blue-500/10 px-2 py-1 rounded uppercase tracking-widest font-bold">
                          MVP Demo Data
                        </span>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={threeMonthProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                              itemStyle={{ color: '#f4f4f5' }}
                            />
                            <Line type="monotone" dataKey="focus" name="Focus Capacity" stroke="#10b981" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="stress" name="Baseline Stress" stroke="#ef4444" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}

                  {/* Mood Selector & Notes */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 sm:p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Smile className="w-4 h-4" />
                        Current Mood
                      </h2>
                      {currentMood !== 'None' && (
                        <button 
                          onClick={() => {
                            setCurrentMood('None');
                            setMoodNotes('');
                          }}
                          className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-tighter"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                      {moods.map((mood) => (
                        <button
                          key={mood.id}
                          onClick={() => setCurrentMood(mood.id)}
                          className={cn(
                            "flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 sm:px-4 sm:py-2 rounded-xl border transition-all",
                            currentMood === mood.id 
                              ? cn("border-zinc-400 bg-zinc-800 shadow-lg shadow-black/20", mood.color) 
                              : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {mood.icon}
                          <span className="text-xs sm:text-sm font-medium">{mood.id}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-zinc-600" />
                      <textarea
                        placeholder="Enter daily context, notes, or specific events (e.g., 'Just finished a workout', 'Feeling focused before a meeting')..."
                        value={moodNotes}
                        onChange={(e) => setMoodNotes(e.target.value)}
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none h-24"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveMoodEntry}
                        disabled={isSavingMood || (currentMood === 'None' && !moodNotes.trim())}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                          isSavingMood || (currentMood === 'None' && !moodNotes.trim())
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/5"
                        )}
                      >
                        {isSavingMood ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Log Session Entry
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 sm:p-8">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold">
                          {hardwareState === 'connected' ? 'Neural Activity' : 'Last Captured Data'}
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm">
                          {hardwareState === 'connected' 
                            ? 'Real-time EEG wave analysis' 
                            : `Last Synced: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {hardwareState === 'connected' && (
                        <button 
                          onClick={() => setIsSimulating(!isSimulating)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                            isSimulating 
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          )}
                        >
                          <RefreshCw className={cn("w-4 h-4", isSimulating && "animate-spin")} />
                          {isSimulating ? "Streaming Live" : "Start Simulation"}
                        </button>
                      )}
                    </div>
                    
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayReadings}>
                          <defs>
                            <linearGradient id="colorBeta" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAlpha" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorTheta" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGamma" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDelta" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            hide 
                          />
                          <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            content={<CustomTooltip />}
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="beta" 
                            stroke="#10b981" 
                            fillOpacity={0.2} 
                            fill="url(#colorBeta)" 
                            strokeWidth={2}
                            name="Beta (Focus)"
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="alpha" 
                            stroke="#3b82f6" 
                            fillOpacity={0.2} 
                            fill="url(#colorAlpha)" 
                            strokeWidth={2}
                            name="Alpha (Relax)"
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="theta" 
                            stroke="#f59e0b" 
                            fillOpacity={0.1} 
                            fill="url(#colorTheta)"
                            strokeWidth={2}
                            name="Theta (Fatigue)"
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="gamma" 
                            stroke="#a855f7" 
                            fillOpacity={0.1} 
                            fill="url(#colorGamma)"
                            strokeWidth={2}
                            name="Gamma (Insight)"
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="delta" 
                            stroke="#ec4899" 
                            fillOpacity={0.1} 
                            fill="url(#colorDelta)"
                            strokeWidth={2}
                            name="Delta (Deep Sleep)"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Stress Analysis */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <h2 className="text-lg sm:text-xl font-bold mb-6">Cognitive Load Distribution</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8">
                      {(() => {
                        const total = (latestReading?.alpha || 0) + (latestReading?.beta || 0) + (latestReading?.theta || 0) + (latestReading?.delta || 0) + (latestReading?.gamma || 0) || 1;
                        return (
                          <>
                            <LoadIndicator label="Delta" value={((latestReading?.delta || 0) / total) * 100} color="bg-pink-500" />
                            <LoadIndicator label="Theta" value={((latestReading?.theta || 0) / total) * 100} color="bg-orange-500" />
                            <LoadIndicator label="Alpha" value={((latestReading?.alpha || 0) / total) * 100} color="bg-blue-500" />
                            <LoadIndicator label="Beta" value={((latestReading?.beta || 0) / total) * 100} color="bg-emerald-500" />
                            <LoadIndicator label="Gamma" value={((latestReading?.gamma || 0) / total) * 100} color="bg-purple-500" />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'telemetry' && (
                <motion.div
                  key="telemetry"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                          <Activity className="w-5 h-5 sm:w-6 h-6 text-emerald-500" />
                          90-Day Telemetry
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Aggregated neuro-physiological data</p>
                      </div>
                      <span className="w-fit text-[10px] text-blue-500 border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 rounded uppercase tracking-widest font-bold">
                        Live Sync Active
                      </span>
                    </div>

                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Avg Focus</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-light text-white">68<span className="text-sm text-zinc-500">%</span></span>
                          <span className="text-emerald-500 text-sm font-medium mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/>+24%</span>
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Avg Stress</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-light text-white">42<span className="text-sm text-zinc-500">%</span></span>
                          <span className="text-emerald-500 text-sm font-medium mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1 rotate-180"/>-35%</span>
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Avg HRV</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-light text-white">58<span className="text-sm text-zinc-500">ms</span></span>
                          <span className="text-emerald-500 text-sm font-medium mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/>+18ms</span>
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">Sleep Quality</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-light text-white">78<span className="text-sm text-zinc-500">%</span></span>
                          <span className="text-emerald-500 text-sm font-medium mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/>+28%</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart 1: Focus vs Stress */}
                    <div className="space-y-6 mb-12">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-200">Focus Capacity vs. Baseline Stress</h3>
                        <p className="text-sm text-zinc-500">Inverse correlation demonstrating neuro-plastic adaptation</p>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={threeMonthProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                              itemStyle={{ color: '#f4f4f5' }}
                            />
                            <Line type="monotone" dataKey="focus" name="Focus Capacity" stroke="#10b981" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="stress" name="Baseline Stress" stroke="#ef4444" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: HRV & Recovery */}
                    <div className="space-y-6 mb-12">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-200">Heart Rate Variability (HRV) & Recovery</h3>
                        <p className="text-sm text-zinc-500">Autonomic nervous system resilience over time</p>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={threeMonthProgress}>
                            <defs>
                              <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                              itemStyle={{ color: '#f4f4f5' }}
                            />
                            <Area type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHrv)" strokeWidth={2} />
                            <Area type="monotone" dataKey="recoveryScore" name="Recovery Score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRecovery)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 3: Sleep Quality & Cognitive Load */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-200">Sleep Quality vs. Cognitive Load</h3>
                        <p className="text-sm text-zinc-500">Impact of restorative sleep on daily cognitive capacity</p>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={threeMonthProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                              itemStyle={{ color: '#f4f4f5' }}
                              cursor={{ fill: '#27272a', opacity: 0.4 }}
                              formatter={(value: number) => [Math.round(value), ""]}
                            />
                            <Bar dataKey="sleepQuality" name="Sleep Quality" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="cognitiveLoad" name="Cognitive Load" stroke="#f59e0b" strokeWidth={3} dot={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {activeTab === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Mood Correlation Analysis */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold">Mood Correlation</h2>
                        <p className="text-zinc-500 text-xs sm:text-sm">How your mood aligns with neural metrics</p>
                      </div>
                      <BarChart3 className="w-5 h-5 sm:w-6 h-6 text-zinc-600" />
                    </div>

                    {correlationData.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {correlationData.map((data) => (
                            <div key={data.mood} className="p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-zinc-200">{data.mood}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{data.count} entries</span>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-500">Avg. Stress</span>
                                    <span className="text-zinc-300 font-mono">{Math.round(data.avgStress)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${data.avgStress}%` }}
                                      className="h-full bg-red-500/50"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-500">Avg. Cognitive Load</span>
                                    <span className="text-zinc-300 font-mono">{Math.round(data.avgLoad)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${data.avgLoad}%` }}
                                      className="h-full bg-blue-500/50"
                                    />
                                  </div>
                                </div>
                              </div>
                              {data.mood === 'Stressed' && data.avgLoad > 60 && (
                                <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                                  <Info className="w-3 h-3 text-orange-500 mt-0.5" />
                                  <p className="text-[10px] text-orange-200/70 leading-relaxed">
                                    When feeling stressed, your cognitive load tends to be {Math.round(data.avgLoad)}% higher than your baseline.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                          <BarChart3 className="w-6 h-6 text-zinc-700" />
                        </div>
                        <p className="text-zinc-500 text-sm max-w-[200px]">Log more moods to see correlation insights.</p>
                      </div>
                    )}
                  </div>

                  {/* Mood Trend Chart */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8">
                    <h2 className="text-xl font-bold mb-8">Mood Trends</h2>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="timestampNum" 
                            type="number"
                            domain={['auto', 'auto']}
                            hide 
                          />
                          <YAxis 
                            type="number" 
                            dataKey="stressLevel" 
                            name="Stress" 
                            stroke="#52525b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            label={{ value: 'Stress %', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }}
                          />
                          <ZAxis type="category" dataKey="mood" name="Mood" />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: any, name: string) => {
                              if (typeof value === 'number') return [Math.round(value), name];
                              return [value, name];
                            }}
                          />
                          <Scatter 
                            name="Moods" 
                            data={displayReadings.filter(r => r.mood && r.mood !== 'None')} 
                            fill="#8884d8"
                          >
                            {displayReadings.filter(r => r.mood && r.mood !== 'None').map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={moods.find(m => m.id === entry.mood)?.hex || '#fff'} 
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-6">
                      {moods.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.hex }} />
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{m.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Mood History Timeline */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" />
                        Full Mood History
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {moodHistory.length > 0 ? (
                        moodHistory.map((entry, idx) => (
                          <div key={entry.id || idx} className="relative pl-6 pb-6 border-l border-zinc-800 last:pb-0">
                            <div className={cn(
                              "absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0B]",
                              moods.find(m => m.id === entry.mood)?.bg.replace('/10', '') || 'bg-zinc-500'
                            )} />
                            <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-sm font-bold", moods.find(m => m.id === entry.mood)?.color)}>
                                    {entry.mood}
                                  </span>
                                  <span className="text-[10px] text-zinc-600 font-mono">
                                    {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : 'Just now'}
                                  </span>
                                  {(entry as any).isManualEntry && (
                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-bold uppercase tracking-tighter rounded border border-blue-500/20">
                                      Manual Log
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <div className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] text-zinc-500 border border-zinc-800">
                                    S: {Math.round(entry.stressLevel)}%
                                  </div>
                                  <div className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] text-zinc-500 border border-zinc-800">
                                    L: {Math.round(entry.cognitiveLoad)}%
                                  </div>
                                </div>
                              </div>
                              {entry.notes && (
                                <p className="text-xs text-zinc-400 italic leading-relaxed">
                                  "{entry.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-8 text-zinc-600 text-sm italic">No mood entries yet.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 sm:w-6 h-6 text-emerald-500" />
                          Gemini AI Insights
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Personalized cognitive analysis</p>
                      </div>
                      <button 
                        onClick={generateAiInsight}
                        disabled={isGeneratingAi || displayReadings.length === 0}
                        className="w-full sm:w-auto px-6 py-2 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Generate Analysis
                      </button>
                    </div>

                    {aiInsight ? (
                      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Brain className="w-5 h-5" />
                          <span className="text-sm font-bold uppercase tracking-widest">Neural Coach Report</span>
                        </div>
                        <p className="text-zinc-200 leading-relaxed italic">
                          "{aiInsight}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                          <Sparkles className="w-8 h-8 text-zinc-700" />
                        </div>
                        <div className="max-w-xs space-y-2">
                          <p className="text-zinc-300 font-bold">Ready for deep analysis?</p>
                          <p className="text-zinc-500 text-sm">Gemini will analyze your recent neural patterns and moods to provide tailored optimization strategies.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'recommendations' && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                          <Zap className="w-5 h-5 sm:w-6 h-6 text-blue-500" />
                          Neural Advisories
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Real-time recommendations</p>
                      </div>
                      <span className="w-fit bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Live Monitoring</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AnimatePresence mode="popLayout">
                        {displayRecommendations.length > 0 ? (
                          displayRecommendations.map((rec) => (
                            <motion.div 
                              key={rec.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full animate-pulse",
                                    rec.type === 'REST' ? "bg-orange-500" : "bg-blue-500"
                                  )} />
                                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    {rec.type} ADVISORY
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono">
                                  {rec.timestamp?.toDate ? rec.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                                </span>
                              </div>
                              <p className="text-zinc-200 leading-relaxed">
                                {rec.message}
                              </p>
                              <div className="pt-4 border-t border-zinc-700/30 flex justify-end">
                                <button className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold">
                                  Dismiss
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                              <CheckCircle2 className="w-8 h-8 text-zinc-700" />
                            </div>
                            <div className="max-w-xs mx-auto space-y-2">
                              <p className="text-zinc-300 font-bold">All Systems Clear</p>
                              <p className="text-zinc-500 text-sm">No critical cognitive alerts detected. Your current neural patterns are within optimal ranges.</p>
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Optimization Tip moved here too */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
                    <div className="relative z-10 space-y-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                        <Coffee className="w-5 h-5 sm:w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-emerald-500">Optimization Tip</h3>
                        <p className="text-emerald-500/70 text-xs sm:text-sm leading-relaxed mt-1">
                          Your Alpha waves are peaking. This is the perfect time for creative brainstorming or strategic planning.
                        </p>
                      </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <TrendingUp className="w-32 h-32 text-emerald-500" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                      <Settings className="w-6 h-6 text-zinc-400" />
                      Application Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {/* Reminder Settings */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Profile Information</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Manage your personal information and how you are addressed by the system.
                          </p>
                        </div>
                        
                        <div className="p-4 sm:p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block">Current Name</span>
                              <span className="text-sm font-medium text-zinc-300">{onboardingData?.name || 'User'}</span>
                            </div>
                            <button 
                              onClick={() => {
                                setNewProfileName(onboardingData?.name || '');
                                setIsProfileModalOpen(true);
                              }}
                              className="px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all whitespace-nowrap"
                            >
                              Edit Name
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Reminder Settings */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Cognitive Reminders</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Configure how often the system prompts you to log your mental state and mood.
                          </p>
                        </div>
                        
                        <div className="p-4 sm:p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-300">Enable Reminders</span>
                            <button 
                              onClick={() => saveReminderSettings({ ...reminderSettings, enabled: !reminderSettings.enabled })}
                              className={cn(
                                "w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors relative",
                                reminderSettings.enabled ? "bg-emerald-500" : "bg-zinc-700"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 sm:top-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full transition-all",
                                reminderSettings.enabled ? "left-6 sm:left-7" : "left-0.5 sm:left-1"
                              )} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Check-in Interval</label>
                            <div className="grid grid-cols-4 gap-2">
                              {[15, 30, 60, 120].map((interval) => (
                                <button
                                  key={interval}
                                  onClick={() => saveReminderSettings({ ...reminderSettings, interval })}
                                  className={cn(
                                    "py-2 rounded-xl text-[10px] sm:text-xs font-bold border transition-all",
                                    reminderSettings.interval === interval
                                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                      : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700"
                                  )}
                                >
                                  {interval >= 60 ? `${interval/60}h` : `${interval}m`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Summary */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">User Profile</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Your account information and data synchronization status.
                          </p>
                        </div>
                        
                        <div className="p-4 sm:p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <img src={user.photoURL || ''} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border border-zinc-800" />
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-200 truncate">{user.displayName}</p>
                              <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-zinc-800 space-y-3">
                            <div className="flex justify-between text-[10px] sm:text-xs">
                              <span className="text-zinc-500">Data Sync</span>
                              <span className="text-emerald-500 font-bold">Active</span>
                            </div>
                            <div className="flex justify-between text-[10px] sm:text-xs">
                              <span className="text-zinc-500">Storage Used</span>
                              <span className="text-zinc-300 font-mono">1.2 MB</span>
                            </div>
                          </div>
                          <button 
                            onClick={handleLogout}
                            className="w-full mt-2 sm:mt-4 py-2.5 sm:py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] sm:text-xs font-bold text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Display Name</label>
                  <input 
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-zinc-800 font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={updateProfileName}
                    className="flex-1 py-4 rounded-2xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:right-8 sm:left-auto z-50 flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/50"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-200">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
  color: string;
}) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-1.5 sm:p-2 bg-zinc-800 rounded-xl text-zinc-400">
          {icon}
        </div>
        <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-widest", color)}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-zinc-500 text-xs sm:text-sm font-medium">{label}</p>
        <motion.h3 
          key={value}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold mt-1"
        >
          {value}
        </motion.h3>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-800 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[240px]">
        <p className="text-zinc-500 text-xs font-mono mb-3 uppercase tracking-widest border-b border-zinc-800 pb-2">{label}</p>
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                  style={{ backgroundColor: entry.color || entry.stroke }} 
                />
                <span className="text-zinc-300 text-xs font-bold tracking-tight">{entry.name}</span>
              </div>
              <span className="text-white text-xs font-mono font-bold">
                {Number(entry.value).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function LoadIndicator({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        <span className="text-lg font-bold">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all whitespace-nowrap",
        active 
          ? "bg-zinc-800 text-white shadow-lg shadow-black/20" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      )}
    >
      <span className="scale-90 sm:scale-100">{icon}</span>
      {label}
    </button>
  );
}

function OnboardingFlow({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: 'admin',
    dob: '',
    gender: '',
    profession: '',
    workingHours: '',
    stressFrequency: '',
    primaryGoal: ''
  });

  const steps = [
    {
      title: "What is your name?",
      field: "name",
      type: "text",
      placeholder: "Enter your full name"
    },
    {
      title: "When were you born?",
      field: "dob",
      type: "date"
    },
    {
      title: "What is your gender?",
      field: "gender",
      type: "select",
      options: [
        { label: "Male" },
        { label: "Female" },
        { label: "Non-binary" },
        { label: "Prefer not to say" }
      ]
    },
    {
      title: "What is your primary profession?",
      field: "profession",
      type: "select",
      options: [
        { label: "Tech / Engineering" },
        { label: "Healthcare / Medical" },
        { label: "Finance / Business" },
        { label: "Creative / Design" },
        { label: "Student / Academic" },
        { label: "Other" }
      ]
    },
    {
      title: "Typical working hours?",
      field: "workingHours",
      type: "select",
      options: [
        { label: "4-6 hours" },
        { label: "8 hours" },
        { label: "10+ hours" }
      ]
    },
    {
      title: "How often do you feel stressed?",
      field: "stressFrequency",
      type: "select",
      options: [
        { label: "Rarely" },
        { label: "Sometimes" },
        { label: "Very Often" }
      ]
    },
    {
      title: "What is your primary goal with BrAI?",
      field: "primaryGoal",
      type: "select",
      options: [
        { label: "Reduce Stress & Anxiety" },
        { label: "Improve Deep Focus" },
        { label: "Optimize Peak Performance" },
        { label: "Better Work-Life Balance" }
      ]
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleSelect = (field: string, value: string) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    
    // Auto-advance for select types
    setTimeout(() => {
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        onComplete(newData);
      }
    }, 150);
  };

  const currentStep = steps[step];
  
  const isInputValid = () => {
    if (currentStep.type === 'text' || currentStep.type === 'date') {
      return data[currentStep.field as keyof typeof data].trim() !== '';
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-md w-full space-y-6 sm:space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{currentStep.title}</h2>
            <p className="text-zinc-400 text-sm sm:text-base">Step {step + 1} of {steps.length}</p>
          </div>
          
          <div className="grid gap-3 sm:gap-4 mt-6 sm:mt-8">
            {currentStep.type === 'select' ? (
              currentStep.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(currentStep.field, opt.label)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all"
                >
                  <span className="text-base sm:text-lg font-medium">{opt.label}</span>
                </button>
              ))
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <input
                  type={currentStep.type}
                  placeholder={currentStep.placeholder}
                  value={data[currentStep.field as keyof typeof data]}
                  onChange={(e) => setData({ ...data, [currentStep.field]: e.target.value })}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 p-3 sm:p-4 rounded-2xl text-base sm:text-lg text-white outline-none transition-all"
                  autoFocus
                />
                <button
                  onClick={handleNext}
                  disabled={!isInputValid()}
                  className="w-full bg-emerald-500 text-black font-bold py-3 sm:py-4 rounded-2xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

