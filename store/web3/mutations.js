export default {
  setIsConnected(state, payload) {
    state.isConnected = payload;
  },
  setUserAddress(state, payload) {
    state.userAddress = payload;
  },

  setToken(state, payload) {
    const index  = state.tokens.findIndex(item => item.symbol === payload.symbol)
    if (index !== -1) {
      state.tokens.splice(index, 1)
    }
    state.tokens = [...state.tokens, payload]
  },

  setBalance(state, payload) {
    state.balance = payload;
  },
  setAllowance(state, payload) {
    state.allowance = payload;
  },
  setTransactions(state, payload) {
    state.transactions = [...state.transactions, payload]
  }
};
