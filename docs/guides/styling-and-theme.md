# Styling And Theme

The published shell is intentionally opinionated.

## Default Path

Import:

```tsx
import "@openorca-ui/theme/styles.css";
```

Then wrap the app in:

```tsx
import { OpenOrcaProvider } from "@openorca-ui/theme";
```

## Recommended Customization Approach

- keep `@openorca-ui/theme` if you want the OpenOrca visual language
- move to `@openorca-ui/react` if you want heavier layout customization
- prefer CSS overrides around the shell rather than forking the internal package files

## Practical Boundary

Use `theme` for:

- the official shell
- default dashboard layout
- branded OpenOrca setup

Use `react` for:

- custom page composition
- partial embeds
- deeper visual control
