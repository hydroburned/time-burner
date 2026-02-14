
export type SlotType = 'BURN' | 'FUEL' | 'REST' | 'VOID';

// The static definition of a slot (stored in Protocol)
export interface ActivityDefinition {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  duration: number; // in minutes
  type: SlotType;
  description: string;
  priority?: boolean;
  tags?: string[]; // New: Generic tags for categorization
}

// The computed instance for a specific day (includes completion status)
export interface Activity extends ActivityDefinition {
  completed: boolean;
  hasNotes?: boolean; // Visual indicator if log exists
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ActivityLog {
  notes: string;
  checklist: ChecklistItem[];
}

export interface DayState {
  date: string; // ISO string YYYY-MM-DD
  protocolId: string; // Reference to the Source of Truth
  completedActivityIds: string[]; // Only store what is done
  activityLogs: Record<string, ActivityLog>; // Keyed by activityId
  dailyNote: string;
  dailyChecklist: ChecklistItem[];
}

export interface Protocol {
  id: string;
  name: string;
  activities: ActivityDefinition[];
}

export interface UserConfig {
  name: string;
  bio: string;
  dailyGoal: number;
  onboardingComplete: boolean;
}

export interface UserInfo {
  uid: string;
  email: string | null;
  photoURL: string | null;
}

export type ViewType = 'MONTH' | 'WEEK' | 'DAY' | 'SETTINGS' | 'PROTOCOLS';

export interface AppState {
  view: ViewType;
  returnView: ViewType;
  selectedDate: string;
  energy: number;
  
  // Auth
  currentUser: UserInfo | null;
  
  // Data
  days: Record<string, DayState>;
  protocols: Protocol[];
  userConfig: UserConfig;
  
  // Navigation
  setView: (view: ViewType) => void;
  setReturnView: (view: ViewType) => void;
  setSelectedDate: (date: string) => void;
  
  // Auth Actions
  setCurrentUser: (user: UserInfo | null) => void;
  // Used for cloud sync to overwrite local state
  replaceState: (state: Partial<AppState>) => void;

  // Logic
  toggleActivity: (date: string, activityId: string) => void;
  updateEnergy: () => void;
  updateActivityLog: (date: string, activityId: string, updates: Partial<ActivityLog>) => void;
  updateDailyNote: (date: string, note: string) => void;
  updateDailyChecklist: (date: string, checklist: ChecklistItem[]) => void;
  
  // Protocol Management (The CRUD logic)
  addProtocol: (name: string, activities: ActivityDefinition[]) => void;
  updateProtocol: (id: string, updates: Partial<Protocol>) => void;
  deleteProtocol: (id: string) => void;
  
  // Protocol Content Management (Syncs everywhere)
  addActivityToProtocol: (protocolId: string, activity: ActivityDefinition) => void;
  updateActivityInProtocol: (protocolId: string, activity: ActivityDefinition) => void;
  removeActivityFromProtocol: (protocolId: string, activityId: string) => void;
  
  // Assignment
  applyProtocolToDay: (date: string, protocolId: string) => void;
  
  // User
  updateUserConfig: (config: Partial<UserConfig>) => void;
  completeOnboarding: () => void;
}