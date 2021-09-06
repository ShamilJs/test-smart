import BigNumber from 'bignumber.js';
import { connectWallet, createInst, getTransaction, getUserAddress } from '../../utils/web3';

export default {
  async connectWallet({ dispatch, commit  }) {
    dispatch('loader/setLoading', true, { root: true })
    const r = await connectWallet()
    if (!r || !r.ok) {
      return null
    }
    commit('setIsConnected', true);
    commit('setUserAddress', getUserAddress())
    dispatch('loader/setLoading', false, { root: true })
  },

  async setToken({ commit, getters }, tokenAddress) {
    const { getUserAddress } = getters
    const instance = await createInst(tokenAddress)
    const symbol = await instance.symbol()
    const decimalsToken = await instance.decimals()
    const decimals = new BigNumber(decimalsToken).toString()
    let balance = await instance.balanceOf(getUserAddress)
    balance = new BigNumber(balance).shiftedBy(-decimals).toString()
    const token = {
      symbol,
      decimals,
      balance,
      instance,
      tokenAddress
    };
    commit('setToken', token)
  },

  async setCurrentBalance({ commit, getters }, tokenSymbol) {
    const { getTokens } = getters
    const token = getTokens.find(item => item.symbol === tokenSymbol)
    commit('setBalance', token.balance)
  },

  async setCurrentAllowance({ commit, getters }, payload) {
    const { getUserAddress, getTokens } = getters
    const { symbol, recipientAddress } = payload
    try {
      const token = getTokens.find(item => item.symbol === symbol)
      const allowance = await token.instance.allowance(getUserAddress, recipientAddress);
      commit('setAllowance', +new BigNumber(allowance).toString());
    } catch (e) {
      console.log(e);
    }
  },

  async approve({ getters, dispatch }, payload) {
    const { getTokens } = getters
    const { symbol, recipientAddress, amount } = payload
    const token = getTokens.find(item => item.symbol === symbol)
    dispatch('loader/setLoading', true, { root: true })
    try {
      await token.instance.approve(recipientAddress, amount);
      dispatch('setCurrentAllowance', {recipientAddress, symbol})
      dispatch('loader/setLoading', false, { root: true })
    } catch (e) {
      console.log(e);
    }
  },

  async transfer({ commit, getters, dispatch }, payload) {
    const { getTokens } = getters
    const { symbol, recipientAddress, amount } = payload
    const token = getTokens.find(item => item.symbol === symbol)
    const decimals = +token.decimals
    dispatch('loader/setLoading', true, { root: true })
    try {
      const transferAmount = new BigNumber(amount).shiftedBy(decimals).toString()
      await token.instance.transfer(recipientAddress, transferAmount)
      commit('setBalance', token.balance - amount)
      dispatch('setToken', token.tokenAddress)
      dispatch('loader/setLoading', false, { root: true })
    } catch (e) {
      console.log(e);
    }
  },

  async getTransaction({ commit, getters }, tokenAddress) {
    const { getTokens } = getters
    let res
    const token = getTokens.find(item => item.tokenAddress === tokenAddress)
    await getTransaction(tokenAddress, async r => {
      res = await r.returnValues
      const transaction = {
        from: r.event === 'Transfer' ? res.from : res.owner,
        to: r.event === 'Transfer' ? res.to : res.spender,
        type: r.event,
        amount: r.event === 'Approval'
          ? res.value
          : new BigNumber(res.value).shiftedBy(-token.decimals).toString(),
        token
      }
      commit('setTransactions', transaction)
    })    
  }
};
