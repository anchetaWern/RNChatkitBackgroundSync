import React, { Component } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import stringHash from "string-hash";
import axios from "axios";

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

  render() {
    const { username, friends_username, is_loading } = this.state;

    return (
      <View style={styles.wrapper}>
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
                onChangeText={friends_username =>
                  this.setState({ friends_username })
                }
                value={friends_username}
              />
            </View>

            {!is_loading && (
              <TouchableOpacity onPress={this.enterChat}>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>Login</Text>
                </View>
              </TouchableOpacity>
            )}

            {is_loading && (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
        </View>
      </View>
    );
  }


  enterChat = async () => {

    const { username, friends_username } = this.state;
    const user_id = stringHash(username).toString();

    this.setState({
      is_loading: true
    });

    if (username && friends_username) {

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


export default Login;

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