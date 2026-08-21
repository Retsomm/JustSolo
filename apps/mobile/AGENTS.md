# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# This app lives in a yarn workspaces monorepo

`apps/mobile` (this app) is a sibling of `apps/web` (Next.js) and `packages/shared`
(pure logic + types + the entire tRPC server layer, including Prisma). Only import
from `@justsolo/shared`'s safe barrel (pure functions/types) as **values**; the
`AppRouter` type must be a **type-only** import from the deep path
`@justsolo/shared/src/server/routers/_app` — never value-import anything under
`@justsolo/shared/src/server/**`, or Metro will try to bundle Prisma/`pg` into this
app and crash. See `packages/shared/src/index.ts` for what's safe to import.

Always run native/Expo-aligned installs with `npx expo install <pkg>`, never
`yarn add` — it resolves the version compatible with this app's Expo SDK.

