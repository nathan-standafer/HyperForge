import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { Session } from '../models/session';
import type { Set } from '../models/set';
import type { SessionTarget } from '../models/session-target';
import * as sessionService from '../services/session-service';
import * as setService from '../services/set-service';
import { startSessionFromTemplate, getSessionTargets } from '../services/session-template-service';

interface SessionState {
  activeSession: Session | null;
  sets: Set[];
  sessionTargets: SessionTarget[];
  loading: boolean;
}

type SessionAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SESSION'; session: Session | null; sets: Set[]; targets?: SessionTarget[] }
  | { type: 'ADD_SET'; set: Set }
  | { type: 'UPDATE_SET'; set: Set }
  | { type: 'REMOVE_SET'; setId: string }
  | { type: 'END_SESSION' };

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_SESSION':
      return {
        ...state,
        activeSession: action.session,
        sets: action.sets,
        sessionTargets: action.targets ?? [],
        loading: false,
      };
    case 'ADD_SET':
      return { ...state, sets: [...state.sets, action.set] };
    case 'UPDATE_SET':
      return {
        ...state,
        sets: state.sets.map((s) =>
          s.id === action.set.id ? action.set : s,
        ),
      };
    case 'REMOVE_SET':
      return {
        ...state,
        sets: state.sets.filter((s) => s.id !== action.setId),
      };
    case 'END_SESSION':
      return { ...state, activeSession: null, sets: [], sessionTargets: [] };
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  startSession: () => Promise<void>;
  startFromTemplate: (templateId: string) => Promise<void>;
  endSession: () => Promise<void>;
  logSet: (input: {
    exerciseId: string;
    weight: number;
    reps: number;
    rir?: number;
  }) => Promise<Set | null>;
  updateSet: (
    setId: string,
    input: { weight?: number; reps?: number; rir?: number | null },
  ) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, {
    activeSession: null,
    sets: [],
    sessionTargets: [],
    loading: true,
  });

  // Restore active session on mount
  useEffect(() => {
    (async () => {
      try {
        const session = await sessionService.getActiveSession();
        if (session) {
          const [sets, targets] = await Promise.all([
            setService.getSetsForSession(session.id),
            getSessionTargets(session.id),
          ]);
          dispatch({ type: 'SET_SESSION', session, sets, targets });
        } else {
          dispatch({ type: 'SET_SESSION', session: null, sets: [] });
        }
      } catch {
        dispatch({ type: 'SET_SESSION', session: null, sets: [] });
      }
    })();
  }, []);

  const startSession = async () => {
    const session = await sessionService.createSession();
    dispatch({ type: 'SET_SESSION', session, sets: [] });
  };

  const startFromTemplate = async (templateId: string) => {
    const { session, targets } = await startSessionFromTemplate(templateId);
    dispatch({ type: 'SET_SESSION', session, sets: [], targets });
  };

  const endSession = async () => {
    if (!state.activeSession) return;
    await sessionService.endSession(state.activeSession.id);
    dispatch({ type: 'END_SESSION' });
  };

  const logSetAction = async (input: {
    exerciseId: string;
    weight: number;
    reps: number;
    rir?: number;
  }): Promise<Set | null> => {
    if (!state.activeSession) return null;
    const newSet = await setService.logSet({
      sessionId: state.activeSession.id,
      ...input,
    });
    dispatch({ type: 'ADD_SET', set: newSet });
    return newSet;
  };

  const updateSetAction = async (
    setId: string,
    input: { weight?: number; reps?: number; rir?: number | null },
  ) => {
    const updated = await setService.updateSet(setId, input);
    dispatch({ type: 'UPDATE_SET', set: updated });
  };

  const deleteSetAction = async (setId: string) => {
    await setService.deleteSet(setId);
    dispatch({ type: 'REMOVE_SET', setId });
    // Refresh sets to get renumbered set_numbers
    if (state.activeSession) {
      const sets = await setService.getSetsForSession(
        state.activeSession.id,
      );
      dispatch({
        type: 'SET_SESSION',
        session: state.activeSession,
        sets,
      });
    }
  };

  return (
    <SessionContext.Provider
      value={{
        state,
        startSession,
        startFromTemplate,
        endSession,
        logSet: logSetAction,
        updateSet: updateSetAction,
        deleteSet: deleteSetAction,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
