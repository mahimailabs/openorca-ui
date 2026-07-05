# First Dashboard

Import the OpenOrca stylesheet once at your app entry, then wrap the page with `OpenOrcaProvider`.

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

## What `OpenOrcaProvider` Includes

- React Query provider
- theme provider
- tooltip provider
- toaster notifications

You do not need to wire those separately for the default shell.
