import React from "react";
import AppNavigator from "@/navigation/AppNavigator"; // adjust the path if needed
import { ApiProvider } from "@/hooks/ApiContext";

export default function App() {
  return (
    <ApiProvider>
      <AppNavigator />
    </ApiProvider>
  );
}
