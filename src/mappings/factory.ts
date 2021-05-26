import { log } from '@graphprotocol/graph-ts'

import { MetaPoolDeployed } from '../../generated/MetapoolFactory/Factory'

import { Pool } from '../../generated/schema'

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let pool = Pool.load(event.params.base_pool.toHexString())

  if (pool != null) {
    log.warning('Metapool deployed, base_pool: {}, coin: {}, deployer: {}, A: {}, fee: {}', [
      event.params.base_pool.toHexString(),
      event.params.coin.toHexString(),
      event.params.deployer.toHexString(),
      event.params.A.toString(),
      event.params.fee.toString(),
    ])
  }
}
