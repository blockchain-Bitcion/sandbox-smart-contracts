import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTestnet} from '../../utils/network';

const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const {deployments, getNamedAccounts} = hre;
  const {
    deployer,
    upgradeAdmin,
    assetAdmin,
    assetBouncerAdmin,
  } = await getNamedAccounts();
  const {deploy} = deployments;

  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');
  const AssetERC721 = await deployments.get('AssetERC721');

  const ERC1155ERC721HelperLib = await deploy('ERC1155ERC721Helper', {
    from: deployer,
  });

  const assetHelperLib = await deploy('AssetHelper', {
    from: deployer,
  });

  await deploy('Asset', {
    from: deployer,
    contract: 'AssetERC1155',
    libraries: {
      ERC1155ERC721Helper: ERC1155ERC721HelperLib.address,
      AssetHelper: assetHelperLib.address,
    },
    proxy: {
      owner: upgradeAdmin,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [
          TRUSTED_FORWARDER.address,
          assetAdmin,
          assetBouncerAdmin,
          AssetERC721.address,
          0,
        ],
      },
      upgradeIndex: 1,
    },
    log: true,
  });
};

export default func;
func.tags = ['Asset', 'Asset_deploy', 'AssetERC1155', 'AssetERC1155_deploy'];
func.dependencies = ['AssetERC721', 'TRUSTED_FORWARDER', 'ERC1155_PREDICATE'];
func.skip = skipUnlessTestnet;
