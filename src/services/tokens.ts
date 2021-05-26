import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { integer, ETH_TOKEN_ADDRESS } from '@protofire/subgraph-toolkit'

import { ERC20 } from '../../generated/MainRegistry/ERC20'

import { LpToken, Token } from '../../generated/schema'

import { getSystemState } from './system-state'

class TokenInfo {
  constructor(readonly name: string | null, readonly symbol: string | null, readonly decimals: i32) {}
}

export function getOrCreateToken(address: Address, event: ethereum.Event): Token {
  let token = Token.load(address.toHexString())

  if (token == null) {
    token = new Token(address.toHexString())
    token.address = address

    if (token.id == ETH_TOKEN_ADDRESS) {
      token.name = 'Ether'
      token.symbol = 'ETH'
      token.decimals = BigInt.fromI32(18)
    } else {
      let info = getTokenInfo(address)

      token.name = info.name
      token.symbol = info.symbol
      token.decimals = BigInt.fromI32(info.decimals)
    }

    token.save()

    // Count tokens
    let state = getSystemState(event)
    state.tokenCount = integer.increment(state.tokenCount)
    state.save()
  }

  return token!
}

export function getOrCreateLpToken(address: Address): LpToken {
  let token = LpToken.load(address.toHexString())

  if (token == null) {
    let info = getTokenInfo(address)

    token = new LpToken(address.toHexString())
    token.address = address
    token.name = info.name
    token.symbol = info.symbol
    token.decimals = BigInt.fromI32(info.decimals)

    token.save()
  }

  return token!
}

function getTokenInfo(address: Address): TokenInfo {
  let erc20 = ERC20.bind(address)

  let name = erc20.try_name()
  let symbol = erc20.try_symbol()
  let decimals = erc20.try_decimals()

  return new TokenInfo(
    name.reverted ? '' : name.value.toString(),
    symbol.reverted ? '' : symbol.value.toString(),
    decimals.reverted ? 18 : decimals.value,
  )
}
