import {Session} from "next-auth";

export interface UserStatus {
    isGuest: boolean;
    isFullUser: boolean;
    hasWallet: boolean;
    isAuthenticated: boolean;
}

export function getUserStatus(session: Session | null): UserStatus {
    if (!session) {
        return {
            isGuest: false,
            isFullUser: false,
            hasWallet: false,
            isAuthenticated: false
        };
    }

    const hasWallet = !!session.walletAddress;
    const isAuthenticated = true;
    const isGuest = isAuthenticated && !hasWallet;
    const isFullUser = isAuthenticated && hasWallet;

    return {
        isGuest,
        isFullUser,
        hasWallet,
        isAuthenticated
    };
}

export function canBuyNFTs(session: Session | null): boolean {
    const status = getUserStatus(session);
    return status.isFullUser;
}

export function canCreateCollections(session: Session | null): boolean {
    const status = getUserStatus(session);
    return status.isFullUser;
}

export function getUserDisplayName(session: Session | null): string {
    if (!session) return 'Not Connected';

    const status = getUserStatus(session);

    if (status.isFullUser) {
        return `Wallet User`;
    }

    if (status.isGuest) {
        return session.user?.email || 'Guest User';
    }

    return 'Unknown User';
}

export function getUserDisplayType(session: Session | null): string {
    if (!session) return 'Not Connected';

    const status = getUserStatus(session);

    if (status.isFullUser) {
        return 'Full User';
    }

    if (status.isGuest) {
        return 'Guest';
    }

    return 'Unknown';
} 