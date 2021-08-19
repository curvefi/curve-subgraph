import { integer } from '@protofire/subgraph-toolkit'

import { GaugeType } from '../../generated/schema'

export function getGaugeType(id: string): GaugeType | null {
  return GaugeType.load(id)!
}

export function registerGaugeType(id: string, name: string): GaugeType {
  let gaugeType = new GaugeType(id)
  gaugeType.name = name
  gaugeType.gaugeCount = integer.ZERO

  return gaugeType
}
