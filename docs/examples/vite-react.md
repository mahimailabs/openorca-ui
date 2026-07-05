# Vite React Example

This is the fastest end-to-end consumer path.

## Create The App

```bash
npm create vite@latest my-openorca-app -- --template react-ts
cd my-openorca-app
npm install
npm install @openorca-ui/react
# Optional peers for the bundled stylesheet: tailwindcss tw-animate-css
```

## `src/main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "@openorca-ui/react/styles.css";

createRoot(document.getElementById("root")!).render(<App />);
```

## `src/App.tsx`

```tsx
import { OpenOrcaDashboard, OpenOrcaProvider } from "@openorca-ui/react/theme";

export default function App() {
  return (
    <OpenOrcaProvider>
      <OpenOrcaDashboard />
    </OpenOrcaProvider>
  );
}
```
