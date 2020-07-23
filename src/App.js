import React, {Component} from 'react';
import './App.css';
import {Navbar, Container} from 'react-bootstrap'
import Delivery from './routes/Delivery'

class App extends Component {

  render() {
    
    return (
      <div>
        <Container className="p-3">
        <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#home">
          <img
            alt=""
            src="/owl1.png"
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          Owl Delivery
        </Navbar.Brand>
      </Navbar>
        <Delivery/>
        </Container>
    </div>
    );
      }
}


export default App;
