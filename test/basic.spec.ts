import { describe, it, assert, vi, expect } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
// import Vue2, { defineComponent, h, nextTick } from 'vue'
import { defineConnector, omitRedundantProps, wrapperDefaultMergeProps } from '../src'

const mount = (component: any, props?: any, thenUnmount = true) => {
  const instance = createApp({
    render() {
      return h(component, props)
    }
  })

  instance.mount(document.createElement('div'))
  if (thenUnmount) {
    void nextTick(() => instance.unmount())
  }

  return instance
}

// const mount = (component: any, props?: any, thenUnmount = true) => {
//   const instance = new Vue2({
//     render() {
//       return h(component, {
//         attrs: props,
//         ...props
//       })
//     }
//   })

//   instance.$mount(document.createElement('div'))
//   if (thenUnmount) {
//     void nextTick(() => instance.$destroy())
//   }

//   return instance
// }

const Empty = defineComponent({
  setup(props, { emit }) {
    emit('setup')
  },
  render() {}
})

describe('Basic', () => {
  it('should be able to receive all props and attrs', () => {
    const expectedProps = {
      foo: 'foo',
      bar: 'bar'
    }
    const validateProps = (ownProps: any) => {
      assert.deepEqual(expectedProps, ownProps)
    }
    const connector = defineConnector(validateProps, validateProps)

    mount(connector(Empty), expectedProps)
  })

  it('should be able to forward the event', () => {
    const connector = defineConnector()
    const onSetup = vi.fn()

    mount(connector(Empty), {
      onSetup,
      on: {
        setup: onSetup
      }
    })

    void nextTick(() => {
      expect(onSetup).toBeCalled()
    })
  })

  it('mergeProps should work', () => {
    const mergedProps = {
      foo: 'foo',
      bar: 'bar'
    }
    const connector = defineConnector(
      () => ({
        foo: 1,
        bar: 2
      }),
      null,
      () => {
        return mergedProps
      }
    )
    mount(
      connector(
        defineComponent({
          setup(props, { attrs }) {
            assert.deepEqual(mergedProps, { ...attrs, ...props } as any)
            return () => {}
          }
        })
      )
    )
  })

  it('children should be inherited', () => {
    const connector = defineConnector()
    const slots = {
      default: () => 'default',
      foo: () => 'foo'
    }

    mount(
      h(
        connector({
          render() {
            assert.containsAllKeys((this as any).$slots, slots)
          }
        }) as any,
        { scopedSlots: slots } as any,
        { ...slots } as any
      )
    )
  })

  it('should be excluded all props that are not needed', () => {
    const expectedProps = {
      foo: 'foo',
      bar: 'bar'
    }
    const unexpectedProps = {
      'data-foo': 'foo',
      dataBar: 'bar'
    }
    const validateProps = (ownProps: any) => {
      assert.deepEqual(expectedProps, ownProps)
    }
    const connector = defineConnector(
      null,
      null,
      wrapperDefaultMergeProps((mergedProps) => {
        validateProps(omitRedundantProps(mergedProps, Object.keys(unexpectedProps)))
      })
    )

    mount(connector(Empty), {
      ...expectedProps,
      ...unexpectedProps
    })
  })
})
