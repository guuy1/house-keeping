import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";
import { SignUpLink } from "../SignUp";
import { withFirebase } from "../Firebase";
import * as ROUTES from "../../constants/routes";
import { PasswordForgetLink } from "../PasswordForget";
import CustomButton from "../CustomButton/CustomButton";
import FormInput from "../FormInput/FormInput";
import "./SignIn.scss";

const SignInPage = () => (
  <div>
    <h1>התחבר באמצעות איימיל וסיסמא</h1>
    <SignInForm />
    <PasswordForgetLink />
    <SignUpLink />
  </div>
);
const INITIAL_STATE = {
  email: "",
  password: "",
  error: null,
};

//check user name and psw with Firebase
class SignInFormBase extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
  }
  onSubmit = (event) => {
    const { email, password } = this.state;
    this.props.firebase
      .doSignInWithEmailAndPassword(email, password)
      .then(() => {
        this.setState({ ...INITIAL_STATE });
        this.props.history.push(ROUTES.HOME);
      })
      .catch((error) => {
        this.setState({ error });
      });
    event.preventDefault();
  };
  onChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };
  render() {
    const { email, password, error } = this.state;
    const isInvalid = password === "" || email === "";
    return (
      <div className="sign-in">
        <p>Sign in with your email and password</p>
        <form className="form" onSubmit={this.onSubmit}>
          <FormInput
            name="email"
            value={email}
            onChange={this.onChange}
            type="text"
            placeholder="אימייל"
          />
          <FormInput
            name="password"
            value={password}
            onChange={this.onChange}
            type="password"
            placeholder="סיסמא"
          />
          <CustomButton disabled={isInvalid} type="submit">
            התחבר
          </CustomButton>
          {error && <p>{error.message}</p>}
        </form>
      </div>
    );
  }
}
const SignInForm = compose(withRouter, withFirebase)(SignInFormBase);
export default SignInPage;
export { SignInForm };
