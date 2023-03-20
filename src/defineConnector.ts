import { computed, DefineComponent, defineComponent, getCurrentInstance, h, VNode } from 'vue'
import { forwardRef } from 'vue-forward-ref'
import {
  cloneVNode,
  isEventKey,
  isVue2,
  mergeListeners,
  ShapeFlags,
  toListenerKey,
  useProps
} from 'vue-lib-toolkit'
import { SpecifyProps, specifyPropsValues } from './specifyProps'
import {
  ComponentCreationType,
  DefineConnector,
  MapStateProps,
  MapStatePropsFactory,
  MapStaticProps,
  MergeProps
} from './types'

function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  staticProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...staticProps } as MergedProps
}

function isDefineComponent(component: ComponentCreationType): component is DefineComponent {
  return !!component && typeof component === 'object'
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
  // normalize
  const normalizedMapStateProps =
    typeof mapStateProps === 'function' ? mapStateProps : () => null as StateProps
  const normalizedMapStaticProps =
    typeof mapStaticProps === 'function' ? mapStaticProps : () => null as StaticProps
  const normalizedMergeProps = typeof mergeProps === 'function' ? mergeProps : defaultMergeProps

  return (component: ComponentCreationType) => {
    const wrappedComponentName = (isDefineComponent(component) && component.name) || 'Component'
    const componentName = `Connect${wrappedComponentName}`

    const Connect = defineComponent({
      name: componentName,

      inheritAttrs: false,

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

        const componentProps = computed(() => {
          // TODO: Changes to specify props also effect the component props
          const props = { ...mergedProps.value } as Record<string, any>

          for (const s of specifyPropsValues) {
            delete props[s]
          }

          return props
        })

        // { scopedSlots, ... }
        const specifyProps = computed(() => {
          const mergedPropsValue = mergedProps.value as Record<string, any>
          const props = {} as Record<string, any>

          for (const s of specifyPropsValues) {
            props[s] = mergedPropsValue[s]
          }

          return props
        })

        if (isVue2) {
          // { onEvent, ... }
          const listenerProps = computed(() => {
            const props = componentProps.value
            const listenerProps = {} as Record<string, any>

            for (const prop in props) {
              if (isEventKey(prop)) {
                listenerProps[toListenerKey(prop)] = props[prop]
              }
            }

            return listenerProps
          })

          return () => {
            const props = componentProps.value
            const mergedProps = {
              attrs: props,
              on: mergeListeners((context as any).listeners, listenerProps.value),
              scopedSlots: {
                ...(instance.proxy as any).$scopedSlots,
                ...specifyProps.value[SpecifyProps.SCOPED_SLOTS]
              },
              slots: {
                ...(instance.proxy as any).$slots,
                ...specifyProps.value[SpecifyProps.SLOTS]
              }
            }

            let vnode: VNode | undefined
            if (typeof component === 'object') {
              // @ts-ignore: Vue2's `h` doesn't process vnode
              const EmptyVNode = h()
              if (component instanceof EmptyVNode.constructor) {
                vnode = cloneVNode(component as VNode, mergedProps)
              }
            }

            if (!vnode) {
              vnode = h(component as any, mergedProps)
            }

            return forwardRef(vnode)
          }
        }

        return () => {
          const props = componentProps.value
          const children = instance.vnode.children
          const slots = children
            ? instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN
              ? (children as any)
              : {
                  default: () => children
                }
            : null

          const vnode = h(component as any, props, {
            ...slots,
            ...specifyProps.value[SpecifyProps.SCOPED_SLOTS]
          })

          return forwardRef(vnode)
        }
      }
    })

    return Connect as DefineComponent<OwnProps>
  }
}

export default defineConnector as DefineConnector
