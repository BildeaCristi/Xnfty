import {ethers} from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";

const FALLBACK_SEPOLIA_RPC = "https://rpc.sepolia.org";

const getSepoliaRpcUrls = () => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    return [rpcUrl || FALLBACK_SEPOLIA_RPC];
};

export const ensureSepoliaChain = async (provider: ethers.BrowserProvider) => {
    const network = await provider.getNetwork();
    if (Number(network.chainId) === SEPOLIA_CHAIN_ID) {
        return;
    }

    if (!window.ethereum?.request) {
        throw new Error("Wallet provider does not support network switching.");
    }

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{chainId: SEPOLIA_HEX_CHAIN_ID}],
        });
    } catch (error: any) {
        if (error?.code !== 4902) {
            throw new Error("Please switch your wallet to the Sepolia network.");
        }

        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: SEPOLIA_HEX_CHAIN_ID,
                    chainName: "Sepolia",
                    rpcUrls: getSepoliaRpcUrls(),
                    nativeCurrency: {
                        name: "Sepolia ETH",
                        symbol: "SEP",
                        decimals: 18,
                    },
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
            ],
        });
    }
};
