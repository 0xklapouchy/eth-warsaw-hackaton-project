import { useState } from 'react';
import './App.css';
import { useQuery, gql } from '@apollo/client';
import { Mainnet, DAppProvider, useEtherBalance, useEthers, Config, Goerli, useSendTransaction, useCall } from '@usedapp/core'
import { hackabetABI } from './Hackabet'
import { USDCABI } from './USDC'
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faWallet } from '@fortawesome/free-solid-svg-icons'
import { BigNumber, Contract, utils } from 'ethers';

const shortenAddress = (addr) => `${addr.slice(0, 5)}...${addr.slice(-4)}`

export function App() {
  
  const { activateBrowserWallet, deactivate, account, chainId } = useEthers();
  const { sendTransaction } = useSendTransaction();
  const chainName = () => {
    switch(chainId) {
      case 5:
        return 'Goerli';
      default:
        return 'Unknown';
    }
  }

  const sendNative = (amount) => {
    sendTransaction({ to: '0xE42be9257419e4e37877ae71b90A703c23E56Bd8', value: utils.parseEther(amount)})
  }

  let depositedUSDC = 0;
  let allowance = 0;

  function DepositedUSDC() {
    const {value, error} = useCall({
      contract: new Contract('0x56b6002EcAD63CBEd9fd4014AdcAEa8615a381b4', hackabetABI),
      method: 'users',
      args: [account]
    }) ?? {}
  
    if (error) {
      console.log(error.message);
    }
  
    if (value !== undefined) {
      depositedUSDC = utils.formatEther(value[0].toString());
    }

    return (depositedUSDC)
  }

  // function AllowanceUSDC() {
  //   const {value, error} = useCall({
  //     contract: new Contract('0x7e020F035eAAE2dFCA821Cc58ec240fbf658a7f3', USDCABI),
  //     method: 'allowance',
  //     args: [account, '0x56b6002EcAD63CBEd9fd4014AdcAEa8615a381b4']
  //   }) ?? {}

  //   if (error) {
  //     console.log(error.message);
  //   }

  //   if (value !== undefined) {
  //     console.log(utils.formatEther(value[0].toString()));
  //   }
  // }

  function ModalHook() {
    let inputValue = 0;

    const updateInputEvent = (event) => {
      inputValue = event.target.value;
      console.log(allowance);
      console.log(inputValue);
      console.log(allowance > inputValue);
    }

    const {value, error} = useCall({
      contract: new Contract('0x7e020F035eAAE2dFCA821Cc58ec240fbf658a7f3', USDCABI),
      method: 'allowance',
      args: [account, '0x56b6002EcAD63CBEd9fd4014AdcAEa8615a381b4']
    }) ?? {}

    if (error) {
      console.log(error.message);
    }

    if (value !== undefined) {
      allowance = utils.formatEther(value[0]);
    }

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
    <>
      <Button className='col-5' variant="outline-success" size="lg" onClick={handleShow}>
        Deposit USDC
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input class="form-control" id="depositAmount" placeholder="Amount to deposit" onChange={evt => updateInputEvent(evt)}></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
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
              <label className='chainLabel border border-2 rounded-pill'>Chain : {chainName()}</label>
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
          <h5 class="card-header text-center">Funds</h5>
          <div class="card-body">
            <div className='container'>
            <div className='row'>
            {
              account && 
              <div className='card text-center customCard col-12'>
              <div class="card-header">
                Deposited USDC
              </div>
              <div className='card-body'>
                <p className='card-text'>
                  <DepositedUSDC />
                  {/* <AllowanceUSDC /> */}
                </p>
                <ModalHook />
                <button className='btn btn-outline-primary btn-lg col-5 withdrawUSDCBtn' onClick={() => sendNative('0.001')}>Withdraw USDC</button>
              </div>
            </div>
            }
            </div>
            </div>
          </div>
        </div>
        </div>
        <div className='col-1'></div>
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

function approveUSDC() {

}

function depositUSDC() {

}

function withdrawUSDC() {

}

// function DepositedUSDC(wallet) {
//   console.log(`Wallet: ${wallet}`);

//   const {value, error} = useCall({
//     contract: new Contract('0x2cB67fce82d003Cc2f4b7B37E9b8C915AD9431fE', hackabetABI),
//     method: 'users',
//     args: [wallet]
//   }) ?? {}

//   if (error) {
//     console.log(error.message);
//   }

//   console.log(value);

//   return (
//     {wallet}
//   )
// }

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
