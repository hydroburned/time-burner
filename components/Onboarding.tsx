
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Target, Flame, ChevronRight, User, Globe } from 'lucide-react';
import { useStore } from '../store';
import { Button } from './UI';
import { useTranslation } from '../hooks/useTranslation';
import { Language } from '../types';

export const Onboarding: React.FC = () => {
  // Start at -1 to show language selection first
  const [currentStep, setCurrentStep] = useState(-1);
  const [name, setName] = useState('');
  const t = useTranslation();
  
  const userConfig = useStore(state => state.userConfig);
  const completeOnboarding = useStore(state => state.completeOnboarding);
  const updateUserConfig = useStore(state => state.updateUserConfig);
  const setLanguage = useStore(state => state.setLanguage);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
        title: t.onboarding.welcome_title,
        description: t.onboarding.welcome_desc,
        icon: Shield,
        color: "text-cyan-400"
    },
    {
        title: t.onboarding.fuel_title,
        description: t.onboarding.fuel_desc,
        icon: Flame,
        color: "text-orange-500"
    },
    {
        title: t.onboarding.timeline_title,
        description: t.onboarding.timeline_desc,
        icon: Zap,
        color: "text-cyan-400"
    }
  ];

  // Pre-fill name if it exists (Replay mode)
  useEffect(() => {
    if (userConfig.name && userConfig.name !== 'Operator') {
        setName(userConfig.name);
    }
    // If replay mode, skip language select
    if (userConfig.onboardingComplete) {
        setCurrentStep(0);
    }
  }, [userConfig.name, userConfig.onboardingComplete]);

  const handleLanguageSelect = (lang: Language) => {
      setLanguage(lang);
      setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      if (name.trim()) {
        updateUserConfig({ name: name.trim() });
        completeOnboarding();
      }
    }
  };

  const handleStepJump = (index: number) => {
    if (index < currentStep && currentStep >= 0) {
      setCurrentStep(index);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (currentStep >= 0 && (currentStep < steps.length || name.trim())) {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, name]);

  // Aggressive focus logic
  useEffect(() => {
    if (currentStep === steps.length) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  const isReplay = userConfig.name && userConfig.name !== 'Operator';

  // --- LANGUAGE SELECTION SCREEN ---
  if (currentStep === -1) {
      return (
        <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col items-center justify-center p-8">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[40rem] text-center space-y-12"
            >
                <div className="flex justify-center">
                    <div className="p-10 rounded-[3rem] bg-zinc-900 border border-white/5 shadow-2xl">
                        <Globe className="w-16 h-16 text-cyan-400" />
                    </div>
                </div>
                <div>
                    <h2 className="type-h1 text-white mb-4 whitespace-nowrap">Initialize System</h2>
                    <p className="type-body text-zinc-500">Select Interface Language</p>
                </div>
                <div className="grid gap-4 w-full">
                    <Button 
                        variant="secondary" 
                        onClick={() => handleLanguageSelect('en')}
                        className="w-full h-24 type-h3 rounded-[2rem]"
                    >
                        English
                    </Button>
                    <Button 
                        variant="secondary" 
                        onClick={() => handleLanguageSelect('ru')}
                        className="w-full h-24 type-h3 rounded-[2rem]"
                    >
                        Русский
                    </Button>
                </div>
            </motion.div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-y-auto overflow-x-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center p-0 select-none w-full">
        <AnimatePresence mode="wait">
          {currentStep < steps.length ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              className="w-full max-w-[40rem] lg:max-w-[55rem] text-center space-y-12 my-auto px-8"
            >
              <div className="flex justify-center">
                <div className="p-12 rounded-[4rem] bg-zinc-900 border border-white/5 shadow-2xl relative">
                  <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full" />
                  {React.createElement(steps[currentStep].icon, { className: `w-20 h-20 relative z-10 ${steps[currentStep].color}` })}
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="type-h1 leading-tight">
                  {steps[currentStep].title}
                </h2>
                <p className="type-body text-zinc-500 px-4">{steps[currentStep].description}</p>
              </div>

              <div className="flex justify-center gap-4 relative z-20">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleStepJump(i)}
                    className={`h-3 rounded-full transition-all duration-500 ${
                      i === currentStep 
                        ? 'w-16 bg-cyan-400' 
                        : i < currentStep 
                          ? 'w-8 bg-zinc-600 hover:bg-zinc-400 cursor-pointer' 
                          : 'w-3 bg-zinc-800'
                    }`}
                  />
                ))}
                <div className={`h-3 w-3 rounded-full transition-colors ${currentStep === steps.length ? 'bg-cyan-400' : 'bg-zinc-800'}`} />
              </div>
              
              <div className="flex justify-center relative z-50">
                  <Button variant="primary" onClick={handleNext} className="w-full max-w-[30rem] h-24 type-h3">
                  {t.onboarding.next} <ChevronRight className="w-6 h-6" />
                  </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="final"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[40rem] lg:max-w-[55rem] text-center space-y-12 my-auto px-8"
            >
              <div className="flex justify-center">
                <div className="p-12 rounded-[4rem] bg-zinc-900 border border-white/5 shadow-2xl">
                  <User className="w-20 h-20 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-10 text-left">
                <div className="text-center">
                  <h2 className="type-h1">{isReplay ? t.onboarding.confirmed : t.onboarding.identity_title}</h2>
                  <p className="type-body text-zinc-500 mt-6 px-4">
                    {isReplay ? t.onboarding.verified : t.onboarding.identity_desc}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="type-label text-zinc-600 ml-3">{t.settings.codename}</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CHRONOS_01"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-[3rem] px-10 py-8 type-h3 focus:outline-none focus:border-cyan-500 transition-all font-bold text-white placeholder-white/5"
                    autoFocus={!isReplay}
                  />
                </div>
              </div>

              <div className="flex justify-center w-full relative z-50">
                  <Button variant="primary" disabled={!name.trim()} onClick={handleNext} className="w-full max-w-[30rem] h-24 type-h3">
                  {isReplay ? t.onboarding.return : t.onboarding.complete}
                  </Button>
              </div>
              
              <button 
                onClick={() => setCurrentStep(steps.length - 1)}
                className="type-label text-zinc-600 hover:text-zinc-400 relative z-20"
              >
                {t.onboarding.back}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
