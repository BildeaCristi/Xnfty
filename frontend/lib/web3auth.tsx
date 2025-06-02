import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, decodeToken } from "@web3auth/single-factor-auth";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "";
const rpcTarget = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL ?? "";

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7",
    rpcTarget: rpcTarget,
    displayName: "Ethereum Sepolia Testnet",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
});
export const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
});

export { decodeToken };