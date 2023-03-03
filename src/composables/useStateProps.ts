import { computed } from 'vue'
import { ComponentInternalInstance, MapStateProps, MapStatePropsFactory } from '../types'

const EMPTY_PROPS = {} as any

export function useStateProps<StateProps = {}, OwnProps = {}>(
  mapStatePropsFactory:
    | MapStateProps<StateProps, OwnProps>
    | MapStatePropsFactory<StateProps, OwnProps>
    | null
    | undefined,
  ownProps: OwnProps,
  instance: ComponentInternalInstance
) {
  if (typeof mapStatePropsFactory !== 'function') {
    return
  }

  // factory
  const mapStateProps = mapStatePropsFactory(ownProps, instance)
  if (typeof mapStateProps === 'function') {
    return computed(() =>
      (mapStateProps as MapStateProps<StateProps, OwnProps>)(ownProps, instance)
    )
  }

  // map
  let firstStateProps = mapStateProps
  return computed(() => {
    if (firstStateProps !== EMPTY_PROPS) {
      firstStateProps = EMPTY_PROPS
      return firstStateProps
    }
    return mapStatePropsFactory(ownProps, instance) as StateProps
  })
}
