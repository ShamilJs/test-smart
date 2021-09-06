<template>
  <div class="test-smart">
    <loader/>
    <div class="test-smart__body">
      <div class="test-smart__head">
        <b-button
          class="test-smart__btn"
          :disabled="this.isConnected"
          @click="handleConnectWallet"
        >
          {{ buttonConnectName }}
        </b-button>
      </div>

      <div class="test-smart__inputs inputs">
        <div class="inputs__amount">
          <label for="amount">Amount</label>
          <div class="inputs__amount-control">
            
            <ValidationProvider
              rules="positive|required"
              v-slot="{ errors }"
              class="inputs__provider"
            >
              <input
                class="inputs__input"
                id="amount"
                type="number"
                v-model="amount"
                placeholder="amount"
              >
              <span class="inputs__error">{{ errors[0] }}</span>
            </ValidationProvider>

            <div class="inputs__btn">
              <b-button
                class="test-smart__btn"
                :disabled="!this.tokens.length"
                @click="toggleDropdown"
              >
                {{ buttonSelectName }}
                <span></span>
              </b-button>
              <div
                v-if="isCollapse"
                class="inputs__dropdown"
                :class="{'inputs__dropdown-show': isCollapse}"
              >
                <p
                  v-for="(item, i) in this.tokens"
                  :key="i"
                  @click="toggleDropdown(item.symbol)"
                >
                  {{ item.symbol }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="inputs__address">
          <label for="recipient">Address (recipient)</label>
          <ValidationProvider
            rules="address|required"
            v-slot="{ errors }"
            class="inputs__provider"
          >
            <input
              class="inputs__input"
              id="recipient"
              v-model="recipientAddress"
              placeholder="recipient"
            >
            <span class="inputs__error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      </div>

      <div class="test-smart__balance">
        <p>Your balance: {{ balance }} {{ tokenSymbol }}</p>
        <p>Your allowance: {{ allowance }}</p>
      </div>

      <div class="test-smart__control">
        <b-button
          @click="approve"
          class="test-smart__btn"
          :disabled="!this.isConnected || !this.isActiveApprove"
        >
          Approve
        </b-button>
        <b-button
          class="test-smart__btn"
          @click="transfer"
          :disabled="!this.isConnected || !this.isActiveTransfer"
        >
          Transfer
        </b-button>
      </div>
      
      <div class="test-smart__transactions transactions">
        <p class="transactions__title">Your transactions</p>
        <ul class="transactions__list">
          <li
            v-for="(item, i) in transactions"
            :key="i"
          >
            <div>
              <p>Type</p>
              <p>{{ item.type }}</p>
            </div>
            <div>
              <p>From</p>
              <p>{{ item.from }}</p>
            </div>
            <div>
              <p>To</p>
              <p>{{ item.to }}</p>
            </div>
            <div>
              <p>Amount</p>
              <p>{{ item.amount }} {{ item.token.symbol }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { tokensAddress } from '../config/index'
import loader from '../components/loader'
import { ValidationProvider } from 'vee-validate';
import { extend } from 'vee-validate';

export default {
  name: 'App',
  components: {
    loader,
    ValidationProvider
  },
  data: () => ({
    isCollapse: false,
    amount: '',
    recipientAddress: '',
    tokenSymbol: '',
    isActiveApprove: false,
    isActiveTransfer: false
  }),
  computed: {
    ...mapGetters({
      isConnected: 'web3/getIsConnected',
      tokens: 'web3/getTokens',
      userAddress: 'web3/getUserAddress',
      allowance: 'web3/getAllowance',
      balance: 'web3/getBalance',
      transactions: 'web3/getTransactions'
    }),
    buttonSelectName() {
      return this.tokenSymbol ? this.tokenSymbol : 'SELECT'
    },
    buttonConnectName() {
      return this.isConnected
        ? `${this.userAddress.substring(0, 5)}..${this.userAddress.substring(35)}`
        : 'Connect Wallet'
    }
  },
  watch: {
    recipientAddress: {
      async handler (val) {
        if (val.length === 42 && this.tokenSymbol) {
          await this.getAllowance()
          this.changeButtonsStatus()
        }
      }
    },
    tokenSymbol: {
      async handler (val) {
        if (val && this.recipientAddress.length === 42) {
          await this.getAllowance()
          this.changeButtonsStatus()
        }
      }
    },
    allowance: {
      handler (val) {
        if (val) {
          this.isActiveTransfer = true
        }
      }
    },
  },
  methods: {
    ...mapActions({
      connectWallet: 'web3/connectWallet',
      setToken: 'web3/setToken',
      setCurrentAllowance: 'web3/setCurrentAllowance',
      setApprove: 'web3/approve',
      executeTransfer: 'web3/transfer',
      setBalance: 'web3/setCurrentBalance',
      getTransaction: 'web3/getTransaction'
    }),
    toggleDropdown (value) {
      if (typeof(value) === 'string') {
        this.tokenSymbol = value
        this.setBalance(this.tokenSymbol )
      }
      this.isCollapse = !this.isCollapse
    },
    changeButtonsStatus () {
      if (this.allowance === 0) {
        this.isActiveApprove = true
        this.isActiveTransfer = false
      } else {
        this.isActiveApprove = false
        this.isActiveTransfer = true
      }
    },
    async handleConnectWallet() {
      this.currencies = [];
      const connect = await this.connectWallet()
      if (connect === null) return
      if (this.isConnected) {
        await Promise.all(tokensAddress.map(item => this.setToken(item)))
        await Promise.all(tokensAddress.map(item => this.getTransaction(item)))
      }     
    },
    async getAllowance() {
      if (!this.isConnected) return
      await this.setCurrentAllowance({
        symbol: this.tokenSymbol,
        recipientAddress: this.recipientAddress
      })
      console.log('allowance', this.allowance);
    },
    async approve() {
      if (!this.amount) {
        alert('Please, enter AMOUNT')
        return
      }
      await this.setApprove({
        symbol: this.tokenSymbol,
        recipientAddress: this.recipientAddress,
        amount: +this.amount
      })
    },
    async transfer() {
      if (this.allowance < this.amount) {
        await this.approve()
      }
      await this.executeTransfer({
        symbol: this.tokenSymbol,
        recipientAddress: this.recipientAddress,
        amount: +this.amount
      })
    },
  },
};
/** validation */
extend('positive', {
  validate(value) {
    if (value > 0) {
      return {
        valid: true
      };
    }
  },
  message: 'This field is not valid. Value > 0'
});
extend('address', {
  validate(value) {
    if (value.length === 42) {
      return true
    } 
  },
  message: 'please enter a valid address'
});
extend('required', {
  validate(value) {
    return {
      required: true,
      valid: ['', null, undefined].indexOf(value) === -1
    };
  },
  computesRequired: true,
  message: 'This field is required'
});
</script>

<style lang="scss" scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.test-smart {
  position: relative;
  display: flex;
  justify-content: center;
  max-width: 1140px;
  height: 100%;
  margin: 0 auto;
  padding: 30px 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  &__body {
    height: 100%;
    width: 100%;
  }
  &__head {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-bottom: 70px;
  }
  &__btn {
    background-color: #63BCD8;
    width: 100%;
    max-width: 187px;
    height: 100%;
    border-color: transparent;
    border-radius: 0%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    &:disabled {
      background-color: #a7afb1;
    }
    & span {
      width: 15px;
      height: 15px;
      display: block;
      transform: rotate(45deg);
      border-right: 2px solid white;
      border-bottom: 2px solid white;
      margin: 0 0 10px 10px;
    }
  }
  &__balance {
    margin-bottom: 30px;
  }
  &__control {
    width: 400px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 50px;
  }
}
.inputs {
  &__amount, &__address {
    display: flex;
    flex-direction: column;
    margin-bottom: 30px;
  }
  &__amount {
    &-control {
      display: flex;
      gap: 20px;
    }
  }
  &__provider {
    width: 100%;
    position: relative;
    z-index: 0;
  }
  &__input {
    width: 100%;
    height: 50px;
    border-radius: 0%;
    border: none;
    background-color: #F3F5FA;
    padding-left: 20px;
    color: #000000;
  }
  &__error {
    position: absolute;
    bottom: -25px;
    left: 0;
    color: red;
    font-weight: 700;
  }
  &__btn {
    min-height: 100%;
    width: 144px;
    position: relative;
  }
  &__dropdown {
    width: 100%;
    border: 1px solid #63BCD8;
    position: absolute;
    top: 100%;
    opacity: 0;
    transition: opacity 1.15s;
    background: white;
    z-index: 2;
    & p {
      border-bottom: 1px solid #63BCD8;
      margin-bottom: 0;
      padding-top: 5px;
      text-align: center;
      height: 35px;
      cursor: pointer;
      &:hover {
        box-shadow: 1px 1px 7px 2px rgba(0, 0, 255, .2);
      }
      
    }
    &-show {
      opacity: 1;
    }
  }
}
.transactions {
  margin-bottom: 50px;
  &__title {
    font-weight: bold;
    font-size: 22px;
    line-height: 26px;
    color: #000000;
  }
  &__list {
    padding: 0;
    & li {
      background: #F3F5FA;
      height: 60px;
      display: grid;
      grid-template-columns: 1fr 2fr 2fr 1fr;
      margin-top: 20px;
      padding: 5px 15px;
      & p {
        margin-bottom: 0;
        font-size: 14px;
      }
    }
  }
}
</style>
