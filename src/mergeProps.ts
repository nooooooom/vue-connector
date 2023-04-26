/**
 * @internal
 */
export function defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
  stateProps: StateProps,
  staticProps: StaticProps,
  ownProps: OwnProps
): MergedProps {
  return { ...ownProps, ...stateProps, ...staticProps } as MergedProps
}

/**
 * This function allows handling the merged props without affecting the default merge logic.
 *
 * Why you need it:
 * To be able to receive undeclared `props`,
 * the Connector will also merge the `attrs` of the component into `props`,
 * so there may be some unexpected `attrs` on your component,
 * we may need to manually filter the final `props` to ensure unexpected `attrs` do not appear.
 */
export function wrapperDefaultMergeProps<MergedProps, ProcessedProps = MergedProps>(
  processor: (mergedProps: MergedProps) => ProcessedProps
) {
  return <StateProps, StaticProps, OwnProps>(
    stateProps: StateProps,
    staticProps: StaticProps,
    ownProps: OwnProps
  ) =>
    processor(
      defaultMergeProps<StateProps, StaticProps, OwnProps, MergedProps>(
        stateProps,
        staticProps,
        ownProps
      )
    )
}
