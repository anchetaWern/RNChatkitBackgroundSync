import React, { Component } from "react";
import { YellowBox } from "react-native";
import { createStackNavigator, createAppContainer } from "react-navigation";
import LoginScreen from "./src/screens/Login";
import ChatScreen from "./src/screens/Chat";

YellowBox.ignoreWarnings(["Setting a timer"]);

import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { PersistGate } from "redux-persist/integration/react";
import createSagaMiddleware from "redux-saga";

import { Provider } from "react-redux";
import { createStore, combineReducers, applyMiddleware } from "redux";

import {
  ReduxNetworkProvider,
  reducer as network,
  createNetworkMiddleware
} from "react-native-offline";

import ChatReducer from "./src/reducers/ChatReducer";
import { watcherSaga } from "./src/sagas";

const sagaMiddleware = createSagaMiddleware();
const networkMiddleware = createNetworkMiddleware();

const persistConfig = {
  key: "root",
  storage
};

const chatPersistConfig = {
  key: "chat",
  storage: storage
};

const rootReducer = combineReducers({
  chat: persistReducer(chatPersistConfig, ChatReducer),
  network
});

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = createStore(
  persistedReducer,
  applyMiddleware(networkMiddleware, sagaMiddleware)
);
let persistor = persistStore(store);

sagaMiddleware.run(watcherSaga);

const RootStack = createStackNavigator(
  {
    Login: LoginScreen,
    Chat: ChatScreen
  },
  {
    initialRouteName: "Login"
  }
);


const AppContainer = createAppContainer(RootStack);

class Router extends Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ReduxNetworkProvider>
            <AppContainer />
          </ReduxNetworkProvider>
        </PersistGate>
      </Provider>
    );
  }
}

export default Router;