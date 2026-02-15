
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, ViewType, ActivityDefinition, Protocol, UserConfig, ActivityLog, DayState, ChecklistItem, UserInfo, Language } from './types';
import { DEFAULT_PROTOCOL, DEFAULT_PROTOCOL_RU } from './constants';
import { getDayId } from './utils';

const DEFAULT_PROTOCOL_ID = 'default-biohacker-v1';

interface ExtendedAppState extends AppState {
    setLanguage: (lang: Language) => void;
}

export const useStore = create<ExtendedAppState>()(
  persist(
    (set, get) => ({
      view: 'DAY',
      returnView: 'DAY',
      selectedDate: getDayId(new Date()),
      energy: 50,
      currentUser: null,
      
      // Initial Data: Only TODAY has a protocol.
      days: {
        [getDayId(new Date())]: {
          date: getDayId(new Date()),
          protocolId: DEFAULT_PROTOCOL_ID,
          completedActivityIds: [],
          activityLogs: {},
          dailyNote: '',
          dailyChecklist: []
        },
      },
      protocols: [
        { 
          id: DEFAULT_PROTOCOL_ID, 
          name: 'Standard Protocol', 
          activities: DEFAULT_PROTOCOL 
        }
      ],
      userConfig: {
        name: 'Operator',
        bio: 'Peak Performance Enthusiast',
        dailyGoal: 80,
        onboardingComplete: false,
        language: 'en' // Default language
      },

      setView: (view: ViewType) => set({ view }),
      setReturnView: (view: ViewType) => set({ returnView: view }),

      setCurrentUser: (user: UserInfo | null) => set({ currentUser: user }),

      replaceState: (newState: Partial<AppState>) => {
          set((state) => ({
              ...state,
              ...newState
          }));
          get().updateEnergy();
      },
      
      setLanguage: (lang: Language) => {
        set(state => {
            // Check if we are in onboarding (or just started). 
            // If the default protocol hasn't been modified (simplified check by ID and name), swap it.
            // This is a bit aggressive but necessary for the "First Step" experience.
            let newProtocols = [...state.protocols];
            const defaultProtoIndex = newProtocols.findIndex(p => p.id === DEFAULT_PROTOCOL_ID);
            
            if (defaultProtoIndex !== -1 && !state.userConfig.onboardingComplete) {
                // Swap content based on language
                newProtocols[defaultProtoIndex] = {
                    ...newProtocols[defaultProtoIndex],
                    name: lang === 'ru' ? 'Стандартный Протокол' : 'Standard Protocol',
                    activities: lang === 'ru' ? DEFAULT_PROTOCOL_RU : DEFAULT_PROTOCOL
                };
            }

            return {
                userConfig: { ...state.userConfig, language: lang },
                protocols: newProtocols
            };
        });
      },

      setSelectedDate: (date: string) => {
        set((state) => {
          // If visiting a new date, ensure it exists in state
          if (!state.days[date]) {
            return {
              selectedDate: date,
              days: {
                ...state.days,
                [date]: { 
                  date: date, 
                  protocolId: '', // Empty string indicates no protocol
                  completedActivityIds: [],
                  activityLogs: {},
                  dailyNote: '',
                  dailyChecklist: []
                },
              },
            };
          }
          return { selectedDate: date };
        });
        get().updateEnergy();
      },

      toggleActivity: (date: string, activityId: string) => {
        set((state) => {
          const day = state.days[date];
          if (!day) return state;

          const isCompleted = day.completedActivityIds.includes(activityId);
          let newCompleted = [];
          if (isCompleted) {
            newCompleted = day.completedActivityIds.filter(id => id !== activityId);
          } else {
            newCompleted = [...day.completedActivityIds, activityId];
          }

          return {
            days: {
              ...state.days,
              [date]: { ...day, completedActivityIds: newCompleted },
            },
          };
        });
        get().updateEnergy();
      },

      updateEnergy: () => {
        const state = get();
        const day = state.days[state.selectedDate];
        // If no day or no protocol, energy is default or 50
        if (!day || !day.protocolId) {
             set({ energy: 50 });
             return;
        }

        const protocol = state.protocols.find(p => p.id === day.protocolId);
        if (!protocol) return;

        let totalEnergy = 50;
        const completedSet = new Set(day.completedActivityIds);

        protocol.activities.forEach((a) => {
          if (completedSet.has(a.id)) {
            if (a.type === 'FUEL') totalEnergy += 15;
            if (a.type === 'BURN') totalEnergy -= 20;
            if (a.type === 'REST') totalEnergy += 5;
          }
        });

        set({ energy: Math.max(0, Math.min(100, totalEnergy)) });
      },

      updateActivityLog: (date: string, activityId: string, updates: Partial<ActivityLog>) => {
        set((state) => {
          const day = state.days[date];
          if (!day) return state;

          const currentLog = day.activityLogs[activityId] || { notes: '', checklist: [] };
          
          return {
            days: {
              ...state.days,
              [date]: {
                ...day,
                activityLogs: {
                  ...day.activityLogs,
                  [activityId]: { ...currentLog, ...updates }
                }
              }
            }
          };
        });
      },

      updateDailyNote: (date: string, note: string) => {
        set((state) => {
          const day = state.days[date];
          if (!day) return state;
          
          return {
            days: {
              ...state.days,
              [date]: { ...day, dailyNote: note }
            }
          };
        });
      },

      updateDailyChecklist: (date: string, checklist: ChecklistItem[]) => {
        set((state) => {
          const day = state.days[date];
          if (!day) return state;
          return {
            days: {
              ...state.days,
              [date]: { ...day, dailyChecklist: checklist }
            }
          };
        });
      },

      // --- PROTOCOL MANAGEMENT ---

      addProtocol: (name: string, activities: ActivityDefinition[]) => {
        const newProtocol: Protocol = {
          id: crypto.randomUUID(),
          name,
          activities,
          isCustom: false
        };
        
        set(state => {
           // Simply add to library, DO NOT auto-assign to day
           const updatedProtocols = [...state.protocols, newProtocol];
           return { protocols: updatedProtocols };
        });
        
        get().updateEnergy();
      },

      updateProtocol: (id: string, updates: Partial<Protocol>) => {
        set(state => ({
          protocols: state.protocols.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
        get().updateEnergy();
      },

      deleteProtocol: (id: string) => {
        set(state => {
          // 1. Remove protocol from library
          const newProtocols = state.protocols.filter(p => p.id !== id);
          
          // 2. Detach from ALL days using it (Reset to empty)
          const newDays: Record<string, DayState> = { ...state.days };
          Object.keys(newDays).forEach(key => {
            if (newDays[key].protocolId === id) {
              newDays[key] = { 
                ...newDays[key], 
                protocolId: '', 
                completedActivityIds: [],
                activityLogs: {}, 
                dailyNote: newDays[key].dailyNote,
                dailyChecklist: newDays[key].dailyChecklist
              };
            }
          });

          return { protocols: newProtocols, days: newDays };
        });
        get().updateEnergy();
      },

      // --- ACTIVITY MANAGEMENT (SYNCED) ---

      addActivityToProtocol: (protocolId: string, activity: ActivityDefinition) => {
        set(state => ({
          protocols: state.protocols.map(p => {
            if (p.id === protocolId) {
              return { ...p, activities: [...p.activities, activity] };
            }
            return p;
          })
        }));
        get().updateEnergy();
      },

      updateActivityInProtocol: (protocolId: string, activity: ActivityDefinition) => {
        set(state => ({
          protocols: state.protocols.map(p => {
            if (p.id === protocolId) {
              return {
                ...p,
                activities: p.activities.map(a => a.id === activity.id ? activity : a)
              };
            }
            return p;
          })
        }));
        get().updateEnergy();
      },

      removeActivityFromProtocol: (protocolId: string, activityId: string) => {
        set(state => {
          const updatedProtocols = state.protocols.map(p => {
            if (p.id === protocolId) {
              return {
                ...p,
                activities: p.activities.filter(a => a.id !== activityId)
              };
            }
            return p;
          });
          return { protocols: updatedProtocols };
        });
        get().updateEnergy();
      },

      // --- ASSIGNMENT & FORKING ---

      applyProtocolToDay: (date: string, protocolId: string) => {
        set(state => {
           // Ensure we create a new day object reference
           const existingDay = state.days[date] || { 
             date, 
             protocolId: '', 
             completedActivityIds: [], 
             activityLogs: {}, 
             dailyNote: '',
             dailyChecklist: []
           };
           return {
             days: {
               ...state.days,
               [date]: { 
                 ...existingDay,
                 protocolId, 
                 completedActivityIds: [] // Reset completion on new protocol
               }
             }
           };
        });
        get().updateEnergy();
      },
      
      detachProtocolForDay: (date: string) => {
        set(state => {
            const day = state.days[date];
            if (!day || !day.protocolId) return state;
            
            const parentProtocol = state.protocols.find(p => p.id === day.protocolId);
            if (!parentProtocol) return state;

            // Generate new Custom Protocol
            const newId = `custom-${date}-${crypto.randomUUID().slice(0,4)}`;
            const newProtocol: Protocol = {
                id: newId,
                name: `Custom (${new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`,
                activities: parentProtocol.activities.map(a => ({ ...a })), // Deep copy activities? No, shallow copy of array is enough if objects are treated immutable, but safer to copy objects
                isCustom: true
            };

            return {
                protocols: [...state.protocols, newProtocol],
                days: {
                    ...state.days,
                    [date]: {
                        ...day,
                        protocolId: newId
                        // Keep completion status? Yes, structure is same
                    }
                }
            };
        });
        get().updateEnergy();
      },

      updateUserConfig: (config: Partial<UserConfig>) => {
        set(state => ({ userConfig: { ...state.userConfig, ...config } }));
      },

      completeOnboarding: () => {
        set(state => ({ userConfig: { ...state.userConfig, onboardingComplete: true } }));
      },
      
      restartOnboarding: () => {
        set(state => ({ userConfig: { ...state.userConfig, onboardingComplete: false } }));
      }
    }),
    {
      name: 'time-burner-storage-v14', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
          // Persist everything
          ...state
      })
    }
  )
);
