import { describe, it, assert } from 'vitest'
import { createApp, h } from 'vue'
import { defineConnector } from '../src'

describe('Basic', () => {
  it('mergeProps should work', () => {
    const connector = defineConnector(null, null, () => {
      
    })

  })

  it('children should be inherited', () => {
    const connector = defineConnector()
    const slots = {
      default: () => 'default',
      foo: () => 'foo'
    }

    createApp({
      render() {
        return h(
          connector({
            render() {
              assert.containsAllKeys(this.$slots, slots)
            }
          }),
          null,
          { ...slots }
        )
      }
    }).mount(document.createElement('div'))
  })
})
