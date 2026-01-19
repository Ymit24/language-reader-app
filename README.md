# Reader App

A cross-platform LingQ-style reader built with React Native, Expo Router, NativeWind, and Convex.

## Features

- Email/password authentication via Convex Auth
- Library: create lessons by pasting text
- Reader: tap words to view details and set status (unknown/learning/known)
- Vocabulary: global per user + language, persists across lessons
- Review: spaced repetition review queue

## Tech Stack

- **Expo** (React Native)
- **Expo Router** for routing (web + native)
- **NativeWind** for styling
- **Convex** for backend DB + state sync
- **Convex Auth** for authentication

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the development server

   ```bash
   npx expo start
   ```

3. Run on your preferred platform:
   - iOS Simulator
   - Android Emulator
   - Web (desktop browser)
   - Expo Go (iOS/Android)

## Project Structure

- `app/` - Expo Router routes
- `src/components/` - Reusable UI components
- `src/features/` - Feature-specific logic and components
- `src/lib/` - Utilities
- `convex/` - Convex schema, queries, mutations, and actions

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Convex documentation](https://docs.convex.dev/)
- [NativeWind documentation](https://www.nativewind.dev/)
