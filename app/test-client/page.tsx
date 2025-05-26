"use client";

import { useState } from "react";

export default function TestClientPage() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");

  const handleClick = () => {
    setCount(count + 1);
    setMessage(`Button clicked ${count + 1} times!`);
    console.log("Button clicked!", count + 1);
  };

  const testApiCall = async () => {
    try {
      console.log("Testing API call...");
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      console.log("API Response status:", response.status);
      const data = await response.json();
      console.log("API Response data:", data);
      setMessage(`API call result: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.error("API call error:", error);
      setMessage(`API call error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Client-Side Test Page</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Button Test</h2>
            <button
              onClick={handleClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Click me! (Count: {count})
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Test</h2>
            <button
              onClick={testApiCall}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Test API Call
            </button>
          </div>

          {message && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Result</h2>
              <p className="text-gray-700 break-all">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <a
            href="/dashboard"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
