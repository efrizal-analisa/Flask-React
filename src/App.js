import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link
} from "react-router-dom";
import {login, authFetch, useAuth, logout} from "./auth"
import { GoogleLoginButton } from 'react-social-login-buttons'
import { QuickeySDK } from 'quickey-web-sdk'
import axios from 'axios'

const PrivateRoute = ({ component: Component, ...rest }) => {
  const [logged] = useAuth();

  return <Route {...rest} render={(props) => (
    logged
      ? <Component {...props} />
      : <Redirect to='/login' />
  )} />
}


export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/secret">Secret</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <PrivateRoute path="/secret" component={Secret} />
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [logged] = useAuth();

  const onSubmitClick = (e)=>{
    e.preventDefault()
    console.log("You pressed login")
    let opts = {
      'username': username,
      'password': password,
      'provider': null
    }
    console.log(opts)
    fetch('/api/login', {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(r => r.json())
      .then(token => {
        if (token.access_token){
          login(token)
          console.log(token)          
        }
        else {
          console.log("Please type in correct username/password")
        }
      })
  }

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const url = new URL(window.location.href)
  const c = url.searchParams.get("email")
  const quickeyProvider = 'googleLogin'
  
  useEffect(() => {
    const payload = {
      email: c,
      provider: quickeyProvider
    }
    if (c) { 
      axios({
        method:'post',
        url: 'http://localhost:5000/api/login',
        data: JSON.stringify(payload)
      })
      .then(response => {
        console.log(response.data);
        login(response.data)
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, [c, quickeyProvider])

  const handleGoogleLogin = () => {
    const quickey = new QuickeySDK('inT9Ic-BhfqbRA-wgtz8Dn_WHUuAAmSI3VN0kByQpyU', quickeyProvider)
    quickey.app
      .getMetaData()
      .then(app => {
        return quickey.provider.getData({
          appId: app.appId
        })
      })
      .then(provider => {
        return quickey.provider.getURlLogin({
          appId: provider.appId,
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
          dataToken: provider.dataToken
        })
      })
      .then(result => {
        window.location.href = result
      })
      .catch(err => {
        console.log(err);
      })
  }

  return (
    <div>
      <h2>Login</h2>
      {!logged? <form action="#">
        <div>
          <input type="text" 
            placeholder="Username" 
            onChange={handleUsernameChange}
            value={username} 
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            onChange={handlePasswordChange}
            value={password}
          />
        </div>
        <button onClick={onSubmitClick} type="submit">
          Login Now
        </button>
        <GoogleLoginButton onClick={() => handleGoogleLogin()}/>
      </form>
      : <button onClick={() => logout()}>Logout</button>}
    </div>
  )
}

function Secret() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    authFetch("/api/protected").then(response => {
      if (response.status === 401){
        setMessage("Sorry you aren't authorized!")
        return null
      }
      return response.json()
    }).then(response => {
      if (response && response.message){
        setMessage(response.message)
      }
    })
  }, [])
  return (
    <h2>Secret: {message}</h2>
  )
}