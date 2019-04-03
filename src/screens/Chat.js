import React, { Component } from "react";
import { View, ActivityIndicator } from "react-native";
import { GiftedChat, Send, Message } from "react-native-gifted-chat";
import { ChatManager, TokenProvider } from "@pusher/chatkit-client";
import axios from "axios";
import Config from "react-native-config";

const CHATKIT_INSTANCE_LOCATOR_ID = `v1:us1:${Config.CHATKIT_INSTANCE_LOCATOR_ID}`;
const CHATKIT_SECRET_KEY = Config.CHATKIT_SECRET_KEY;
const CHATKIT_TOKEN_PROVIDER_ENDPOINT = `https://us1.pusherplatform.io/services/chatkit_token_provider/v1/${Config.CHATKIT_INSTANCE_LOCATOR_ID}/token`;

const CHAT_SERVER = "YOUR NGROK HTTPS URL/rooms";


class Chat extends Component {

  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      headerTitle: `Chat with ${params.friends_username}`
    };
  };

  state = {
    messages: [],
    is_initialized: false,
    is_loading: false,
    is_sending: false,
    show_load_earlier: false
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

    this.enterChat();

  }


  enterChat = async () => {

    try {
      if (!this.chatManager) {
        this.chatManager = new ChatManager({
          instanceLocator: CHATKIT_INSTANCE_LOCATOR_ID,
          userId: this.user_id,
          tokenProvider: new TokenProvider({ url: CHATKIT_TOKEN_PROVIDER_ENDPOINT })
        });

        let currentUser = await this.chatManager.connect();
        this.currentUser = currentUser;

        const response = await axios.post(
          CHAT_SERVER,
          {
            user_id: this.user_id,
            room_name: this.room_name
          }
        );

        const room = response.data;
        this.room_id = room.id.toString();

        await this.setState({
          is_initialized: true
        });
      }

      await this.currentUser.subscribeToRoom({
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

    const { messages } = this.state;
    const { message } = await this.getMessage(data);

    await this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, message)
    }));

    if (messages && messages.length > 9) {
      this.setState({
        show_load_earlier: true
      });
    }
  }


  onSend([message]) {

    let msg = {
      text: message.text,
      roomId: this.room_id
    };

    this.setState({
      is_sending: true
    });

    this.currentUser.sendMessage(msg).then(() => {

      this.setState({
        is_sending: false
      });
    });

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


  getMessage = async ({ id, senderId, text, createdAt }) => {

    const message = {
      _id: id,
      text: text,
      createdAt: new Date(createdAt),
      user: {
        _id: senderId,
        name: senderId,
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

    const { messages } = this.state;

    this.setState({
      is_loading: true
    });

    const earliest_message_id = Math.min(
      ...messages.map(m => parseInt(m._id))
    );

    try {
      let messages = await this.currentUser.fetchMessages({
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

      await this.setState(previousState => ({
        messages: previousState.messages.concat(earlier_messages)
      }));

    } catch (load_messages_err) {
      console.log("error occured while trying to load older messages", load_messages_err);
    }

    await this.setState({
      is_loading: false
    });
  }


  render() {
    const { is_initialized, show_load_earlier, messages } = this.state;

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

export default Chat;


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