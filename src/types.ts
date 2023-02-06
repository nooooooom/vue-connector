import type { Component, defineComponent, DefineComponent, getCurrentInstance, VNode } from 'vue'

export type ComponentType =
  | string
  | Component
  | DefineComponent
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
  ownProps: OwnProps,
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
