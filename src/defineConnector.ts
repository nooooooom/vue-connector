import {
  computed,
  DefineComponent,
  defineComponent,
  getCurrentInstance,
  h,
  version,
  VNode
} from 'vue'
import { forwardRef } from 'vue-forward-ref'
import { useProps } from './composables/useProps'
import { useStateProps } from './composables/useStateProps'
import {
  ComponentType,
  Connector,
  MapStateProps,
  MapStatePropsFactory,
  MapStaticProps,
  MergeProps
} from './types'

const isVue2 = +version.split('.')[0] !== 3

function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  staticProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...staticProps } as MergedProps
}

// no-unnecessary-generics
export function defineConnector<
  StateProps = {},
  StaticProps = {},
  OwnProps = {},
  MergedProps = {}
>(): Connector<{}, {}>

// overload 1: mapStateProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}>(
  mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>
): Connector<StateProps & StaticProps, OwnProps>

// overload 2: mapStaticProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}>(
  mapStateProps: null | undefined,
  mapStaticProps: MapStaticProps<StaticProps, OwnProps>
): Connector<StateProps & StaticProps, OwnProps>

// overload 3: mapStateProps and mapStaticProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}>(
  mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
  mapStaticProps: MapStaticProps<StaticProps, OwnProps>
): Connector<StateProps & StaticProps, OwnProps>

// overload 4: mergeProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: null | undefined,
  mapStaticProps: null | undefined,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector<MergedProps, OwnProps>

// overload 5: mapStateProps and mergeProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
  mapStaticProps: null | undefined,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector<MergedProps, OwnProps>

// overload 6: mapStaticProps and mergeProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: null | undefined,
  mapStaticProps: MapStaticProps<StaticProps, OwnProps>,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector<MergedProps, OwnProps>

// implementation
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps?:
    | MapStateProps<StateProps, OwnProps>
    | MapStatePropsFactory<StateProps, OwnProps>
    | null
    | undefined,
  mapStaticProps?: MapStaticProps<StaticProps, OwnProps> | null | undefined,
  userMergeProps?: MergeProps<StateProps, StaticProps, OwnProps, MergedProps> | null | undefined
): unknown {
  return (component: ComponentType) => {
    const wrappedComponentName = (component as DefineComponent).name || 'Component'
    const componentName = `Connect${wrappedComponentName}`

    const Connect = defineComponent({
      name: componentName,

      setup(props, context) {
        const instance = getCurrentInstance()!

        const ownProps = useProps<OwnProps>(props, context)
        const statePropsRef = useStateProps<StateProps, OwnProps>(mapStateProps, ownProps, instance)
        const staticProps =
          typeof mapStaticProps === 'function' ? mapStaticProps(ownProps, instance) : undefined

        const mergeProps = typeof userMergeProps === 'function' ? userMergeProps : defaultMergeProps
        const mergedProps = computed(() => {
          return mergeProps(
            statePropsRef?.value as StateProps,
            staticProps as StaticProps,
            ownProps,
            instance
          )
        })

        return () => {
          if (!component) {
            return
          }

          let vnode: VNode | undefined = undefined
          if (isVue2) {
            const realInstance = instance.proxy as any
            const { props: _, ...inheritProps } = realInstance.$vnode.data || {}
            const finalProps = {
              ...inheritProps,
              attrs: mergedProps.value,
              on: (context as any).listeners,
              scopedSlots: realInstance.$scopedSlots
            } as any

            if (typeof component === 'object') {
              // @ts-ignore: Vue2's `h` doesn't process vnode
              const emptyVNode = h()
              if (component instanceof emptyVNode.constructor) {
                vnode = component as VNode
                ;(vnode as any).data = finalProps
              }
            }
            if (!vnode) {
              vnode = h(component as any, finalProps)
            }
          } else {
            const children = instance.vnode.children
            vnode = h(component as any, mergedProps.value as any, children as any)
          }

          return forwardRef(vnode)
        }
      }
    }) as DefineComponent<OwnProps>

    return Connect
  }
}
