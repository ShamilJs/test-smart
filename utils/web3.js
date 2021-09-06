import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import Web4 from '@cryptonteam/web4';
import { output, error } from '~/utils/index';
import { ERC20 } from './abis';

let web4;
let web3Wallet;
let userAddress;
let chainId;

export const fetchContractData = async (method, abi, address, params) => {
  try {
    const Contract = new web3Wallet.eth.Contract(abi, address)
    return await Contract.methods[method].apply(this, params).call()
  } catch (err) {
    console.log(err)
    return false
  }
};

export const getUserAddress = () => userAddress;

export const createInst = async (address) => {
  if (!web4) {
    throw new Error('web4 undefined')
  }
  const abs = web4.getContractAbstraction(ERC20)
  return await abs.getInstance(address)
};

export const connectWallet = async () => {
  try {
    let provider
    const { ethereum } = window
    provider = ethereum
    web3Wallet = new Web3(provider)
    userAddress = await web3Wallet.eth.getCoinbase()

    if (userAddress === null) {
      await provider.enable()
    }

    userAddress = await web3Wallet.eth.getCoinbase()
    chainId = await web3Wallet.eth.net.getId()

    if (+chainId !== 4) {
      alert(`Current site work in rinkeby, Error: 500, chainId: ${chainId}`)
      return
    }

    web4 = new Web4();
    await web4.setProvider(provider, userAddress)

    return output()
  } catch (err) {
    return error(500, 'err', err)
  }
}

export const getTransaction = (tokenAddress, fn) => {
  const inst = new web3Wallet.eth.Contract(ERC20, tokenAddress)

  inst.events.Transfer({
    fromBlock: 0,
    filter: {
      from: userAddress
    }
  }, (e, r) => fn(r))

  inst.events.Approval({
    fromBlock: 0,
    filter: {
      owner: userAddress
    }
  }, (e, r) => fn(r))
}
