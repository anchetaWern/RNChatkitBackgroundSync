import React, { Component } from "react";
import { View, ActivityIndicator, AppState } from "react-native";
import { GiftedChat, Send, Message } from "react-native-gifted-chat";
import { ChatManager, TokenProvider } from "@pusher/chatkit-client";
import axios from "axios";
import Config from "react-native-config";

import { connect } from "react-redux";
import BackgroundTimer from "react-native-background-timer";

import {
  setRoom,
  setMessages,
  putMessage,
  putOlderMessages
} from "../actions";

const CHATKIT_INSTANCE_LOCATOR_ID = `v1:us1:${Config.CHATKIT_INSTANCE_LOCATOR_ID}`;
const CHATKIT_SECRET_KEY = Config.CHATKIT_SECRET_KEY;
const CHATKIT_TOKEN_PROVIDER_ENDPOINT = `https://us1.pusherplatform.io/services/chatkit_token_provider/v1/${Config.CHATKIT_INSTANCE_LOCATOR_ID}/token`;

const CHAT_SERVER = "YOUR NGROK HTTPS URL";


class Chat extends Component {

  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      headerTitle: `Chat with ${params.friends_username}`
    };
  };

  state = {
    is_initialized: false,
    is_loading: false,
    is_sending: false,
    show_load_earlier: false,
    app_state: AppState.currentState
  };


  constructor(props) {
    super(props);
    const { navigation } = this.props;
    const user_id = navigation.getParam("user_id");
    const username = navigation.getParam("username");
    const friends_username = navigation.getParam("friends_username");

    const members = [username, friends_username];
    members.sort();

    this.user_id = user_id;
    this.username = username;
    this.room_name = members.join("-");
  }


  componentDidMount() {
    const { isConnected, putMessage, messages } = this.props;
    AppState.addEventListener('change', this._handleAppStateChange);

    if (isConnected) {
      this.enterChat();
    }

    BackgroundTimer.runBackgroundTimer(() => {
      const { app_state } = this.state;
      if (isConnected && app_state !== 'active') {
        // fetch messages from the server
        console.log('app went to background, now getting messages from the server...');

        const latest_message_id = Math.max(
          ...messages.map(m => parseInt(m._id))
        );

        axios.get(`${CHAT_SERVER}/messages`, {
          params: {
            room_id: this.room_id,
            initial_id: latest_message_id
          }
        })
        .then((response) => {
          const { messages } = response.data;
          messages.reverse().forEach((msg) => {
            const text = msg.parts.find(part => part.type === 'text/plain').content;
            const message = {
              _id: msg.id,
              text: text,
              createdAt: msg.created_at,
              user:{
                _id: msg.user_id,
                avatar: "https://png.pngtree.com/svg/20170602/0db185fb9c.png"
              }
            }

            putMessage(message);
          });

        })
        .catch((err) => {
          console.log("error fetching messages from server: ", err);
        });

      }
    }, 60000);

    if (!isConnected) {
      this.setState({
        is_initialized: true
      });
    }
  }


  _handleAppStateChange = (nextAppState) => {
    if (nextAppState !== 'active' && this.currentUser) {
      this.currentUser.disconnect();
    } else if (nextAppState === 'active') {
      this.enterChat();
    }
    this.setState({
      app_state: nextAppState
    });
  };


  enterChat = async () => {

    const { setRoom, setMessages } = this.props;

    try {
      if (!this.chatManager) {
        this.chatManager = new ChatManager({
          instanceLocator: CHATKIT_INSTANCE_LOCATOR_ID,
          userId: this.user_id,
          tokenProvider: new TokenProvider({ url: CHATKIT_TOKEN_PROVIDER_ENDPOINT }),
          logger: {
            verbose: console.log,
            debug: console.log,
            info: console.log,
            warn: console.log,
            error: console.log,
          }
        });

        let currentUser = await this.chatManager.connect();
        this.currentUser = currentUser;

        const response = await axios.post(
          `${CHAT_SERVER}/rooms`,
          {
            user_id: this.user_id,
            room_name: this.room_name
          }
        );

        const room = response.data;
        this.room_id = room.id.toString();

        setRoom({
          id: this.room_id,
          name: this.room_name
        });

        await this.setState({
          is_initialized: true
        });
      }

      setMessages([]);

      await this.currentUser.subscribeToRoomMultipart({
        roomId: this.room_id,
        hooks: {
          onMessage: this.onReceive
        }
      });

    } catch (chatmanager_err) {
      console.log("error with chat manager: ", chatmanager_err);
    }
  }


  onReceive = async (data) => {

    const { messages, putMessage } = this.props;
    const { message } = await this.getMessage(data);

    putMessage(message);

    if (messages && messages.length > 9) {
      this.setState({
        show_load_earlier: true
      });
    }
  }


  onSend([message]) {

    const { isConnected } = this.props;

    if (isConnected) {
      let msg = {
        text: message.text,
        roomId: this.room_id
      };

      this.setState({
        is_sending: true
      });

      this.currentUser.sendMessage(msg).then(() => {
        this.attachment = null;

        this.setState({
          is_sending: false
        });
      });
    }
  }


  renderSend = props => {
    if (this.state.is_sending) {
      return (
        <ActivityIndicator
          size="small"
          color="#0064e1"
          style={[styles.loader, styles.sendLoader]}
        />
      );
    }

    return <Send {...props} />;
  }


  getMessage = async ({ id, sender, parts, createdAt }) => {

    const text = parts.find(part => part.partType === 'inline').payload.content;

    const message = {
      _id: id,
      text: text,
      createdAt: new Date(createdAt),
      user: {
        _id: sender.id,
        avatar: "https://png.pngtree.com/svg/20170602/0db185fb9c.png"
      }
    };

    return {
      message
    };
  }


  asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }


  loadEarlierMessages = async () => {

    const { putOlderMessages, isConnected, messages } = this.props;

    if (isConnected) {
      this.setState({
        is_loading: true
      });

      const earliest_message_id = Math.min(
        ...messages.map(m => parseInt(m._id))
      );

      try {
        let messages = await this.currentUser.fetchMultipartMessages({
          roomId: this.room_id,
          initialId: earliest_message_id,
          direction: "older",
          limit: 10
        });

        if (!messages.length) {
          this.setState({
            show_load_earlier: false
          });
        }

        let earlier_messages = [];
        await this.asyncForEach(messages, async (msg) => {
          let { message } = await this.getMessage(msg);
          earlier_messages.push(message);
        });

        putOlderMessages(earlier_messages);

      } catch (load_messages_err) {
        console.log("error occured while trying to load older messages: ", load_messages_err);
      }

    }

    await this.setState({
      is_loading: false
    });
  }


  render() {
    const { is_initialized, show_load_earlier } = this.state;
    const { messages } = this.props;

    return (
      <View style={styles.container}>
        {(!is_initialized) && (
          <ActivityIndicator
            size="small"
            color="#0064e1"
            style={styles.loader}
          />
        )}

        {is_initialized && (
          <GiftedChat
            messages={messages}
            onSend={messages => this.onSend(messages)}
            user={{
              _id: this.user_id
            }}
            renderSend={this.renderSend}
            renderMessage={this.renderMessage}
            loadEarlier={show_load_earlier}
            onLoadEarlier={this.loadEarlierMessages}
          />
        )}
      </View>
    );
  }

}

const mapStateToProps = ({ network, chat }) => {
  const { isConnected } = network;
  const { user, messages } = chat;
  return {
    isConnected,
    user,
    messages
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setRoom: room => {
      dispatch(setRoom(room));
    },
    setMessages: messages => {
      dispatch(setMessages(messages));
    },
    putMessage: message => {
      dispatch(putMessage(message));
    },
    putOlderMessages: older_messages => {
      dispatch(putOlderMessages(older_messages));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Chat);


const styles = {
  container: {
    flex: 1
  },
  loader: {
    paddingTop: 20
  },
  sendLoader: {
    marginRight: 10,
    marginBottom: 10
  }
}