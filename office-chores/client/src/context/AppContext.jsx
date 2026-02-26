import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getMembers } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [members, setMembers] = useState([]);
  const calendarRef = useRef(null);

  const loadMembers = useCallback(() => {
    getMembers().then(({ members }) => setMembers(members)).catch(console.error);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const refreshCalendar = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  }, []);

  return (
    <AppContext.Provider value={{ members, loadMembers, calendarRef, refreshCalendar }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
