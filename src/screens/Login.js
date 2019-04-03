import React, { Component } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import stringHash from "string-hash";
import axios from "axios";
import { connect } from "react-redux";
import { setUser, setFriend } from "../actions";

const CHAT_SERVER = "YOUR NGROK HTTPS URL/users";


class Login extends Component {
  static navigationOptions = {
    title: "Login"
  };

  state = {
    username: "",
    friends_username: "",
    is_loading: false
  };

  componentDidMount() {
    const { isConnected, user, friend } = this.props;

    if (!isConnected) {

      this.props.navigation.navigate("Chat", {
        user_id: user.id,
        username: user.name,
        friends_username: friend
      });

    }
  }

  render() {
    const { isConnected, user, friend } = this.props;
    const { username, friends_username } = this.state;

    return (
      <View style={styles.wrapper}>
        {
          !isConnected &&
          <ActivityIndicator
            size="small"
            color="#0064e1"
            style={styles.loader}
          />
        }

        {
          isConnected &&
          <View style={styles.container}>

            <View style={styles.main}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Enter your username</Text>
                <TextInput
                  style={styles.textInput}
                  onChangeText={username => this.setState({ username })}
                  value={username}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Enter friend's username</Text>
                <TextInput
                  style={styles.textInput}
                  onChangeText={friends_username => this.setState({ friends_username })}
                  value={friends_username}
                />
              </View>

              {!this.state.is_loading && (
                <TouchableOpacity onPress={this.enterChat}>
                  <View style={styles.button}>
                    <Text style={styles.buttonText}>Login</Text>
                  </View>
                </TouchableOpacity>
              )}

              {this.state.is_loading && (
                <Text style={styles.loadingText}>Loading...</Text>
              )}
            </View>
          </View>
        }

      </View>
    );
  }


  enterChat = async () => {

    const { username, friends_username } = this.state;
    const user_id = stringHash(username).toString();

    const { setUser, setFriend } = this.props;

    this.setState({
      is_loading: true
    });

    if (username && friends_username) {

      setUser({
        id: user_id,
        name: username
      });
      setFriend(friends_username);

      try {
        await axios.post(
          CHAT_SERVER,
          {
            user_id: user_id,
            username: username
          }
        );

        this.props.navigation.navigate("Chat", {
          user_id,
          username,
          friends_username
        });

      } catch (e) {
        console.log(`error logging in: ${e}`);
      }

      await this.setState({
        is_loading: false,
        username: "",
        friends_username: ""
      });

    }

  };
}

const mapStateToProps = ({ network, chat }) => {
  const { isConnected } = network;
  const { user, friend } = chat;
  return {
    isConnected,
    user,
    friend
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setUser: user => {
      dispatch(setUser(user));
    },
    setFriend: friend => {
      dispatch(setFriend(friend));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);

const styles = {
  wrapper: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFF"
  },
  loader: {
    paddingTop: 20
  },
  fieldContainer: {
    marginTop: 20
  },
  label: {
    fontSize: 16
  },
  textInput: {
    height: 40,
    marginTop: 5,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: "#eaeaea",
    padding: 5
  },
  button: {
    alignSelf: "center",
    marginTop: 10
  },
  buttonText: {
    fontSize: 18,
    color: "#05a5d1"
  },
  loadingText: {
    alignSelf: "center"
  }
};