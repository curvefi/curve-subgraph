import { BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts'
import { integer } from '@protofire/subgraph-toolkit'

import { AddressModified, AddressProvider, NewAddressIdentifier } from '../../generated/AddressProvider/AddressProvider'

import { Contract, ContractVersion } from '../../generated/schema'

import { getSystemState } from '../services/system-state'

export function handleAddressModified(event: AddressModified): void {
  registerContract(event.params.id, event)
}

export function handleNewAddressIdentifier(event: NewAddressIdentifier): void {
  registerContract(event.params.id, event)
}

function registerContract(id: BigInt, event: ethereum.Event): Contract {
  let info = AddressProvider.bind(dataSource.address()).get_id_info(id)

  let contract = Contract.load(id.toString())
  let state = getSystemState(event)

  if (contract == null) {
    contract = new Contract(id.toString())
    contract.description = info.value4
    contract.added = event.block.timestamp
    contract.addedAtBlock = event.block.number
    contract.addedAtTransaction = event.transaction.hash

    state.contractCount = integer.increment(state.contractCount)
  }

  contract.modified = event.block.timestamp
  contract.modifiedAtBlock = event.block.number
  contract.modifiedAtTransaction = event.transaction.hash
  contract.save()

  let version = new ContractVersion(id.toString() + '-' + info.value2.toString())
  version.contract = contract.id
  version.address = info.value0
  version.version = info.value2
  version.added = event.block.timestamp
  version.addedAtBlock = event.block.number
  version.addedAtTransaction = event.transaction.hash
  version.save()

  if (contract.description == 'Main Registry') {
    state.registryContract = info.value0
  }

  state.save()

  return contract!
}
