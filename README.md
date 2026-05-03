# CycleSense - Emma Smith Final Year Project

CycleSense is a period tracking app built with React Native and Expo, submitted as my Final Year Project as Queen Mary University of London.

---

## How to Run the App

The app runs via **Expo Go** and doesn't have a standalone executable. Deployment to iOS/Android was not required for this project. A working Expo Go demo was agreed with my supervisor as sufficient.

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine
- The **Expo Go** app installed on your phone:
  - [iOS – App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android – Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Steps
 
1. Clone the repository:
   ```bash
   git clone https://github.com/EmmaSmithCs/CycleSense.git
   cd CycleSense
   ```
 
2. Install dependencies:
   ```bash
   npm install
   ```
 
3. Start the app:
   ```bash
   npx expo start
   ```
 
4. A QR code will appear in the terminal. Scan it with:
   - The **Expo Go app** on Android
   - The **Camera app** on iOS
The app should load on your phone automatically.
 
---
 
## Notes
 
- All API keys and Firebase configuration are hardcoded in the source code for the purposes of this university project.
- No `.env` file or additional configuration is needed to run the app.
- Do **not** run `npm run reset-project` — this will overwrite the app code with a blank template.
---
 
## Project Structure
 
The main app code is inside the `app/` directory, which uses Expo's file-based routing system.
 
---
 
## Dependencies
 
Key libraries used in this project include:
 
- `expo-router` – file-based navigation
- `firebase` – backend and data storage
- `react-native-calendars` – calendar UI
- `expo-notifications` – push notifications
- `expo-local-authentication` – biometric authentication
- `react-native-reanimated` – animations
Full dependency list can be found in `package.json`.