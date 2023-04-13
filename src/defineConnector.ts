import { computed, DefineComponent, defineComponent, getCurrentInstance, h, VNode } from 'vue'
import { forwardRef } from 'vue-forward-ref'
import {
  cloneVNode,
  isEventKey,
  isVue2,
  mergedClass,
  mergedStyle,
  mergeListeners,
  ShapeFlags,
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
import { isDefineComponent, normalizeFunction, normalizeSlots } from './utils'

function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  staticProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...staticProps } as MergedProps
}

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

        const slotProps = computed(() => normalizeSlots(mergedProps.value.$$slots))
        const classAndStyleProps = computed(() => {
          const { value: mergedPropsValue } = mergedProps
          return {
            class: mergedPropsValue.class,
            style: mergedPropsValue.style
          }
        })

        if (isVue2) {
          return () => {
            const { value: componentPropsValue } = componentProps

            const attrs = {} as Props
            const listenersProps = {} as Props
            for (const prop in componentPropsValue) {
              const value = componentPropsValue[prop]
              if (isEventKey(prop)) {
                // onEvent -> event
                listenersProps[toListenerKey(prop)] = value
              } else {
                attrs[prop] = value
              }
            }

            const props = {
              attrs,
              on: mergeListeners((context as any).listeners, listenersProps),
              ...classAndStyleProps.value
            } as any

            const { scoped, slots } = slotProps.value
            if (slots) {
              if (scoped) {
                props.scopedSlots = {
                  ...(instance.proxy as any).$scopedSlots,
                  ...slots
                }
              } else {
                props.slot = {
                  ...(instance.proxy as any).$slots,
                  ...slots
                }
              }
            }

            let vnode: VNode | undefined
            if (typeof component === 'object') {
              // @ts-ignore: Vue2's `h` doesn't process vnode
              const EmptyVNode = h()
              if (component instanceof EmptyVNode.constructor) {
                vnode = cloneVNode(component as VNode, props)
              }
            }

            if (!vnode) {
              vnode = h(component as any, props)
            }

            return forwardRef(vnode)
          }
        }

        return () => {
          const props = {
            ...componentProps.value,
            ...classAndStyleProps.value
          }

          const { slots: scopedSlots } = slotProps.value
          const children = instance.vnode.children
          const mergedChildren = scopedSlots
            ? children
              ? instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN
                ? {
                    ...(children as any),
                    ...scopedSlots
                  }
                : {
                    default: () => children,
                    ...scopedSlots
                  }
              : scopedSlots
            : children

          const vnode = h(component as any, props, mergedChildren)
          return forwardRef(vnode)
        }
      }
    })

    return Connect as DefineComponent<OwnProps>
  }
}

export default defineConnector as DefineConnector
