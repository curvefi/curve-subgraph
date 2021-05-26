import { Bytes } from '@graphprotocol/graph-ts'

import { Account } from '../../generated/schema'

export function getOrRegisterAccount(address: Bytes): Account {
  let account = Account.load(address.toHexString())

  if (account == null) {
    account = new Account(address.toHexString())
    account.address = address

    account.save()
  }

  return account!
}
