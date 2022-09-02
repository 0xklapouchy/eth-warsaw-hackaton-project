import logo from './logo.svg';
import './App.css';
import { useQuery, gql } from '@apollo/client';
import { Mainnet, DAppProvider, useEtherBalance, useEthers, Config, Goerli, useSendTransaction } from '@usedapp/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faWallet } from '@fortawesome/free-solid-svg-icons'
import { utils } from 'ethers';

const shortenAddress = (addr) => `${addr.slice(0, 5)}...${addr.slice(-4)}`

export function App() {
  
  const { activateBrowserWallet, deactivate, account } = useEthers();
  const { sendTransaction } = useSendTransaction();

  const sendNative = (amount) => {
    sendTransaction({ to: '0xE42be9257419e4e37877ae71b90A703c23E56Bd8', value: utils.parseEther(amount)})
  }

  return (
    <div>
      <div className='row topDiv'>
        <div className='col-1'>
        </div>
        <div className='col-6'>
          
        </div>
        <div className='col-3 d-flex justify-content-end position-relative'>
          {
            account &&
            <div className='position-absolute top-50 translate-middle-y'>
              <label className='accountAddress border border-2 rounded-pill'><FontAwesomeIcon icon={faWallet} /> {shortenAddress(account)}</label>
            </div>
          }
        </div>
        <div className='col-2 d-flex justify-content-end position-relative'>
          {
            !account && 
            <div className='position-absolute top-50 translate-middle-y connectWalletBtnDiv d-grid gap-2 col-11 mx-auto'>
              <button className='btn btn-outline-success btn-lg' onClick={() => activateBrowserWallet()}>Connect Wallet</button>  
            </div>
          }
          {
            account && 
            <div className='position-absolute top-50 translate-middle-y connectWalletBtnDiv d-grid gap-2 col-11 mx-auto'>
              <button className='btn btn-outline-danger btn-lg' onClick={() => deactivate()}>Disconnect</button>
            </div>       
          }
        </div>
      </div>
      <div className='row yourBetsDiv'>
        <div className='col-1'></div>
        <div className='col-10'>
          <div class="card">
          <h5 class="card-header text-center">Your bets</h5>
          <div class="card-body">
            <YourBets />
          </div>
        </div>
        </div>
        <div className='col-1'></div>
      </div>
      <div className='row yourBetsDiv'>
        <div className='col-1'></div>
        <div className='col-10'>
          <div class="card">
          <h5 class="card-header text-center">Market bets</h5>
          <div class="card-body">
            <div className='container'>
            <div className='row'>
            {
              account && 
              <div className='d-grid gap-2 col-11 mx-auto'>
                <button className='btn btn-outline-primary btn-lg' onClick={() => sendNative('0.001')}>Send Native</button>
              </div> 
            }
            </div>
            </div>
          </div>
        </div>
        </div>
        <div className='col-1'></div>
      </div>
      
    </div>
  )
}

function YourBets() {
  let queryData = [];
  const implementations = [];
  const GET_IMPLEMENTATIONS = gql`
  {
    implementations(first: 5) {
      id
      deployer
      productName
      source
    }
  }
`;
  const { loading, error, data } = useQuery(GET_IMPLEMENTATIONS);

  if (loading) return (<div>Loading</div>);
  if (error) return (<div>Error</div>)


  if (data !== undefined) {
    queryData = data;

    for(let i = 0; i < queryData.implementations.length; i += 3) {
      implementations.push(queryData.implementations.slice(i, i + 3));
    }

    implementations.map(impl => impl.map(tt => console.log(tt)));
  } 

  return (
    <div className='container'>
      {
        implementations.map(implArr => {
          return <div className='row justify-content-around mb-4'>
            {
              implArr.map(impl => {
                return (
                  <div className='card text-center customCard col-3'>
                    <div class="card-header">
                      {impl.id}
                    </div>
                    <div className='card-body'>
                      <p className='card-text'>{impl.productName}</p>
                    </div>
                  </div>
                )
              })
            }
          </div>
        })
      }
    </div>
  )
}

// function MarketBets() {
//   return (
//     <div className='row'>
//         <div className='position-absolute top-50 translate-middle-y connectWalletBtnDiv d-grid gap-2 col-11 mx-auto'>
//           <button className='btn btn-outline-danger btn-lg' onClick={() => deactivate()}>Disconnect</button>
//         </div> 
//     </div>
//   )
// }

export default App;
