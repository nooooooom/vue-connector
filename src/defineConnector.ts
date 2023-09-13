import {
  computed,
  DefineComponent,
  defineComponent,
  ExtractPropTypes,
  getCurrentInstance,
  h,
  VNode
} from 'vue-module-demi'
import { forwardRef } from 'vue-forward-ref'
import {
  cloneVNode,
  isEventKey,
  isVue2,
  mergeListeners,
  toEventKey,
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
import {
  isDefineComponent,
  normalizeFunction,
  normalizeSlots,
  resolveComponentPropsDefinition
} from './utils'
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

  return <AdditionalProps extends Record<string, any> | null>(
    component: ComponentCreationType,
    additionalProps?: AdditionalProps | null,
    inheritProps?: boolean | ((inheritedProps: Record<string, any>) => Record<string, any>)
  ) => {
    const wrappedComponentName = (isDefineComponent(component) && component.name) || 'Component'
    const connectComponentName = `Connect${wrappedComponentName}`

    const inheritedProps = resolveComponentPropsDefinition(component)

    const Connect = defineComponent({
      name: connectComponentName,

      inheritAttrs: true,

      props: {
        ...(typeof inheritedProps === 'function'
          ? inheritedProps()
          : inheritProps && inheritedProps),
        ...additionalProps
      },

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
              props: attrs,
              on: mergeListeners((context as any).listeners, on),
              nativeOn: {
                ...mergedProps.value?.$$nativeOn
              }
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
                vnode = cloneVNode!(component as VNode, props)
                vnode!.children = children
              }
            }

            if (!vnode) {
              vnode = h(component as any, props, children)
            }

            return forwardRef(vnode)
          }
        }

        return () => {
          const props = {
            ...componentProps.value,
            ...classAndStyleProps.value,
            ...mergedProps.value?.$$nativeOn
          }
          const children = {
            ...context.slots,
            ...normalizeSlots(mergedProps.value?.$$slots)?.scopedSlots
          }

          const $$nativeOn = mergedProps.value?.$$nativeOn
          for (const prop in $$nativeOn) {
            props[toEventKey(prop)] = $$nativeOn[prop]
          }

          const vnode = h(component as any, props, children as any)
          return forwardRef(vnode)
        }
      }
    })

    return Connect as any as DefineComponent<
      Omit<OwnProps, keyof AdditionalProps> & ExtractPropTypes<AdditionalProps>
    >
  }
}

export default defineConnector as DefineConnector
