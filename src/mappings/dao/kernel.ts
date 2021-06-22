import { DataSourceContext, Value } from '@graphprotocol/graph-ts'
import { integer } from '@protofire/subgraph-toolkit'

import { NewAppProxy } from '../../../generated/DAO/Kernel'
import { Voting } from '../../../generated/templates'

import { Contract, ContractVersion } from '../../../generated/schema'

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

    // Register contract
    let contract = new Contract(id)
    contract.description = id.indexOf('crv-voting') == 0 ? id : id + ' Voting'
    contract.added = contract.modified = event.block.timestamp
    contract.addedAtBlock = contract.modifiedAtBlock = event.block.number
    contract.addedAtTransaction = contract.modifiedAtTransaction = event.transaction.hash
    contract.save()

    let contractVersion = new ContractVersion(contract.id + '-1')
    contractVersion.contract = contract.id
    contractVersion.address = event.params.proxy
    contractVersion.version = integer.ONE
    contractVersion.added = contract.modified = event.block.timestamp
    contractVersion.addedAtBlock = contract.modifiedAtBlock = event.block.number
    contractVersion.addedAtTransaction = contract.modifiedAtTransaction = event.transaction.hash
    contractVersion.save()

    // Create dynamic data source
    let context = new DataSourceContext()
    context.set('type', Value.fromString(id))

    Voting.createWithContext(event.params.proxy, context)
  }
}
