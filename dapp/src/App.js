import logo from './logo.svg';
import './App.css';
import { Mainnet, DAppProvider, useEtherBalance, useEthers, Config, Goerli } from '@usedapp/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faWallet } from '@fortawesome/free-solid-svg-icons'
// import { MetamaskConnect } from './components/MetamaskConnect'

const shortenAddress = (addr) => `${addr.slice(0, 5)}...${addr.slice(-4)}`

export function App() {
  const { activateBrowserWallet, deactivate, account } = useEthers()
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

          </div>
        </div>
        </div>
        <div className='col-1'></div>
      </div>
      
    </div>
  )
}

export default App;
