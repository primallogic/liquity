import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Provider } from "@ethersproject/abstract-provider";
// import { Signer } from "@ethersproject/abstract-signer";
import { getNetwork } from "@ethersproject/networks";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";

import { isBatchedProvider, isWebSocketAugmentedProvider } from "@liquity/providers";
import {
  BlockPolledLiquityStore,
  EthersLiquity,
  EthersLiquityWithStore,
  _connectByChainId
} from "@liquity/lib-ethers";

import { LiquityFrontendConfig, getConfig } from "../config";
import { BigNumber, Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";

type LiquityContextValue = {
  config: LiquityFrontendConfig;
  account: string;
  provider: Provider;
  liquity: EthersLiquityWithStore<BlockPolledLiquityStore>;
  getApproval: (amount: string) => Promise<boolean>
};

const LiquityContext = createContext<LiquityContextValue | undefined>(undefined);

type LiquityProviderProps = {
  loader?: React.ReactNode;
  unsupportedNetworkFallback?: (chainId: number) => React.ReactNode;
  unsupportedMainnetFallback?: React.ReactNode;
};

const wsParams = (network: string, infuraApiKey: string): [string, string] => [
  `wss://bsc-mainnet.blastapi.io/${infuraApiKey}`,
  network
];

const webSocketSupportedNetworks = ["homestead", "kovan", "rinkeby", "ropsten", "goerli", "bnb"];

export const LiquityProvider: React.FC<LiquityProviderProps> = ({
  children,
  loader,
  unsupportedNetworkFallback,
  unsupportedMainnetFallback
}) => {
  const { library: provider, account, chainId } = useWeb3React<Web3Provider>();
  const [config, setConfig] = useState<LiquityFrontendConfig>();

  const connection = useMemo(() => {
    if (config && provider && account && chainId) {
      try {
        return _connectByChainId(provider, provider.getSigner(account), chainId, {
          userAddress: account,
          frontendTag: config.frontendTag,
          useStore: "blockPolled"
        });
      } catch {}
    }
  }, [config, provider, account, chainId]);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (config && connection) {
      const { provider, chainId } = connection;

      if (isBatchedProvider(provider) && provider.chainId !== chainId) {
        provider.chainId = chainId;
      }

      if (isWebSocketAugmentedProvider(provider)) {
        const network = getNetwork(chainId);

        if (
          network.name &&
          webSocketSupportedNetworks.includes(network.name) &&
          config.infuraApiKey
        ) {
          provider.openWebSocket(...wsParams(network.name, config.infuraApiKey));
        } else if (connection._isDev) {
          provider.openWebSocket(`ws://${window.location.hostname}:8546`, chainId);
        }

        return () => {
          provider.closeWebSocket();
        };
      }
    }
  }, [config, connection]);

  if (!config || !provider || !account || !chainId) {
    return <>{loader}</>;
  }

  if (config.testnetOnly && chainId === 1) {
    return <>{unsupportedMainnetFallback}</>;
  }

  if (!connection) {
    return unsupportedNetworkFallback ? <>{unsupportedNetworkFallback(chainId)}</> : null;
  }

  const getApproval = async (amount: string) => {
    const stakingAddress = connection.addresses["lqtyStaking"]
    const lqtyAddress = connection.addresses["lqtyToken"]
    console.log(stakingAddress, lqtyAddress)
    const contract = new Contract(
      lqtyAddress, 
      [
        "function approve(address _spender, uint256 _value) public returns (bool success)",
        "function allowance(address _owner, address _spender) public view returns (uint256 remaining)"
      ],
      provider.getSigner(account)
    )
    const currentAllowance = BigNumber.from((await contract.allowance(account, stakingAddress)).toString())
    console.log(formatEther(currentAllowance), formatEther(amount))
    if (currentAllowance.lt(amount)) {
      try {
        const tx = await (await contract.approve(stakingAddress, amount)).wait()
      } catch (e) {
        console.error(e)
        return false
      }
      return true
    }
    return true
  }

  const liquity = EthersLiquity._from(connection);
  liquity.store.logging = true;

  return (
    <LiquityContext.Provider value={{ config, account, provider, liquity, getApproval }}>
      {children}
    </LiquityContext.Provider>
  );
};

export const useLiquity = () => {
  const liquityContext = useContext(LiquityContext);

  if (!liquityContext) {
    throw new Error("You must provide a LiquityContext via LiquityProvider");
  }

  return liquityContext;
};
