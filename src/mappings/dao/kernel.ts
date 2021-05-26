import { DataSourceContext, Value } from '@graphprotocol/graph-ts'

import { NewAppProxy } from '../../../generated/DAO/Kernel'
import { Voting } from '../../../generated/templates'

import { Contract } from '../../../generated/schema'

const VOTING_APP_ID = '0x2436adbbb3230545df6846695013211d36736f647c91b302b9591e5e2d013485'
const VOTING_TYPE: string[] = ['Ownership', 'Parameter']

export function handleNewProxyApp(event: NewAppProxy): void {
  if (event.params.appId.toHexString() == VOTING_APP_ID) {
    let i = 0
    let id = VOTING_TYPE[i]

    while (Contract.load(id) != null) {
      i = i + 1
      id = VOTING_TYPE[i] || 'crv-voting-' + i.toString()
    }

    let contract = new Contract(id)
    contract.address = event.params.proxy
    contract.description = id.indexOf('crv-voting') == 0 ? id : id + ' Voting'
    contract.isUpgradeable = event.params.isUpgradeable
    contract.added = contract.modified = event.block.timestamp
    contract.addedAtBlock = contract.modifiedAtBlock = event.block.number
    contract.addedAtTransaction = contract.modifiedAtTransaction = event.transaction.hash
    contract.save()

    // Create dynamic data source
    let context = new DataSourceContext()
    context.set('type', Value.fromString(id))

    Voting.createWithContext(event.params.proxy, context)
  }
}
