import { wrapFunctional } from './utils'

export { default as Loader } from '../../components/loader/index.vue'

export const LazyLoader = import('../../components/loader/index.vue' /* webpackChunkName: "components/loader" */).then(c => wrapFunctional(c.default || c))
