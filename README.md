# RNChatkitBackgroundSync

A React Native chat app built with Chatkit with background sync for offline messages access.

You can read the full tutorial at: [Syncing Chatkit messages in the background in React Native](https://pusher.com/tutorials/background-sync-react-native).

### Prerequisites

-   React Native development environment
-   [Node.js](https://nodejs.org/en/)
-   [Yarn](https://yarnpkg.com/en/)
-   [Chatkit app instance](https://pusher.com/chatkit)
-   [ngrok account](https://ngrok.com/)

## Getting Started

1.  Clone the repo:

```
git clone https://github.com/anchetaWern/RNChatkitBackgroundSync.git
cd RNChatkitBackgroundSync
```

2.  Install the app dependencies:

```
yarn
```

3.  Eject the project (re-creates the `ios` and `android` folders):

```
react-native eject
```

4.  Link the packages:

```
react-native link react-native-gesture-handler
react-native link react-native-config
react-native link react-native-background-timer
```

5.  Update `android/app/build.gradle` file:

```
apply from: "../../node_modules/react-native/react.gradle"

// add these:
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

6.  Update `android/app/src/main/AndroidManifest.xml` file and add the following permission:

```
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

7.  Update `.env` file with your Chatkit credentials.

8.  Set up the server:

```
cd server
yarn
```

9.  Update the `server/.env` file with your Chatkit credentials.

10. Run the server:

```
yarn start
```

11. Run ngrok:

```
./ngrok http 5000
```

12. Update the `src/screens/Login.js` and `src/screens/Chat.js` file with your ngrok https URL.

13. Run the app:

```
react-native run-android
react-native run-ios
```

14. Log in to the app on two separate devices (or emulator).

## Built With

-   [React Native](http://facebook.github.io/react-native/)
-   [Chatkit](https://pusher.com/chatkit)
