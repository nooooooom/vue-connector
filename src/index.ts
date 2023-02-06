import { computed, DefineComponent, defineComponent, getCurrentInstance, h, version } from 'vue'
import { forwardRef } from 'vue-forward-ref'
import {
  ComponentType,
  MapStateProps,
  MapStatePropsFactory,
  MapStaticProps,
  MergeProps
} from './types'

const isVue2 = +version.split('.')[0] !== 3

function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  dispatchProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...dispatchProps } as MergedProps
}

export interface Connector {}

// overload 1: mapStateProps only
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: StateProps
): Connector

// overload 2: mapStaticProps only
export function defineConnector<
  StateProps = null | undefined,
  StaticProps = {},
  OwnProps = {},
  MergedProps = {}
>(mapStateProps: StateProps, mapStaticProps: StaticProps): Connector

// overload 3: mapStateProps and mapStaticProps
export function defineConnector<StateProps = {}, StaticProps = {}, OwnProps = {}, MergedProps = {}>(
  mapStateProps: StateProps,
  mapStaticProps: StaticProps
): Connector

// overload 4: mergeProps only
export function defineConnector<
  StateProps = null | undefined,
  StaticProps = null | undefined,
  OwnProps = {},
  MergedProps = {}
>(
  mapStateProps: StateProps,
  mapStaticProps: StaticProps,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector

// overload 5: mapState and mergeProps
export function defineConnector<
  StateProps = {},
  StaticProps = null | undefined,
  OwnProps = {},
  MergedProps = {}
>(
  mapStateProps: StateProps,
  mapStaticProps: StaticProps,
  mergeProps: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
): Connector

// implementation
export function defineConnector<
  StateProps extends Record<string, any> | undefined | null = {},
  StaticProps extends Record<string, any> | undefined | null = {},
  OwnProps extends Record<string, any> = {},
  MergedProps = {}
>(
  mapStateProps?: MapStateProps<StateProps, OwnProps> | MapStatePropsFactory<StateProps, OwnProps>,
  mapStaticProps?: MapStaticProps<StaticProps, OwnProps>,
  mergeProps?: MergeProps<StateProps, StaticProps, OwnProps, MergedProps>
) {
  return ((component: ComponentType) => {
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
        const ownProps = computed<OwnProps>(() => ({
          ...attrs,
          ...convertLegacyListeners(listeners),
          ...props
        }))

        let _mapStateProps: MapStateProps<StateProps, OwnProps> | null = null
        const stateProps =
          typeof mapStateProps === 'function' &&
          computed(() => {
            const { value: ownPropsValue } = ownProps
            const result = mapStateProps(ownPropsValue, instance)
            if (typeof result === 'function') {
              _mapStateProps = result as MapStateProps<StateProps, OwnProps>
            }

            return _mapStateProps ? _mapStateProps(ownPropsValue, instance) : (result as StateProps)
          })

        const staticProps = <StaticProps>(
          (typeof mapStaticProps === 'function' ? mapStaticProps(ownProps.value, instance) : null)
        )

        const _mergeProps = typeof mergeProps === 'function' ? mergeProps : defaultMergeProps
        const mergedProps = computed(() => {
          const { value: ownPropsValue } = ownProps
          const statePropsValue = (stateProps ? stateProps.value : null) as StateProps
          return _mergeProps(statePropsValue, staticProps as StaticProps, ownPropsValue, instance)
        })

        if (isVue2) {
          return () => {
            const children = instance.vnode.children as any
            const vnode = forwardRef(h(component as any, { attrs: mergedProps })) as any

            vnode.slots = children.slots
            vnode.scopedSlots = children.scopedSlots

            return vnode
          }
        }

        // Vue3
        return () => {
          const children = instance.vnode.children as any
          const vnode = forwardRef(h(component as any, mergedProps, children))

          return vnode
        }
      }
    }) as DefineComponent<OwnProps>

    return Connect
  }) as Connector
}

const onRE = /^on[^a-z]/
function convertLegacyListeners(listeners: Record<string, Function | Function[]>) {
  const props: Record<string, Function | Function[]> = {}
  for (const key in listeners) {
    if (!onRE.test(key)) {
      props[`on${key[0].toUpperCase()}`] = listeners[key]
    }
  }
  return props
}
