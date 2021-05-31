import { BigInt } from '@graphprotocol/graph-ts'
import { decimal } from '@protofire/subgraph-toolkit'

import { DailyVolume, HourlyVolume, Pool, WeeklyVolume } from '../../../generated/schema'

export function getHourlyTradeVolume(pool: Pool, timestamp: BigInt): HourlyVolume {
  let interval = BigInt.fromI32(60 * 60)
  let hour = timestamp.div(interval).times(interval)
  let id = pool.id + '-hour-' + hour.toString()

  let volume = HourlyVolume.load(id)

  if (volume == null) {
    volume = new HourlyVolume(id)
    volume.pool = pool.id
    volume.timestamp = hour
    volume.volume = decimal.ZERO
  }

  return volume!
}

export function getDailyTradeVolume(pool: Pool, timestamp: BigInt): DailyVolume {
  let interval = BigInt.fromI32(60 * 60 * 24)
  let day = timestamp.div(interval).times(interval)
  let id = pool.id + '-day-' + day.toString()

  let volume = DailyVolume.load(id)

  if (volume == null) {
    volume = new DailyVolume(id)
    volume.pool = pool.id
    volume.timestamp = day
    volume.volume = decimal.ZERO
  }

  return volume!
}

export function getWeeklyTradeVolume(pool: Pool, timestamp: BigInt): WeeklyVolume {
  let interval = BigInt.fromI32(60 * 60 * 24 * 7)
  let week = timestamp.div(interval).times(interval)
  let id = pool.id + '-week-' + week.toString()

  let volume = WeeklyVolume.load(id)

  if (volume == null) {
    volume = new WeeklyVolume(id)
    volume.pool = pool.id
    volume.timestamp = week
    volume.volume = decimal.ZERO
  }

  return volume!
}
