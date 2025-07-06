import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7", // Sepolia testnet
  rpcTarget: process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.sepolia.org",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export const web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // Use MAINNET for production
    privateKeyProvider,
    modalConfig: {
      connectors: {
        auth: {
          label: "Social Login",
          loginMethods: {
            google: {
              name: "Google",
              logoDark: "https://web3auth.io/images/google-icon.svg",
            },
            facebook: {
              name: "Facebook",
              logoDark: "https://web3auth.io/images/facebook-icon.svg",
            },
            twitter: {
              name: "Twitter",
              logoDark: "https://web3auth.io/images/twitter-icon.svg",
            },
            discord: {
              name: "Discord",
              logoDark: "https://web3auth.io/images/discord-icon.svg",
            },
            email_passwordless: {
              name: "Email",
              logoDark: "https://web3auth.io/images/mail-icon.svg",
            },
          },
        },
        wallet_connect: {
          label: "Wallet Connect",
          loginMethods: {},
        },
        metamask: {
          label: "MetaMask",
          loginMethods: {},
        },
      },
    },
  },
};

export { chainConfig, privateKeyProvider, clientId }; 