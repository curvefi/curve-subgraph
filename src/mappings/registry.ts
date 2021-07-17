import { Address, dataSource, DataSourceContext, ethereum } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'

import { PoolAdded, PoolRemoved, Registry } from '../../generated/MainRegistry/Registry'
import { StableSwap } from '../../generated/MainRegistry/StableSwap'
import { Pool as PoolDataSource } from '../../generated/templates'

import { Gauge, Pool } from '../../generated/schema'

import { getSystemState } from '../services/system-state'
import { getOrCreateLpToken } from '../services/tokens'

import { FEE_PRECISION } from '../constants'
import { saveCoins } from '../services/pools/coins'

export function handlePoolAdded(event: PoolAdded): void {
  getOrCreatePool(event.params.pool, event)
}

export function handlePoolRemoved(event: PoolRemoved): void {
  removePool(event.params.pool, event)
}

function getOrCreatePool(address: Address, event: ethereum.Event): Pool {
  let pool = Pool.load(address.toHexString())

  if (pool == null) {
    let registryContract = Registry.bind(dataSource.address())
    let swapContract = StableSwap.bind(address)

    let coinCount = registryContract.get_n_coins(address)

    pool = new Pool(address.toHexString())
    pool.swapAddress = swapContract._address
    pool.registryAddress = registryContract._address

    // Counters
    pool.coinCount = coinCount[0]
    pool.exchangeCount = integer.ZERO
    pool.gaugeCount = integer.ZERO
    pool.underlyingCount = coinCount[1]

    // Identify metapools
    let metapool = registryContract.try_is_meta(address)

    pool.isMeta = !metapool.reverted && metapool.value

    // Pool name
    pool.name = registryContract.get_pool_name(address)

    // Coin balances and underlying coin balances/rates
    saveCoins(pool!, event)

    // TODO: Calculate pool locked value
    pool.locked = decimal.ZERO

    // LP token
    let lpToken = registryContract.try_get_lp_token(address)

    if (!lpToken.reverted) {
      let token = getOrCreateLpToken(lpToken.value)
      token.pool = pool.id
      token.save()

      pool.lpToken = token.id

      // Associate gauge to pool
      if (token.gauge != null) {
        let gauge = Gauge.load(token.gauge)!
        gauge.pool = pool.id
        gauge.save()

        pool.gaugeCount = integer.increment(pool.gaugeCount)
      }
    }

    // Pool parameters
    let params = registryContract.try_get_parameters(address)

    if (!params.reverted) {
      pool.A = params.value.value0
      pool.fee = decimal.fromBigInt(params.value.value2, FEE_PRECISION)
      pool.adminFee = decimal.fromBigInt(params.value.value3, FEE_PRECISION)
    }

    // Owner
    let owner = swapContract.try_owner()

    if (!owner.reverted) {
      pool.owner = owner.value
    }

    // Virtual price
    let virtualPrice = swapContract.try_get_virtual_price()

    pool.virtualPrice = virtualPrice.reverted ? decimal.ZERO : decimal.fromBigInt(virtualPrice.value)

    // Save new pool entity
    pool.addedAt = event.block.timestamp
    pool.addedAtBlock = event.block.number
    pool.addedAtTransaction = event.transaction.hash

    pool.save()

    // Count pools
    let state = getSystemState(event)
    state.poolCount = integer.increment(state.poolCount)
    state.totalPoolCount = integer.increment(state.totalPoolCount)
    state.save()

    // Start indexing events from new pool
    let context = new DataSourceContext()
    context.setBytes('registry', registryContract._address)

    PoolDataSource.createWithContext(address, context)
  }

  return pool!
}

function removePool(address: Address, event: ethereum.Event): Pool {
  let pool = Pool.load(address.toHexString())

  if (pool != null) {
    pool.removedAt = event.block.timestamp
    pool.removedAtBlock = event.block.number
    pool.removedAtTransaction = event.transaction.hash
    pool.save()

    // Count pools
    let state = getSystemState(event)
    state.poolCount = integer.decrement(state.poolCount)
    state.save()

    // TODO: Stop indexing pool events (not yet supported)
  }

  return pool!
}
