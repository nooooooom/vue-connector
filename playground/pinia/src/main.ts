import { createApp, defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import { defineConnector } from '../../../src'
import { useCounterStore } from './stores'

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
  const counterStore = useCounterStore()
  return () => {
    return {
      content: `count: ${counterStore.count}`
    }
  }
}

const mapStaticProps = () => {
  const counterStore = useCounterStore()
  return {
    onClick: counterStore.increment
  }
}

const IncrementButton = defineConnector(mapStatePropsFactory, mapStaticProps)(Button)

const pinia = createPinia()

const app = createApp({
  render() {
    return h(IncrementButton)
  }
})

app.use(pinia)
app.mount('#app')
