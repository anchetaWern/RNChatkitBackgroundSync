import {
  SET_USER,
  SET_FRIEND,
  SET_ROOM,
  PUT_MESSAGE,
  SET_MESSAGES,
  PUT_OLDER_MESSAGES
} from "../actions/types";

const INITIAL_STATE = {
  user: null,
  friend: null,
  room: null,
  messages: []
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {

    case SET_USER:
      return { ...state, user: action.user };

    case SET_FRIEND:
      return { ...state, friend: action.friend };

    case SET_ROOM:
      return { ...state, room: action.room };

    case PUT_MESSAGE:
      const updated_messages = [action.message].concat(state.messages);
      return { ...state, messages: updated_messages };

    case SET_MESSAGES:
      return { ...state, messages: action.messages };

    case PUT_OLDER_MESSAGES:
      const current_messages = [...state.messages];
      const older_messages = action.messages.reverse();
      const with_old_messages = current_messages.concat(older_messages);

      return {
        ...state,
        messages: with_old_messages
      };

    default:
      return state;
  }
};