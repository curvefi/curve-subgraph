import { Address, Bytes, dataSource /*, ipfs, json, log*/ } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'

import {
  CastVote,
  ChangeMinQuorum,
  ChangeSupportRequired,
  ExecuteVote,
  MinimumBalanceSet,
  MinimumTimeSet,
  StartVote,
  Voting,
} from '../../../generated/templates/Voting/Voting'

import { Proposal, ProposalVote, VotingApp } from '../../../generated/schema'

import { getOrRegisterAccount } from '../../services/accounts'

export function handleMinimumBalanceSet(event: MinimumBalanceSet): void {
  let app = getOrRegisterVotingApp(event.address)
  app.minimumBalance = decimal.fromBigInt(event.params.minBalance)
  app.save()
}

export function handleMinimumTimeSet(event: MinimumTimeSet): void {
  let app = getOrRegisterVotingApp(event.address)
  app.minimumTime = event.params.minTime
  app.save()
}

export function handleChangeMinQuorum(event: ChangeMinQuorum): void {
  let app = getOrRegisterVotingApp(event.address)
  app.minimumQuorum = decimal.fromBigInt(event.params.minAcceptQuorumPct)
  app.save()
}

export function handleChangeSupportRequired(event: ChangeSupportRequired): void {
  let app = getOrRegisterVotingApp(event.address)
  app.requiredSupport = decimal.fromBigInt(event.params.supportRequiredPct)
  app.save()
}

export function handleStartVote(event: StartVote): void {
  let app = getOrRegisterVotingApp(event.address)
  let creator = getOrRegisterAccount(event.params.creator)

  let votingContract = Voting.bind(event.address)
  let proposalData = votingContract.getVote(event.params.voteId)

  let proposal = new Proposal(event.address.toHexString() + '-' + event.params.voteId.toString())
  proposal.number = event.params.voteId
  proposal.app = app.id
  proposal.creator = creator.id
  proposal.expireDate = proposalData.value2.plus(app.voteTime)

  // Proposal parameters
  proposal.executionScript = proposalData.value9
  proposal.minimumQuorum = decimal.fromBigInt(proposalData.value5)
  proposal.requiredSupport = decimal.fromBigInt(proposalData.value4)
  proposal.snapshotBlock = proposalData.value3
  proposal.votingPower = decimal.fromBigInt(proposalData.value8)

  // Parse proposal metadata
  proposal.metadata = event.params.metadata

  // TODO: enable again when IPFS supported on Subgraph Studio
  // if (event.params.metadata.startsWith('ipfs:')) {
  //   let hash = event.params.metadata.slice(5) // because string.replace() is not supported on current AS version
  //   let content = ipfs.cat(hash)
  //
  //   if (content != null) {
  //     let jsonFile = json.try_fromBytes(content as Bytes)
  //
  //     if (jsonFile.isOk) {
  //       let value = jsonFile.value
  //
  //       if (value != null) {
  //         let metadata = value.toObject()
  //
  //         if (metadata.isSet('text')) {
  //           let text = metadata.get('text')
  //
  //           if (text != null) {
  //             proposal.text = text.toString()
  //           }
  //         }
  //       }
  //     } else {
  //       log.warning('Failed to parse JSON metadata, hash: {}, raw_data: {}', [hash, content.toHexString()])
  //     }
  //   } else {
  //     log.warning('Metadata failed to load from IPFS, hash: {}', [hash])
  //   }
  // }

  proposal.voteCount = integer.ZERO
  proposal.positiveVoteCount = proposalData.value6
  proposal.negativeVoteCount = proposalData.value7

  proposal.totalStaked = decimal.fromBigInt(event.params.creatorVotingPower)
  proposal.stakedSupport = proposal.totalStaked
  proposal.currentQuorum = proposal.totalStaked.div(proposal.votingPower)
  proposal.currentSupport = proposal.stakedSupport.div(proposal.votingPower)

  proposal.created = event.block.timestamp
  proposal.createdAtBlock = event.block.number
  proposal.createdAtTransaction = event.transaction.hash

  proposal.save()

  // Voting app
  app.proposalCount = integer.increment(app.proposalCount)
  app.save()
}

export function handleCastVote(event: CastVote): void {
  let proposal = Proposal.load(event.address.toHexString() + '-' + event.params.voteId.toString())

  if (proposal != null) {
    let voter = getOrRegisterAccount(event.params.voter)

    let vote = new ProposalVote(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
    vote.proposal = proposal.id
    vote.stake = decimal.fromBigInt(event.params.stake)
    vote.supports = event.params.supports
    vote.voter = voter.id
    vote.created = event.block.timestamp
    vote.createdAtBlock = event.block.number
    vote.createdAtTransaction = event.transaction.hash
    vote.save()

    // Update proposal counters
    proposal.voteCount = integer.increment(proposal.voteCount)
    proposal.totalStaked = proposal.totalStaked.plus(vote.stake)
    proposal.currentQuorum = proposal.totalStaked.div(proposal.votingPower)

    if (vote.supports) {
      proposal.positiveVoteCount = integer.increment(proposal.positiveVoteCount)
      proposal.stakedSupport = proposal.stakedSupport.plus(vote.stake)
      proposal.currentSupport = proposal.stakedSupport.div(proposal.votingPower)
    } else {
      proposal.negativeVoteCount = integer.increment(proposal.negativeVoteCount)
    }

    proposal.updated = event.block.timestamp
    proposal.updatedAtBlock = event.block.number
    proposal.updatedAtTransaction = event.transaction.hash

    proposal.save()

    // Update voting app counters
    let app = getOrRegisterVotingApp(event.address)
    app.voteCount = integer.increment(app.voteCount)
    app.save()
  }
}

export function handleExecuteVote(event: ExecuteVote): void {
  let proposal = Proposal.load(event.address.toHexString() + '-' + event.params.voteId.toString())

  if (proposal != null) {
    proposal.executed = event.block.timestamp
    proposal.executedAtBlock = event.block.number
    proposal.executedAtTransaction = event.transaction.hash
    proposal.save()
  }
}

function getOrRegisterVotingApp(address: Bytes): VotingApp {
  let app = VotingApp.load(address.toHexString())

  if (app == null) {
    let votingContract = Voting.bind(address as Address)

    let codename = dataSource
      .context()
      .get('type')!
      .toString()

    app = new VotingApp(address.toHexString())
    app.address = address
    app.codename = codename
    app.minimumBalance = decimal.fromBigInt(votingContract.minBalance())
    app.minimumQuorum = decimal.fromBigInt(votingContract.minAcceptQuorumPct())
    app.minimumTime = votingContract.minTime()
    app.requiredSupport = decimal.fromBigInt(votingContract.supportRequiredPct())
    app.voteTime = votingContract.voteTime()
    app.token = votingContract.token()
    app.proposalCount = integer.ZERO
    app.voteCount = integer.ZERO
    app.save()
  }

  return app!
}
