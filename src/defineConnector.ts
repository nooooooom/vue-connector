import { computed, DefineComponent, defineComponent, getCurrentInstance, h, VNode } from 'vue'
import { forwardRef } from 'vue-forward-ref'
import {
  cloneVNode,
  isEventKey,
  isVue2,
  mergeListeners,
  toListenerKey,
  useProps
} from 'vue-lib-toolkit'
import {
  ComponentCreationType,
  DefineConnector,
  MapStateProps,
  MapStatePropsFactory,
  MapStaticProps,
  MergeProps,
  PreserveProps,
  Props
} from './types'
import { identity, isDefineComponent, normalizeFunction, normalizeSlots } from './utils'
import { defaultMergeProps } from './mergeProps'

// implementation
function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps?:
    | MapStateProps<StateProps, OwnProps>
    | MapStatePropsFactory<StateProps, OwnProps>
    | null
    | undefined,
  mapStaticProps?: MapStaticProps<StaticProps, OwnProps> | null | undefined,
  mergeProps?: MergeProps<StateProps, StaticProps, OwnProps, MergedProps> | null | undefined
) {
  // Normalize
  const normalizedMapStateProps = normalizeFunction<
    MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>
  >(mapStateProps)
  const normalizedMapStaticProps =
    normalizeFunction<MapStaticProps<StaticProps, OwnProps>>(mapStaticProps)
  const normalizedMergeProps = normalizeFunction(mergeProps, defaultMergeProps)

  return (component: ComponentCreationType, propsDefinition: Record<string, any> = {}) => {
    const wrappedComponentName = (isDefineComponent(component) && component.name) || 'Component'
    const connectComponentName = `Connect${wrappedComponentName}`

    const Connect = defineComponent({
      name: connectComponentName,

      inheritAttrs: false,

      props: propsDefinition,

      setup(props, context) {
        const instance = getCurrentInstance()!

        const ownProps = useProps<OwnProps>()

        const initializedStateProps = normalizedMapStateProps(ownProps, instance)
        const stateProps =
          typeof initializedStateProps === 'function'
            ? // factory
              computed(() =>
                (initializedStateProps as MapStateProps<StateProps, OwnProps>)(ownProps, instance)
              )
            : computed(() => normalizedMapStateProps(ownProps, instance) as StateProps)
        const staticProps = normalizedMapStaticProps(ownProps, instance)

        const mergedProps = computed(() =>
          normalizedMergeProps(stateProps.value, staticProps, ownProps, instance)
        )
        // omit ['class', 'style', '$$slots']
        const componentProps = computed(() => {
          const props = { ...mergedProps.value }
          for (const s of PreserveProps) {
            delete props[s]
          }
          return props
        })

        const classAndStyleProps = computed(() => {
          const { value: mergedPropsValue } = mergedProps
          if (!mergedPropsValue) {
            return
          }

          // Avoid leaving empty attributes
          const props = {} as Props
          if (mergedPropsValue.class) {
            props.class = mergedPropsValue.class
          }
          if (mergedPropsValue.style && Object.keys(mergedPropsValue.style).length) {
            props.style = mergedPropsValue.style
          }

          return props
        })

        const render = computed(() => normalizeFunction(mergedProps.value?.$$render, identity))

        if (isVue2) {
          const vnodeData = computed(() => {
            const { value: componentPropsValue } = componentProps

            const attrs = {} as Record<string, any>
            const on = {} as Record<string, any>
            for (const prop in componentPropsValue) {
              const value = componentPropsValue[prop]
              if (isEventKey(prop)) {
                // onEvent -> event
                on[toListenerKey(prop)] = value
              } else {
                attrs[prop] = value
              }
            }

            return {
              attrs,
              on: mergeListeners((context as any).listeners, on)
            }
          })

          return () => {
            const props = {
              ...vnodeData.value,
              ...classAndStyleProps.value
            } as Props

            const { $vnode, $slots, $scopedSlots } = <any>instance.proxy
            const { slots, scopedSlots } = normalizeSlots({
              ...$scopedSlots,
              ...$slots,
              ...$vnode?.data?.slot,
              ...mergedProps.value?.$$slots
            })
            if (Object.keys(scopedSlots).length) {
              props.scopedSlots = scopedSlots
            }

            const children = Object.values(slots)

            let vnode: VNode | undefined
            if (typeof component === 'object') {
              // @ts-ignore: Vue2's `h` doesn't process vnode
              const EmptyVNode = h()
              if (component instanceof EmptyVNode.constructor) {
                vnode = cloneVNode(component as VNode, props)
                vnode!.children = children
              }
            }

            if (!vnode) {
              vnode = h(component as any, props, children)
            }

            return render.value(forwardRef(vnode))
          }
        }

        return () => {
          const props = {
            ...componentProps.value,
            ...classAndStyleProps.value
          }
          const children = {
            ...context.slots,
            ...normalizeSlots(mergedProps.value?.$$slots)?.scopedSlots
          }

          const vnode = h(component as any, props, children)
          return render.value(forwardRef(vnode))
        }
      }
    })

    return Connect as DefineComponent<OwnProps>
  }
}

export default defineConnector as DefineConnector
