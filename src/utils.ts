import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts'

export function getOrDefault<T>(result: ethereum.CallResult<T>, defaultValue: T): T {
  return result.reverted ? defaultValue : result.value
}

export function getOrNull<T>(result: ethereum.CallResult<T>): T | null {
  return result.reverted ? null : result.value
}

export namespace address {
  export function fromBytes(a: Bytes): Address {
    return changetype<Address>(a)
  }
}
