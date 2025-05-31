import {Eip1193Provider} from 'ethers';

declare global {
    interface Window {
        ethereum: Eip1193Provider & {
            isMetaMask?: boolean;
            request: (args: {
                method: string;
                params?: unknown[] | object;
            }) => Promise<unknown>;
        };
    }
}

export {};