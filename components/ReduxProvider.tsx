"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import { useEffect } from "react";
import { checkAuth } from "@/store/slices/authSlice";

function StoreInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only check authentication status with server (with caching)
    // No need to load from localStorage as Redux Persist handles this
    store.dispatch(checkAuth());
  }, []);

  return <>{children}</>;
}

// Loading component for PersistGate
function PersistLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg animate-pulse"></div>
        <span className="text-gray-600 font-medium">Loading...</span>
      </div>
    </div>
  );
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<PersistLoading />} persistor={persistor}>
        <StoreInitializer>{children}</StoreInitializer>
      </PersistGate>
    </Provider>
  );
}
