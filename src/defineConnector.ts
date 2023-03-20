import {
  cloneVNode,
  computed,
  DefineComponent,
  defineComponent,
  getCurrentInstance,
  h,
  VNode
} from 'vue'
import { forwardRef } from 'vue-forward-ref'
import { isVue2, useProps } from 'vue-lib-toolkit'
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
            ? computed(() =>
                (initializedStateProps as MapStateProps<StateProps, OwnProps>)(ownProps, instance)
              )
            : computed(() => normalizedMapStateProps(ownProps, instance) as StateProps)

        const staticProps = normalizedMapStaticProps(ownProps, instance)

        const mergedProps = computed(() =>
          normalizedMergeProps(stateProps.value, staticProps, ownProps, instance)
        )

        const componentProps = computed(() => {
          // TODO: Changes to specify props also effect the component props
          const props = { ...mergedProps.value } as any

          for (const s of specifyPropsValues) {
            delete props[s]
          }

          return props
        })

        const specifyProps = computed(() => {
          const mergedPropsValue = mergedProps.value as any
          const props = {} as any

          for (const s of specifyPropsValues) {
            props[s] = mergedPropsValue[s]
          }

          return props
        })

        return () => {
          if (!component) {
            return
          }

          const specifyScopedSlots = specifyProps.value[SpecifyProps.SCOPED_SLOTS]

          let vnode: VNode | undefined = undefined
          if (isVue2) {
            const compatInstance = instance.proxy as any
            const inheritProps = compatInstance.$vnode.data || {}
            const props = {
              ...inheritProps,
              props: {},
              attrs: componentProps.value,
              on: (context as any).listeners,
              scopedSlots: {
                ...compatInstance.$scopedSlots,
                ...specifyScopedSlots
              }
            }

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
          } else {
            const children = instance.vnode.children
            const scopedSlots = {
              ...(children && typeof children === 'object'
                ? children
                : { default: () => children }),
              ...specifyScopedSlots
            }

            vnode = h(component as any, componentProps.value, scopedSlots)
          }

          return forwardRef(vnode)
        }
      }
    })

    return Connect as DefineComponent<OwnProps>
  }
}

export default defineConnector as DefineConnector
