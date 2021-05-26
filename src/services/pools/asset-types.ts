import { TypedMap } from '@graphprotocol/graph-ts'

//
// TODO: this file needs to be replaced with data from pool registry when new version deployed
//

let assetTypes = new TypedMap<string, string>()
assetTypes.set('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7', 'USD')
assetTypes.set('0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27', 'USD')
assetTypes.set('0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56', 'USD')
assetTypes.set('0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956', 'USD')
assetTypes.set('0x4ca9b3063ec5866a4b82e437059d2c43d1be596f', 'BTC')
assetTypes.set('0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604', 'USD')
assetTypes.set('0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171', 'USD')
assetTypes.set('0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6', 'USD')
assetTypes.set('0x06364f10b501e868329afbc005b3492902d6c763', 'USD')
assetTypes.set('0x93054188d876f558f4a66b2ef1d97d16edf0895b', 'BTC')
assetTypes.set('0xc18cc39da8b11da8c3541c598ee022258f9744da', 'USD')
assetTypes.set('0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714', 'BTC')
assetTypes.set('0xa5407eae9ba41422680e2e00537571bcc53efbfd', 'USD')
assetTypes.set('0xc25099792e9349c7dd09759744ea681c7de2cb66', 'BTC')
assetTypes.set('0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb', 'USD')
assetTypes.set('0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1', 'USD')
assetTypes.set('0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c', 'USD')
assetTypes.set('0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51', 'USD')
assetTypes.set('0x8038c01a0390a8c547446a0b2c18fc9aefecc10c', 'USD')
assetTypes.set('0x071c661b4deefb59e2a3ddb20db036821eee8f4b', 'BTC')
assetTypes.set('0xd81da8d904b52208541bade1bd6595d8a251f8dd', 'BTC')
assetTypes.set('0x7f55dde206dbad629c080068923b36fe9d6bdbef', 'BTC')
assetTypes.set('0x890f4e345b1daed0367a877a1612f86a1f86985f', 'USD')
assetTypes.set('0x0ce6a5ff5217e38315f87032cf90686c96627caa', 'EUR')
assetTypes.set('0xc5424b857f758e906013f3555dad202e4bdb4567', 'ETH')
assetTypes.set('0xdebf20617708857ebe4f679508e7b7863a8a8eee', 'USD')
assetTypes.set('0x83f252f036761a1e3d10daca8e16d7b21e3744d7', 'USD')
assetTypes.set('0xdc24316b9ae028f1497c275eb9192a3ea0f67022', 'ETH')
assetTypes.set('0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2', 'ETH')
assetTypes.set('0xeb16ae0052ed37f479f7fe63849198df1765a733', 'USD')
assetTypes.set('0x8925d9d9b4569d737a48499def3f67baa5a144b9', 'USD')
assetTypes.set('0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf', 'USD')
assetTypes.set('0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0', 'LINK')
assetTypes.set('0x36965b1a6b97c1b33416e5d53fb5621ade1f1e80', 'USD')
assetTypes.set('0x42d7025938bec20b69cbae5a77421082407f053a', 'USD')

export function getAssetType(id: string): string {
  return assetTypes.isSet(id) ? assetTypes.get(id)! : 'NONE'
}
