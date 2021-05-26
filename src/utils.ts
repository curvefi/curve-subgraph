import { ethereum } from '@graphprotocol/graph-ts'

export function getOrNull<T>(result: ethereum.CallResult<T>): T | null {
  return result.reverted ? null : result.value
}
