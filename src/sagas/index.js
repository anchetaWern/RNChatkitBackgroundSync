import { networkSaga } from "react-native-offline";

import { fork, all } from "redux-saga/effects";

export function* watcherSaga() {
  yield all([
    fork(networkSaga, {
      timeout: 5000,
      checkConnectionInterval: 1000
    })
  ]);
}