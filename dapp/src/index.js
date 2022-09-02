import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import { Mainnet, DAppProvider, useEtherBalance, useEthers, Config, Goerli } from '@usedapp/core'
import { getDefaultProvider } from 'ethers'

import './index.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import App from './App';

// import reportWebVitals from './reportWebVitals';
const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/cryptoanonymousdev/erc-test-subgraph',
  cache: new InMemoryCache(),
});

const config = {
  readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Mainnet.chainId]: getDefaultProvider('mainnet'),
    [Goerli.chainId]: getDefaultProvider('goerli'),
  },
}

ReactDOM.render(
  
    <DAppProvider config={config}>
      <ApolloProvider client={client}>
      <App />
      </ApolloProvider>
    </DAppProvider>,  
  document.getElementById('root')
)



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
