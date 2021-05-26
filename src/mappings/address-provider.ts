import { BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts'
import { integer } from '@protofire/subgraph-toolkit'

import { AddressModified, AddressProvider, NewAddressIdentifier } from '../../generated/AddressProvider/AddressProvider'

import { Contract } from '../../generated/schema'

import { getSystemState } from '../services/system-state'

export function handleAddressModified(event: AddressModified): void {
  registerContract(event.params.id, event)
}

export function handleNewAddressIdentifier(event: NewAddressIdentifier): void {
  registerContract(event.params.id, event)
}

function registerContract(id: BigInt, event: ethereum.Event): Contract {
  let contract = Contract.load(id.toString())

  if (contract == null) {
    let info = AddressProvider.bind(dataSource.address()).get_id_info(id)

    contract = new Contract(id.toString())
    contract.address = info.value0
    contract.version = info.value2
    contract.description = info.value4

    contract.added = contract.modified = event.block.timestamp
    contract.addedAtBlock = contract.modifiedAtBlock = event.block.number
    contract.addedAtTransaction = contract.modifiedAtTransaction = event.transaction.hash

    contract.save()

    // Count contracts
    let state = getSystemState(event)
    state.contractCount = integer.increment(state.contractCount)
    state.save()
  }

  return contract!
}
