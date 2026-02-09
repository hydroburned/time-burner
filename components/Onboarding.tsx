
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Target, Flame, ChevronRight, User } from 'lucide-react';
import { useStore } from '../store';
import { Button, Input } from './UI';

const steps = [
  {
    title: "Welcome to Time Burner",
    description: "A high-performance routine optimizer designed to manage your biological fuel and creative burn.",
    icon: Shield,
    color: "text-cyan-400"
  },
  {
    title: "Fuel and Burn",
    description: "Recovery protocols fill your tank (Fuel). Deep Work sessions consume it (Burn). Maintain balance to avoid core failure.",
    icon: Flame,
    color: "text-orange-500"
  },
  {
    title: "Orbital Timeline",
    description: "Your day is a 24h orbital cycle. Visual slots help you track focus blocks and recovery resets in real-time.",
    icon: Zap,
    color: "text-cyan-400"
  }
];

export const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const completeOnboarding = useStore(state => state.completeOnboarding);
  const updateUserConfig = useStore(state => state.updateUserConfig);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (index < currentStep) {
      setCurrentStep(index);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (currentStep < steps.length || name.trim()) {
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
      // Small delay to ensure render complete
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    // Changed: p-0 to remove outer padding, px-8 for content (16px visual)
    <div className="fixed inset-0 z-[200] bg-black overflow-y-auto overflow-x-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center p-0 select-none w-full">
        <AnimatePresence mode="wait">
          {currentStep < steps.length ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              // Mobile: px-8 (16px) margins
              className="w-full max-w-[40rem] lg:max-w-[55rem] text-center space-y-12 my-auto px-8"
            >
              <div className="flex justify-center">
                <div className="p-12 rounded-[4rem] bg-zinc-900 border border-white/5 shadow-2xl relative">
                  <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full" />
                  {React.createElement(steps[currentStep].icon, { className: `w-20 h-20 relative z-10 ${steps[currentStep].color}` })}
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Title: type-h1 (32px) */}
                <h2 className="type-h1 leading-tight">
                  {steps[currentStep].title}
                </h2>
                {/* Desc: type-body (16px) */}
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
                    title={i < currentStep ? "Back to Step " + (i+1) : ""}
                  />
                ))}
                <div className={`h-3 w-3 rounded-full transition-colors ${currentStep === steps.length ? 'bg-cyan-400' : 'bg-zinc-800'}`} />
              </div>
              
              {/* Added relative and z-50 to ensure clickable */}
              <div className="flex justify-center relative z-50">
                  <Button variant="primary" onClick={handleNext} className="w-full max-w-[30rem] h-24 type-h3">
                  Next <ChevronRight className="w-6 h-6" />
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
                  <h2 className="type-h1">Identify Operator</h2>
                  <p className="type-body text-zinc-500 mt-6 px-4">Establish your system codename for local synchronization.</p>
                </div>

                <div className="space-y-4">
                  {/* Label: type-label (12px) */}
                  <label className="type-label text-zinc-600 ml-3">Codename</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CHRONOS_01"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-[3rem] px-10 py-8 type-h3 focus:outline-none focus:border-cyan-500 transition-all font-bold text-white placeholder-white/5"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-center w-full relative z-50">
                  <Button variant="primary" disabled={!name.trim()} onClick={handleNext} className="w-full max-w-[30rem] h-24 type-h3">
                  Complete Sequence
                  </Button>
              </div>
              
              <button 
                onClick={() => setCurrentStep(steps.length - 1)}
                // Go Back: type-label
                className="type-label text-zinc-600 hover:text-zinc-400 relative z-20"
              >
                Go Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
