import type { Component, DefineComponent, getCurrentInstance, VNode } from 'vue'

export type ComponentType<Props = any> =
  | string
  | Component<Props>
  | DefineComponent<Props>
  | Symbol // Text | Comment | Teleport | Suspense
  | { __isSuspense: true } // Suspense
  | Function // FunctionalComponent
  | VNode

// for compatible with Vue2 in type naming
export type ComponentInternalInstance = NonNullable<ReturnType<typeof getCurrentInstance>>

export type MapStateProps<StateProps, OwnProps> = (
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => StateProps

export type MapStatePropsFactory<StateProps, OwnProps> = (
  initialOwnProps: OwnProps,
  instance: ComponentInternalInstance
) => MapStateProps<StateProps, OwnProps>

export type MapStaticProps<StaticProps, OwnProps> = (
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => StaticProps

export type MergeProps<StateProps, StaticProps, OwnProps, MergedProps> = (
  stateProps: StateProps,
  dispatchProps: StaticProps,
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) => MergedProps

export type ConnectedComponent<Props> = Component<Props>

export type Connector<InjectedProps, NeedsProps> = <C extends ComponentType<NeedsProps>>(
  component: C
) => ConnectedComponent<InjectedProps & Omit<NeedsProps, keyof InjectedProps>>
