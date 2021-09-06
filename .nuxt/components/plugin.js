import Vue from 'vue'
import { wrapFunctional } from './utils'

const components = {
  Loader: () => import('../../components/loader/index.vue' /* webpackChunkName: "components/loader" */).then(c => wrapFunctional(c.default || c))
}

for (const name in components) {
  Vue.component(name, components[name])
  Vue.component('Lazy' + name, components[name])
}
