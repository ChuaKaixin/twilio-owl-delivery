import React, {Component} from 'react';
import '../App.css';
import {Container, Row, Col, Image, Form, Button, Spinner, Jumbotron, Table, Alert, Card} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import {initiateCall, hangupCall, muteCall, pickupCall} from '../handler/commHandler';

class Delivery extends Component {
    state = {
        clientInitiatedId : '',
        onCall : false,
        dialling: false,
        muted: false,
        phoneNumber: '',
        clientId: '',
        incoming: '',
        connection: undefined,
        orderRef: "REF20207890"
  }
  
    render() {
      
      return (
        <div>
            {!this.state.clientInitiatedId &&
            <Container className="p-3">
                <Card>
                    <Card.Body>
                <div className="spacer"></div>
            <Row>
                <Col></Col>
                <Col xs={6} md={2}>
                <Image src="/owl1.png" fluid />
                </Col>
                <Col></Col>
            </Row>
            <Row>
                <Col></Col>
                <Col xs={6} md={6}>
                <Form onSubmit={this.submitHandler}>
                <Form.Group controlId="formBrowserCall:clientId">
                  <Form.Control required type="text" placeHolder="User Name" onChange={this.captureClientId.bind(this)} />
                </Form.Group>
                </Form>
                </Col>
                <Col></Col>
            </Row>
            <div class="text-center">
                {!this.state.dialling && 
                <Button variant="secondary" onClick={this.registerClient} type="submit">
                    Sign In
                </Button>}
                {this.state.dialling &&
                <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
                }
            </div>
                </Card.Body>
                </Card>
            </Container>}
            {this.state.clientInitiatedId && 
            <Container className="p-3">
            <Card>
                <Card.Body>
                <Jumbotron>
                <h2>
                    <Alert variant="info">{this.state.clientInitiatedId}, your next delivery details..</Alert>
                </h2>
                <Table responsive>
            <tbody>
                <tr>
                <td class="font-weight-bold">Order Ref</td>
                <td>202009890</td>
                </tr>
                <tr>
                <td class="font-weight-bold">Recipient Name</td>
                <td>Erica</td>
                </tr>
                <tr>
                <td class="font-weight-bold">Address</td>
                <td>Tampines Street 2 #07-10 S(123456)</td>
                </tr>
                <tr>
                <td class="font-weight-bold">Special Instructions</td>
                <td>Please call to check if at home or leave in shoe rack.</td>
                </tr>
            </tbody>
            </Table>
                    <p>
                    {!this.state.onCall && !this.state.dialling && 
                <div>
                <Button variant="secondary"  type="submit">
                  Complete Delivery
                </Button>
                {'  '}
                <Button variant="secondary" onClick={this.submitHandler} type="submit">
                  Call
                </Button>
                </div>
                }
                {this.state.dialling &&
                <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
                }
                {this.state.onCall &&
                    <div>
                    <Button variant="secondary" onClick={this.hangup}>
                    Hang Up
                    </Button>{' '}
                    {!this.state.muted &&
                    <Button variant="secondary" onClick={this.mute}>
                    Mute
                    </Button>}
                    {this.state.muted &&
                    <Button variant="secondary" onClick={this.mute}>
                    Unmute
                    </Button>}
                    </div>
                    
                }
                    </p>
                </Jumbotron>
                </Card.Body>
                </Card>
            </Container>}
        </div>
      );
  
    } 
  
  
  capturePhoneNumber=(event) => {
    this.setState({phoneNumber:event.target.value});
  }
  
  captureClientId=(event) => {
      this.setState({clientId:event.target.value});
  }
  
  registerClient=() => {
      if(this.state.clientId) {
          this.setState({
              dialling:true
          });
          initiateCall(this.state.clientId, this.prepareIncomingCall, this.cancelCall).then(
              result=> {
                  this.setState({
                      dialling:false,
                      muted:false,
                      clientInitiatedId:this.state.clientId
                  })
                  }
              )
      }
  }
  
  submitHandler=(event) => {
    this.setState({
        dialling:true,
        validated:true
    });
    initiateCall(this.state.clientId, this.prepareIncomingCall, this.cancelCall, this.state.orderRef).then(
    result=> {
        this.setState({
            onCall:true,
            dialling:false,
            muted:false,
            clientInitiatedId:this.state.clientId
        })
        }
    )
}
  
  
  prepareIncomingCall=(from, connection) => {
      this.setState({incoming:from, connection});
  }
      
  handleIncomingCall=(handle) => {
      if(handle==='pickup') {
          this.setState({dialling:true});
          //connection.accept()
          pickupCall(this.state.connection).then(
              result=> {
                  this.setState({
                      onCall:true,
                      dialling:false
                  })
              }
          )
      } else if(handle==='hangup') {
          this.hangup();
      }
  }
  
  cancelCall=() => {
      this.setState({
          onCall:false,
          dialling:false,
          muted:false,
          incoming:false
      })
  }
  
  hangup=() => {
      this.setState({dialling:true});
      hangupCall().then(
          result=> {
              this.setState({
                  onCall:false,
                  dialling:false,
                  muted:false,
                  incoming:false
              })
              }
      )
  }
  mute=() => {
      muteCall(this.state.muted).then(
          result=> {
              this.setState({
                  muted:!this.state.muted
              })
          }
      )
  }

}


export default Delivery;
