import { BigInt } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'

import {
  GaugeController,
  AddType,
  NewGauge,
  NewGaugeWeight,
  NewTypeWeight,
  VoteForGauge,
} from '../../../generated/GaugeController/GaugeController'

import { LiquidityGauge as GaugeContract } from '../../../generated/GaugeController/LiquidityGauge'

import { LiquidityGauge } from '../../../generated/templates'

import {
  Gauge,
  GaugeTotalWeight,
  GaugeType,
  GaugeTypeWeight,
  GaugeWeight,
  GaugeWeightVote,
  Pool,
} from '../../../generated/schema'

import { getOrRegisterAccount } from '../../services/accounts'
import { getGaugeType, registerGaugeType } from '../../services/gauge-types'
import { getSystemState } from '../../services/system-state'
import { getOrCreateLpToken } from '../../services/tokens'

import { GAUGE_TOTAL_WEIGHT_PRECISION } from '../../constants'

let WEEK = integer.fromNumber(604800)

export function handleAddType(event: AddType): void {
  let gaugeController = GaugeController.bind(event.address)

  let nextWeek = nextPeriod(event.block.timestamp, WEEK)

  // Add gauge type
  let gaugeType = registerGaugeType(event.params.type_id.toString(), event.params.name)
  gaugeType.save()

  // Save gauge type weight
  let typeWeight = new GaugeTypeWeight(nextWeek.toString())
  typeWeight.type = gaugeType.id
  typeWeight.time = nextWeek
  typeWeight.weight = decimal.fromBigInt(gaugeController.points_type_weight(event.params.type_id, nextWeek))
  typeWeight.save()

  // Save total weight
  let totalWeight = new GaugeTotalWeight(nextWeek.toString())
  totalWeight.time = nextWeek
  totalWeight.weight = decimal.fromBigInt(gaugeController.points_total(nextWeek), GAUGE_TOTAL_WEIGHT_PRECISION)
  totalWeight.save()

  // Count gauges types
  let state = getSystemState(event)
  state.gaugeTypeCount = integer.increment(state.gaugeTypeCount)
  state.save()
}

export function handleNewGauge(event: NewGauge): void {
  let gaugeController = GaugeController.bind(event.address)

  let nextWeek = nextPeriod(event.block.timestamp, WEEK)

  // Get or register gauge type
  let gaugeType = getGaugeType(event.params.gauge_type.toString())

  if (gaugeType == null) {
    gaugeType = registerGaugeType(
      event.params.gauge_type.toString(),
      gaugeController.gauge_type_names(event.params.gauge_type),
    )
  }

  gaugeType.gaugeCount = gaugeType.gaugeCount.plus(integer.ONE)
  gaugeType.save()

  // Add gauge instance
  let gauge = new Gauge(event.params.addr.toHexString())
  gauge.address = event.params.addr
  gauge.type = gaugeType.id

  gauge.created = event.block.timestamp
  gauge.createdAtBlock = event.block.number
  gauge.createdAtTransaction = event.transaction.hash

  // Associate gauge to a pool via the LP token
  let lpToken = GaugeContract.bind(event.params.addr).try_lp_token()

  if (!lpToken.reverted) {
    let token = getOrCreateLpToken(lpToken.value)
    token.gauge = gauge.id
    token.save()

    if (token.pool != null) {
      let pool = Pool.load(token.pool)!
      gauge.pool = pool.id
    }
  }

  gauge.save()

  // Save gauge weight
  let gaugeWeight = new GaugeWeight(gauge.id + '-' + nextWeek.toString())
  gaugeWeight.gauge = gauge.id
  gaugeWeight.time = nextWeek
  gaugeWeight.weight = decimal.fromBigInt(event.params.weight)
  gaugeWeight.save()

  // Save total weight
  let totalWeight = new GaugeTotalWeight(nextWeek.toString())
  totalWeight.time = nextWeek
  totalWeight.weight = decimal.fromBigInt(gaugeController.points_total(nextWeek), GAUGE_TOTAL_WEIGHT_PRECISION)
  totalWeight.save()

  // Update gauge counter
  let state = getSystemState(event)
  state.gaugeCount = integer.increment(state.gaugeCount)
  state.save()

  // Start indexing gauge events
  LiquidityGauge.create(event.params.addr)
}

export function handleNewGaugeWeight(event: NewGaugeWeight): void {
  let gauge = Gauge.load(event.params.gauge_address.toHexString())

  if (gauge != null) {
    let gaugeController = GaugeController.bind(event.address)

    let nextWeek = nextPeriod(event.params.time, WEEK)

    // Save gauge weight
    let gaugeWeight = new GaugeWeight(gauge.id + '-' + nextWeek.toString())
    gaugeWeight.gauge = gauge.id
    gaugeWeight.time = nextWeek
    gaugeWeight.weight = decimal.fromBigInt(event.params.weight)
    gaugeWeight.save()

    // Save total weight
    let totalWeight = new GaugeTotalWeight(nextWeek.toString())
    totalWeight.time = nextWeek
    totalWeight.weight = decimal.fromBigInt(gaugeController.points_total(nextWeek), GAUGE_TOTAL_WEIGHT_PRECISION)
    totalWeight.save()
  }
}

export function handleNewTypeWeight(event: NewTypeWeight): void {
  let gaugeType = GaugeType.load(event.params.type_id.toString())

  if (gaugeType != null) {
    let typeWeight = new GaugeTypeWeight(gaugeType.id + '-' + event.params.time.toString())
    typeWeight.type = gaugeType.id
    typeWeight.time = event.params.time
    typeWeight.weight = decimal.fromBigInt(event.params.weight)
    typeWeight.save()

    let totalWeight = new GaugeTotalWeight(event.params.time.toString())
    totalWeight.time = event.params.time
    totalWeight.weight = decimal.fromBigInt(event.params.total_weight, GAUGE_TOTAL_WEIGHT_PRECISION)
    totalWeight.save()
  }
}

export function handleVoteForGauge(event: VoteForGauge): void {
  let gauge = Gauge.load(event.params.gauge_addr.toHexString())

  if (gauge != null) {
    let gaugeController = GaugeController.bind(event.address)

    let nextWeek = nextPeriod(event.params.time, WEEK)

    // Save gauge weight
    let gaugeWeight = new GaugeWeight(gauge.id + '-' + nextWeek.toString())
    gaugeWeight.gauge = gauge.id
    gaugeWeight.time = nextWeek
    gaugeWeight.weight = decimal.fromBigInt(gaugeController.points_weight(event.params.gauge_addr, nextWeek).value0)
    gaugeWeight.save()

    // Save total weight
    let totalWeight = new GaugeTotalWeight(nextWeek.toString())
    totalWeight.time = nextWeek
    totalWeight.weight = decimal.fromBigInt(gaugeController.points_total(nextWeek), GAUGE_TOTAL_WEIGHT_PRECISION)
    totalWeight.save()

    // Save user's gauge weight vote
    let user = getOrRegisterAccount(event.params.user)

    let vote = new GaugeWeightVote(gauge.id + '-' + user.id + '-' + event.params.time.toString())
    vote.gauge = gauge.id
    vote.user = user.id
    vote.time = event.params.time
    vote.weight = decimal.fromBigInt(event.params.weight)
    vote.save()
  }
}

function nextPeriod(timestamp: BigInt, period: BigInt): BigInt {
  let nextPeriod = timestamp.plus(period)
  return nextPeriod.div(period).times(period)
}
