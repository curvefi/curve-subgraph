import { decimal } from '@protofire/subgraph-toolkit'

import { Deposit, UpdateLiquidityLimit, Withdraw } from '../../../generated/templates/LiquidityGauge/LiquidityGauge'

import { GaugeDeposit, GaugeLiquidity, GaugeWithdraw } from '../../../generated/schema'

import { getOrRegisterAccount } from '../../services/accounts'

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  let account = getOrRegisterAccount(event.params.user)

  let gauge = new GaugeLiquidity(account.id + '-' + event.address.toHexString())
  gauge.user = account.id
  gauge.gauge = event.address.toHexString()
  gauge.originalBalance = event.params.original_balance
  gauge.originalSupply = event.params.original_supply
  gauge.workingBalance = event.params.working_balance
  gauge.workingSupply = event.params.working_supply
  gauge.timestamp = event.block.timestamp
  gauge.block = event.block.number
  gauge.transaction = event.transaction.hash
  gauge.save()
}

export function handleDeposit(event: Deposit): void {
  let provider = getOrRegisterAccount(event.params.provider)

  let deposit = new GaugeDeposit(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  deposit.gauge = event.address.toHexString()
  deposit.provider = provider.id
  deposit.value = decimal.fromBigInt(event.params.value)
  deposit.save()
}

export function handleWithdraw(event: Withdraw): void {
  let provider = getOrRegisterAccount(event.params.provider)

  let withdraw = new GaugeWithdraw(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  withdraw.gauge = event.address.toHexString()
  withdraw.provider = provider.id
  withdraw.value = decimal.fromBigInt(event.params.value)
  withdraw.save()
}
