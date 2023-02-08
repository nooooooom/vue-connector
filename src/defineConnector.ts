import {
  computed,
  ComputedRef,
  DefineComponent,
  defineComponent,
  getCurrentInstance,
  h,
  version,
  VNode
} from 'vue'
import { forwardRef } from 'vue-forward-ref'
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
  mergeProps?: MergeProps<StateProps, StaticProps, OwnProps, MergedProps> | null | undefined
): unknown {
  return (component: ComponentType) => {
    const wrappedComponentName = (component as DefineComponent).name || 'Component'

    const displayName = `Connect${wrappedComponentName}`

    const Connect = defineComponent({
      name: displayName,

      setup(props, context) {
        const instance = getCurrentInstance()!

        // for compat Vue2
        const { attrs, listeners } = context as any as {
          attrs: Record<string, any>
          listeners: Record<string, Function | Function[]>
        }
        // Vue needs to resolve the value of props through "options.props",
        // here is to support the case of not passing in "options.props"
        const ownProps = computed(() => ({
          ...attrs,
          ...props
        })) as ComputedRef<OwnProps>

        let stateProps: ComputedRef<StateProps> | null = null
        const _mapStateProps =
          typeof mapStateProps === 'function' && mapStateProps(ownProps.value, instance)
        if (typeof _mapStateProps === 'function') {
          stateProps = computed(() =>
            (_mapStateProps as MapStateProps<StateProps, OwnProps>)(ownProps.value, instance)
          )
          // @ts-check: keep call logic of mapStateProps
          stateProps.value
        } else if (typeof mapStateProps === 'function') {
          const initialStateProps = _mapStateProps as StateProps
          let initialization = false
          stateProps = computed(() => {
            if (!initialization) {
              initialization = true
              return initialStateProps
            }
            return (mapStateProps as MapStateProps<StateProps, OwnProps>)(ownProps.value, instance)
          })
        }

        const staticProps = <StaticProps>(
          (typeof mapStaticProps === 'function' ? mapStaticProps(ownProps.value, instance) : {})
        )

        const _mergeProps = typeof mergeProps === 'function' ? mergeProps : defaultMergeProps
        const mergedProps = computed(() => {
          const { value: ownPropsValue } = ownProps
          const statePropsValue = (stateProps ? stateProps.value : null) as StateProps
          return _mergeProps(statePropsValue, staticProps, ownPropsValue, instance)
        })

        return () => {
          if (!component) {
            return
          }

          let vnode: VNode | undefined = undefined
          if (isVue2) {
            const children = (instance.proxy as any).$vnode
            const finalProps = { ...children.data, attrs: mergedProps.value, on: listeners }

            if (isVue2 && typeof component === 'object') {
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
            const children = instance.vnode.children as any
            vnode = h(component as any, mergedProps.value as any, children)
          }

          return forwardRef(vnode)
        }
      }
    }) as DefineComponent<OwnProps>

    return Connect
  }
}
