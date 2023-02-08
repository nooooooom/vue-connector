import { createApp, defineComponent, h } from 'vue'
import { useStore } from 'vuex'
import { defineConnector } from '../../../src'
import { store } from './stores'

const Button = defineComponent({
  name: 'Button',
  props: {
    content: String,
    onClick: Function
  },
  render() {
    return h(
      'button',
      {
        onClick: this.onClick
      },
      this.content
    )
  }
})

const mapStatePropsFactory = () => {
  const store = useStore()
  return () => {
    return {
      content: `count: ${store.state.count}`
    }
  }
}

const mapStaticProps = () => {
  const store = useStore()
  return {
    onClick: () => store.commit('increment')
  }
}

const IncrementButton = defineConnector(mapStatePropsFactory, mapStaticProps)(Button)

const app = createApp({
  render() {
    return h(IncrementButton)
  }
})

app.use(store)
app.mount('#app')
