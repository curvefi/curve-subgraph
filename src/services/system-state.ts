import { ethereum } from '@graphprotocol/graph-ts'
import { integer } from '@protofire/subgraph-toolkit'

import { SystemState } from '../../generated/schema'

export function getSystemState(event: ethereum.Event): SystemState {
  let state = SystemState.load('current')

  if (state == null) {
    state = new SystemState('current')
    state.contractCount = integer.ZERO
    state.gaugeCount = integer.ZERO
    state.gaugeTypeCount = integer.ZERO
    state.poolCount = integer.ZERO
    state.tokenCount = integer.ZERO

    state.totalPoolCount = integer.ZERO
  }

  state.updated = event.block.timestamp
  state.updatedAtBlock = event.block.number
  state.updatedAtTransaction = event.transaction.hash

  return state!
}
