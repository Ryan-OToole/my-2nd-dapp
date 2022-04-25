import React, { Component } from 'react';
import { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';

const greeterAddress = '0xb34218B258b50D4b58EFA831f9e2a64FC357086f';


function Markov(sourceText, order) {

  this.sourceText = sourceText;
  this.order = order;

  this._setupFrequencies();

}

Markov.prototype = {

_setupFrequencies: function() {

    this.frequencies = {};

    // for each substring of length <order>,
    // create an array of characters that can follow it
    for (var i = 0; i < this.sourceText.length - (this.order - 1); i++) {
        var chunk = this.sourceText.substr(i, this.order);
        if (!this.frequencies.hasOwnProperty(chunk)) {
            this.frequencies[chunk] = [];
        }
        var follower = this.sourceText.substr(i + this.order, 1);
        this.frequencies[chunk].push(follower);
    }

},

  _getRandomChar: function(chunk) {

      if (!this.frequencies.hasOwnProperty(chunk)) {
          return '';
      }
      var followers = this.frequencies[chunk];
      var randIndex = Math.floor(Math.random() * followers.length);
      return followers[randIndex];

  },

  _getRandomChunk: function() {

      var randIndex = Math.floor(Math.random() * this.sourceText.length);
      return this.sourceText.substr(randIndex, this.order);

  },

  generateText: function(length) {

      if (this.sourceText.length <= this.order) {
          return '';
      }

      var text = this._getRandomChunk();

      // take the last <order> characters from the generated string,
      // select one of its possible followers, and append it
      for (var i = this.order; i < length; i++) {
          var currentChunk = text.substr(text.length - this.order);
          var newChar = this._getRandomChar(currentChunk);

          if (newChar !== '') { // the last chunk of the source has no follower
              text += newChar;
          } else {
              text += this._getRandomChunk();
          }
      }

      return text;

  }

}

class App extends Component {
  state = {
    markov: '',
    markovOutput: '',
    greeting: ''
  }

   requestAccount = async () => {
    await window.ethereum.request({method: 'eth_requestAccounts'});
  }

  fetchGreeting = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(greeterAddress, Greeter.abi, provider);
      try {
        const data = await contract.greet();
        this.handleMarkov(data);
      }
      catch (err) {
        console.log('error: ', err);
      }
    }
  }

  setGreeting = async (markovOutput) => {
    // if (!this.state.markovOutput) return
    if (typeof window.ethereum !== 'undefined') {
      await this.requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(greeterAddress, Greeter.abi, signer);
      const transaction = await contract.setGreeting(markovOutput);
      await transaction.wait();
      const data = await contract.greet();
      console.log('***this.state.markovOutput', data);
      this.handleMarkovOutput(data);
    }
  }

handleMarkov = (markov) => {
  this.setState({
      markov
  });
}

handleMarkovOutput = (markovOutput) => {
  this.setState({
      markovOutput
  });
}

handleSubmit = async (event) => {
  event.preventDefault();
  var markov = new Markov(this.state.markov, 5);
  var markovOutput = markov.generateText(250);
  await this.setGreeting(markovOutput);
}

handleSubmitOutput = async (event) => {
  event.preventDefault();
  var markov = new Markov(this.state.markovOutput, 5);
  var markovOutput = markov.generateText(250);
  await this.handleMarkovOutput(markovOutput);
  this.setGreeting(this.state.markovOutput);
}

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <button onClick={this.fetchGreeting}>Fetch Greeting</button>
          {/* <button onClick={this.setGreeting}>Set Greeting</button> */}
          <form onSubmit={this.handleSubmit}>
              <textarea
                name="markov"
                rows="20"
                cols="50"
                onChange={e => this.handleMarkov(this.state.markov)}
                value={this.state.markov}></textarea>
              <button color='violet' type='submit'>Jumble Me?</button>
            </form>
            <br />

            <form onSubmit={this.handleSubmitOutput}>
              <textarea
                name="markovOutput"
                rows="20"
                cols="50"
                onChange={e => this.handleMarkovOutput(e.target.value)}
                value={this.state.markovOutput}></textarea>
              <button color='violet' type='submit'>ReJumble Me?</button>
            </form>
        </header>
      </div>
    );
  }
}

export default App;
