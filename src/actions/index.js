import {
  SET_USER,
  SET_FRIEND,
  SET_ROOM,
  PUT_MESSAGE,
  SET_MESSAGES,
  PUT_OLDER_MESSAGES
} from "./types";


export const setUser = user => {
  return {
    type: SET_USER,
    user
  }
};

export const setFriend = friend => {
  return {
    type: SET_FRIEND,
    friend
  }
};

export const setRoom = room => {
  return {
    type: SET_ROOM,
    room
  }
};

export const putMessage = message => {
  return {
    type: PUT_MESSAGE,
    message
  };
};

export const setMessages = messages => {
  return {
    type: SET_MESSAGES,
    messages
  };
};

export const putOlderMessages = messages => {
  return {
    type: PUT_OLDER_MESSAGES,
    messages
  };
};