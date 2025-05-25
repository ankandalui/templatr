// Utility functions for checking persisted state
export const checkPersistedState = () => {
  if (typeof window === 'undefined') {
    console.log('Server-side: localStorage not available');
    return null;
  }

  try {
    const persistedState = localStorage.getItem('persist:root');
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      console.log('Persisted state found:', parsed);
      return parsed;
    } else {
      console.log('No persisted state found');
      return null;
    }
  } catch (error) {
    console.error('Error reading persisted state:', error);
    return null;
  }
};

export const clearPersistedState = () => {
  if (typeof window === 'undefined') {
    console.log('Server-side: localStorage not available');
    return;
  }

  try {
    localStorage.removeItem('persist:root');
    console.log('Persisted state cleared');
  } catch (error) {
    console.error('Error clearing persisted state:', error);
  }
};
