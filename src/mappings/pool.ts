import { Address, dataSource, ethereum } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'

import { Registry } from '../../generated/templates/Pool/Registry'

import {
  AddLiquidity,
  NewAdmin,
  NewFee,
  NewParameters,
  RampA,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  StableSwap,
  StopRampA,
  TokenExchange,
  TokenExchangeUnderlying,
} from '../../generated/templates/Pool/StableSwap'

import {
  AddLiquidityEvent,
  AdminFeeChangelog,
  AmplificationCoeffChangelog,
  Coin,
  Exchange,
  FeeChangelog,
  Pool,
  RemoveLiquidityEvent,
  RemoveLiquidityOneEvent,
  Token,
  TransferOwnershipEvent,
  UnderlyingCoin,
} from '../../generated/schema'

import { getOrRegisterAccount } from '../services/accounts'
import { saveCoins } from '../services/pools/coins'
import { getDailyTradeVolume, getHourlyTradeVolume, getWeeklyTradeVolume } from '../services/pools/volume'

import { FEE_PRECISION } from '../constants'

export function handleAddLiquidity(event: AddLiquidity): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    let provider = getOrRegisterAccount(event.params.provider)

    // Save event log
    let log = new AddLiquidityEvent('al-' + getEventId(event))
    log.pool = pool.id
    log.provider = provider.id
    log.tokenAmounts = event.params.token_amounts
    log.fees = event.params.fees
    log.invariant = event.params.invariant
    log.tokenSupply = event.params.token_supply
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    let provider = getOrRegisterAccount(event.params.provider)

    // Save event log
    let log = new RemoveLiquidityEvent('rl-' + getEventId(event))
    log.pool = pool.id
    log.provider = provider.id
    log.tokenAmounts = event.params.token_amounts
    log.fees = event.params.fees
    log.tokenSupply = event.params.token_supply
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    let provider = getOrRegisterAccount(event.params.provider)

    // Save event log
    let log = new RemoveLiquidityEvent('rli-' + getEventId(event))
    log.pool = pool.id
    log.provider = provider.id
    log.tokenAmounts = event.params.token_amounts
    log.fees = event.params.fees
    log.invariant = event.params.invariant
    log.tokenSupply = event.params.token_supply
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    let provider = getOrRegisterAccount(event.params.provider)

    // Save event log
    let log = new RemoveLiquidityOneEvent('rlo-' + getEventId(event))
    log.pool = pool.id
    log.provider = provider.id
    log.tokenAmount = event.params.token_amount
    log.coinAmount = event.params.coin_amount
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

export function handleTokenExchange(event: TokenExchange): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    let coinSold = Coin.load(pool.id + '-' + event.params.sold_id.toString())!
    let tokenSold = Token.load(coinSold.token)!
    let amountSold = decimal.fromBigInt(event.params.tokens_sold, tokenSold.decimals.toI32())

    let coinBought = Coin.load(pool.id + '-' + event.params.bought_id.toString())!
    let tokenBought = Token.load(coinBought.token)!
    let amountBought = decimal.fromBigInt(event.params.tokens_bought, tokenBought.decimals.toI32())

    let buyer = getOrRegisterAccount(event.params.buyer)

    // Save event log
    let exchange = new Exchange('e-' + getEventId(event))
    exchange.pool = pool.id
    exchange.buyer = buyer.id
    exchange.receiver = buyer.id
    exchange.tokenSold = tokenSold.id
    exchange.tokenBought = tokenBought.id
    exchange.amountSold = amountSold
    exchange.amountBought = amountBought
    exchange.block = event.block.number
    exchange.timestamp = event.block.timestamp
    exchange.transaction = event.transaction.hash
    exchange.save()

    // Save trade volume
    let volume = exchange.amountSold.plus(exchange.amountBought).div(decimal.TWO)

    let hourlyVolume = getHourlyTradeVolume(pool!, event.block.timestamp)
    hourlyVolume.volume = hourlyVolume.volume.plus(volume)
    hourlyVolume.save()

    let dailyVolume = getDailyTradeVolume(pool!, event.block.timestamp)
    dailyVolume.volume = dailyVolume.volume.plus(volume)
    dailyVolume.save()

    let weeklyVolume = getWeeklyTradeVolume(pool!, event.block.timestamp)
    weeklyVolume.volume = weeklyVolume.volume.plus(volume)
    weeklyVolume.save()

    pool.exchangeCount = integer.increment(pool.exchangeCount)
    pool.save()
  }
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    let coinSold = UnderlyingCoin.load(pool.id + '-' + event.params.sold_id.toString())!
    let tokenSold = Token.load(coinSold.token)!
    let amountSold = decimal.fromBigInt(event.params.tokens_sold, tokenSold.decimals.toI32())

    let coinBought = UnderlyingCoin.load(pool.id + '-' + event.params.bought_id.toString())!
    let tokenBought = Token.load(coinBought.token)!
    let amountBought = decimal.fromBigInt(event.params.tokens_bought, tokenBought.decimals.toI32())

    let buyer = getOrRegisterAccount(event.params.buyer)

    // Save event log
    let exchange = new Exchange('e-' + getEventId(event))
    exchange.pool = pool.id
    exchange.buyer = buyer.id
    exchange.receiver = buyer.id
    exchange.tokenSold = tokenSold.id
    exchange.tokenBought = tokenBought.id
    exchange.amountSold = amountSold
    exchange.amountBought = amountBought
    exchange.block = event.block.number
    exchange.timestamp = event.block.timestamp
    exchange.transaction = event.transaction.hash
    exchange.save()

    // Save trade volume
    let volume = exchange.amountSold.plus(exchange.amountBought).div(decimal.TWO)

    let hourlyVolume = getHourlyTradeVolume(pool!, event.block.timestamp)
    hourlyVolume.volume = hourlyVolume.volume.plus(volume)
    hourlyVolume.save()

    let dailyVolume = getDailyTradeVolume(pool!, event.block.timestamp)
    dailyVolume.volume = dailyVolume.volume.plus(volume)
    dailyVolume.save()

    let weeklyVolume = getWeeklyTradeVolume(pool!, event.block.timestamp)
    weeklyVolume.volume = weeklyVolume.volume.plus(volume)
    weeklyVolume.save()

    pool.exchangeCount = integer.increment(pool.exchangeCount)
    pool.save()
  }
}

export function handleNewAdmin(event: NewAdmin): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    // Save new owner
    pool.owner = event.params.admin

    // Save event log
    let log = new TransferOwnershipEvent('to-' + getEventId(event))
    log.pool = pool.id
    log.newAdmin = event.params.admin
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

export function handleNewFee(event: NewFee): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    pool.adminFee = decimal.fromBigInt(event.params.admin_fee, FEE_PRECISION)
    pool.fee = decimal.fromBigInt(event.params.fee, FEE_PRECISION)

    // Save event logs
    let adminFeeLog = new AdminFeeChangelog('af-' + getEventId(event))
    adminFeeLog.pool = pool.id
    adminFeeLog.value = pool.adminFee!
    adminFeeLog.block = event.block.number
    adminFeeLog.timestamp = event.block.timestamp
    adminFeeLog.transaction = event.transaction.hash
    adminFeeLog.save()

    let feeLog = new FeeChangelog('f-' + getEventId(event))
    feeLog.pool = pool.id
    feeLog.value = pool.fee!
    feeLog.block = event.block.number
    feeLog.timestamp = event.block.timestamp
    feeLog.transaction = event.transaction.hash
    feeLog.save()

    pool.save()
  }
}

export function handleNewParameters(event: NewParameters): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    // Save pool parameters
    pool.A = event.params.A
    pool.fee = decimal.fromBigInt(event.params.fee, FEE_PRECISION)
    pool.adminFee = decimal.fromBigInt(event.params.admin_fee, FEE_PRECISION)

    // Save event logs
    let adminFeeLog = new AdminFeeChangelog('af-' + getEventId(event))
    adminFeeLog.pool = pool.id
    adminFeeLog.value = pool.adminFee!
    adminFeeLog.block = event.block.number
    adminFeeLog.timestamp = event.block.timestamp
    adminFeeLog.transaction = event.transaction.hash
    adminFeeLog.save()

    let aCoeffLog = new AmplificationCoeffChangelog('a-' + getEventId(event))
    aCoeffLog.pool = pool.id
    aCoeffLog.value = pool.A!
    aCoeffLog.block = event.block.number
    aCoeffLog.timestamp = event.block.timestamp
    aCoeffLog.transaction = event.transaction.hash
    aCoeffLog.save()

    let feeLog = new FeeChangelog('f-' + getEventId(event))
    feeLog.pool = pool.id
    feeLog.value = pool.fee!
    feeLog.block = event.block.number
    feeLog.timestamp = event.block.timestamp
    feeLog.transaction = event.transaction.hash
    feeLog.save()

    pool.save()
  }
}

export function handleRampA(event: RampA): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    // Save pool parameters
    pool.A = event.params.new_A

    // Save event log
    let log = new AmplificationCoeffChangelog('a-' + getEventId(event))
    log.pool = pool.id
    log.value = pool.A!
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

export function handleStopRampA(event: StopRampA): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool != null) {
    pool = getPoolSnapshot(pool!, event)

    // Save pool parameters
    pool.A = event.params.A

    // Save event log
    let log = new AmplificationCoeffChangelog('a-' + getEventId(event))
    log.pool = pool.id
    log.value = pool.A!
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.save()

    pool.save()
  }
}

function getEventId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
}

function getPoolSnapshot(pool: Pool, event: ethereum.Event): Pool {
  if (pool != null) {
    let poolAddress = pool.swapAddress as Address
    let poolContract = StableSwap.bind(poolAddress)

    // Workaround needed because batch_set_pool_asset_type() doesn't emit events
    // See https://etherscan.io/tx/0xf8e8d67ec16657ecc707614f733979d105e0b814aa698154c153ba9b44bf779b
    if (event.block.number.toI32() >= 12667823) {
      // Reference asset
      if (pool.assetType == null) {
        let context = dataSource.context()

        let registryAddress = context.getBytes('registry') as Address
        let registryContract = Registry.bind(registryAddress)

        let assetType = registryContract.try_get_pool_asset_type(poolAddress)

        if (!assetType.reverted) {
          let type = assetType.value.toI32()

          if (type == 0) {
            pool.assetType = 'USD'
          } else if (type == 1) {
            pool.assetType = 'ETH'
          } else if (type == 2) {
            pool.assetType = 'BTC'
          } else if (type == 3) {
            if (pool.name == 'link') {
              pool.assetType = 'LINK'
            } else if (pool.name.startsWith('eur')) {
              pool.assetType = 'EUR'
            } else {
              pool.assetType = 'OTHER'
            }
          } else if (type == 4) {
            pool.assetType = 'CRYPTO'
          }
        }
      }
    }

    // Update coin balances and underlying coin balances/rates
    saveCoins(pool!, event)

    // Save current virtual price
    let virtualPrice = poolContract.try_get_virtual_price()

    if (!virtualPrice.reverted) {
      pool.virtualPrice = decimal.fromBigInt(virtualPrice.value)
    }
  }

  return pool
}
