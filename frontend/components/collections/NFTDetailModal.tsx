"use client";

import {useEffect, useState} from 'react';
import {
    ArrowUpRight,
    Check,
    Coins,
    Copy,
    Crown,
    ExternalLink,
    ShoppingCart,
    User as UserIcon,
    X,
    Zap
} from 'lucide-react';
import {
    buyNFTSharesEnhanced,
    formatAddress,
    getAvailableSharesForBuyer,
    getAvailableSharesFromOwner,
    getExtendedNFTInfo,
    getNFTShareHolders,
    getUserNFTSharePercentage,
    isAllSharesWithOwner
} from '@/services/BlockchainService';
import type { Collection, NFT, ShareHolder, FractionalNFTInfo } from '@/types';
import { useNotifications } from '@/providers/NotificationContext';
import { canBuyNFTs } from '@/utils/auth';
import GuestWarning from '@/components/shared/GuestWarning';
import { ethers } from 'ethers';

interface NFTDetailModalProps {
    nft: NFT;
    collection: Collection;
    userAddress?: string;
    session?: any;
    onClose: () => void;
}

export default function NFTDetailModal({nft, collection, userAddress, session, onClose}: NFTDetailModalProps) {
    const { showSuccess, showError, showWarning, showInfo, confirm } = useNotifications();
    const canBuy = canBuyNFTs(session);
    const [fractionalInfo, setFractionalInfo] = useState<FractionalNFTInfo & { creator?: string } | null>(null);
    const [shareHolders, setShareHolders] = useState<ShareHolder[]>([]);
    const [userSharePercentage, setUserSharePercentage] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [showShareholders, setShowShareholders] = useState(false);
    const [buyAmount, setBuyAmount] = useState<number>(1);
    const [isBuying, setIsBuying] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
    const [availableShares, setAvailableShares] = useState<number>(0);
    const [availableFromOwner, setAvailableFromOwner] = useState<number>(0);
    const [allSharesWithOwner, setAllSharesWithOwner] = useState<boolean>(false);
    const [userBalance, setUserBalance] = useState<string>('0');
    const [maxBuyAmount, setMaxBuyAmount] = useState<number>(1);

    useEffect(() => {
        const initializeModal = async () => {
            setIsInitialLoading(true);
            if (nft.isfractionalized && nft.fractionalContract) {
                await loadFractionalData();
            }
            setIsInitialLoading(false);
        };
        
        initializeModal();
    }, [nft]);

    useEffect(() => {
        if (userAddress && fractionalInfo) {
            loadUserBalance();
        }
    }, [userAddress, fractionalInfo]);

    const loadUserBalance = async () => {
        if (!userAddress) return;

        try {
            const {getSigner} = await import('@/services/BlockchainService');
            const signer = await getSigner();

            if (!signer.provider) {
                return;
            }

            const balance = await signer.provider.getBalance(userAddress);
            const balanceInEth = (Number(balance) / 1e18).toFixed(4);
            setUserBalance(balanceInEth);
        } catch (error) {
            // Handle error silently
        }
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(type);
            setTimeout(() => setCopiedAddress(null), 2000);
        } catch (err) {
            // Handle error silently
        }
    };

    const loadFractionalData = async () => {
        if (!nft.fractionalContract) return;

        setIsLoading(true);
        try {
            const [extendedInfo, holders, allWithOwner, ownerShares] = await Promise.all([
                getExtendedNFTInfo(nft.fractionalContract),
                getNFTShareHolders(nft.fractionalContract),
                isAllSharesWithOwner(nft.fractionalContract),
                getAvailableSharesFromOwner(nft.fractionalContract)
            ]);

            setFractionalInfo(extendedInfo);
            setShareHolders(holders);
            setAllSharesWithOwner(allWithOwner);
            setAvailableFromOwner(ownerShares);

            let availableForBuyer = 0;
            if (userAddress) {
                availableForBuyer = await getAvailableSharesForBuyer(nft.fractionalContract, userAddress);

                const userPercentage = await getUserNFTSharePercentage(nft.fractionalContract, userAddress);
                setUserSharePercentage(userPercentage);
            } else {
                const totalShares = holders.reduce((sum, holder) => sum + holder.shares, 0);
                availableForBuyer = totalShares;
            }

            setAvailableShares(availableForBuyer);

            if (userAddress && availableForBuyer > 0) {
                const userBalanceEth = parseFloat(userBalance);
                const sharePriceEth = parseFloat(extendedInfo.sharePrice);
                const maxAffordable = Math.floor(userBalanceEth / sharePriceEth);
                const maxPossible = Math.min(availableForBuyer, maxAffordable, extendedInfo.totalShares); // Allow buying all shares
                setMaxBuyAmount(Math.max(1, maxPossible));
            }
        } catch (error) {
            // Handle error silently
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyShares = async () => {
        if (!nft.fractionalContract || !fractionalInfo || !fractionalInfo.sharePrice) {
            showError('Cannot buy shares', 'This NFT is not fractionalized or share price is not set');
            return;
        }

        if (buyAmount <= 0 || !Number.isInteger(buyAmount)) {
            showWarning('Invalid share amount', 'Please enter a valid number of shares to buy.');
            return;
        }

        if (buyAmount > availableShares) {
            showWarning('Not enough shares available', `Only ${availableShares} shares are available for purchase.`);
            return;
        }

        // Calculate total cost and check user balance
        const totalCostEth = parseFloat(fractionalInfo.sharePrice) * buyAmount;
        const userBalanceEth = parseFloat(userBalance);

        if (totalCostEth > userBalanceEth) {
            showError('Insufficient balance', `You need ${totalCostEth.toFixed(4)} ETH but only have ${userBalanceEth} ETH.`);
            return;
        }

        // Ask for confirmation before buying
        const shouldBuy = await confirm({
            title: 'Confirm Share Purchase',
            message: `You are about to buy ${buyAmount} share${buyAmount > 1 ? 's' : ''} for ${totalCostEth.toFixed(4)} ETH. This transaction cannot be undone.`,
            confirmText: 'Buy Shares',
            cancelText: 'Cancel',
            type: 'info'
        });

        if (!shouldBuy) return;

        setIsBuying(true);
        try {
            const txHash = await buyNFTSharesEnhanced(nft.fractionalContract, buyAmount, fractionalInfo.sharePrice, userAddress);
            
            let successMessage = `Successfully purchased ${buyAmount} share${buyAmount > 1 ? 's' : ''}!`;
            
            const remainingShares = availableShares - buyAmount;
            if (remainingShares === 0) {
                successMessage += ' You now own the entire NFT!';
            }

            showSuccess('Shares purchased successfully', successMessage);

            await loadFractionalData();
            setBuyAmount(1);
        } catch (error) {
            
            let errorMessage = 'Failed to buy shares. Please try again.';
            if (error instanceof Error) {
                if (error.message.includes('user rejected')) {
                    errorMessage = 'Transaction was cancelled by user.';
                } else if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds for transaction including gas fees.';
                } else if (error.message.includes('execution reverted')) {
                    errorMessage = 'Transaction failed. The shares may no longer be available.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            showError('Purchase failed', errorMessage);
        } finally {
            setIsBuying(false);
        }
    };

    const setBuyAmountQuick = (amount: number) => {
        setBuyAmount(amount);
    };

    const totalCost = fractionalInfo ? parseFloat(fractionalInfo.sharePrice) * buyAmount : 0;
    const canAfford = parseFloat(userBalance) >= totalCost;
    const hasAvailableShares = availableShares > 0;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                    <div className="min-w-0 flex-1 pr-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{nft.name}</h2>
                        <p className="text-gray-400 mt-1 text-sm sm:text-base truncate">From {collection.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[calc(90vh-120px)] relative">
                    {/* Loading Overlay */}
                    {isInitialLoading && (
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                                <div className="text-white text-lg font-medium mb-2">Loading NFT Details</div>
                                <div className="text-gray-400 text-sm">Fetching fractional ownership data...</div>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                        {/* Left Column - Image */}
                        <div className="order-1 xl:order-1">
                            <img
                                src={nft.imageURI}
                                alt={nft.name}
                                className="w-full rounded-lg object-cover max-h-96 xl:max-h-none"
                            />
                        </div>

                        {/* Right Column - Details */}
                        <div className="space-y-4 sm:space-y-6 order-2 xl:order-2">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Details</h3>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm sm:text-base">Token ID</span>
                                        <span
                                            className="text-white font-medium text-sm sm:text-base">#{nft.tokenId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm sm:text-base">Created</span>
                                        <span className="text-white font-medium text-sm sm:text-base">
                      {new Date(nft.creationTime * 1000).toLocaleDateString()}
                    </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm sm:text-base">Status</span>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                            nft.isfractionalized
                                                ? 'bg-purple-900/50 text-purple-300'
                                                : 'bg-green-900/50 text-green-300'
                                        }`}>
                      {nft.isfractionalized ? 'Fractionalized' : 'Standard NFT'}
                    </span>
                                    </div>

                                    {/* Creator vs Owner Information */}
                                    {fractionalInfo && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm sm:text-base">Creator</span>
                                                <span
                                                    className="text-blue-300 font-medium text-sm sm:text-base flex items-center">
                          <UserIcon className="w-3 h-3 mr-1"/>
                                                    {formatAddress(fractionalInfo.creator || '')}
                        </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span
                                                    className="text-gray-400 text-sm sm:text-base">Current Owner</span>
                                                <span
                                                    className="text-green-300 font-medium text-sm sm:text-base flex items-center">
                          <Crown className="w-3 h-3 mr-1"/>
                                                    {formatAddress(fractionalInfo.currentOwner)}
                        </span>
                                            </div>
                                            {fractionalInfo.creator !== fractionalInfo.currentOwner && (
                                                <div className="text-xs text-yellow-400 mt-1 flex items-center">
                                                    <Zap className="w-3 h-3 mr-1"/>
                                                    Ownership has been transferred through share trading
                                                </div>
                                            )}

                                            {/* All shares status */}
                                            {allSharesWithOwner && (
                                                <div
                                                    className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-2 mt-2">
                                                    <div className="text-xs text-blue-300 flex items-center">
                                                        <Crown className="w-3 h-3 mr-1"/>
                                                        Owner holds all {fractionalInfo.totalShares} shares - ready for
                                                        full purchase
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {nft.description && (
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Description</h3>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{nft.description}</p>
                                </div>
                            )}

                            {/* Attributes */}
                            {nft.attributes && nft.attributes.length > 0 && (
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Attributes</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {nft.attributes.map((attr, index) => (
                                            <div key={index} className="bg-gray-800 rounded-lg p-3">
                                                <div className="text-gray-400 text-xs mb-1">{attr.trait_type}</div>
                                                <div className="text-white font-medium text-sm">{attr.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fractional Contract Info */}
                            {nft.fractionalContract && (
                                <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                                    <h3 className="text-lg font-semibold text-white mb-3">Fractional Contract (ERC-20)</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-gray-400 text-sm">Shares Contract Address</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <p className="text-white font-mono text-xs break-all">{nft.fractionalContract}</p>
                                                <button
                                                    onClick={() => copyToClipboard(nft.fractionalContract!, 'fractional')}
                                                    className="p-1 hover:bg-purple-800 rounded transition-colors flex-shrink-0"
                                                >
                                                    {copiedAddress === 'fractional' ? (
                                                        <Check className="w-3 h-3 text-green-400"/>
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-400"/>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <a
                                                href={`https://sepolia.etherscan.io/address/${nft.fractionalContract}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-300 hover:text-purple-200 text-sm flex items-center space-x-1"
                                            >
                                                <span>View Shares on Etherscan</span>
                                                <ExternalLink className="w-3 h-3"/>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fractional Ownership Details */}
                            {nft.isfractionalized && fractionalInfo && (
                                <div className="bg-purple-900/20 rounded-lg p-4 sm:p-6 border border-purple-500/30">
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                                        <Coins className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400 flex-shrink-0"/>
                                        <span>Fractional Ownership</span>
                                    </h3>

                                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm sm:text-base">Total Shares</span>
                                            <span
                                                className="text-white font-medium text-sm sm:text-base">{fractionalInfo.totalShares}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm sm:text-base">Price per Share</span>
                                            <span
                                                className="text-white font-medium text-sm sm:text-base">{fractionalInfo.sharePrice} ETH</span>
                                        </div>
                                        {userAddress && userSharePercentage > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span
                                                    className="text-gray-400 text-sm sm:text-base">Your Ownership</span>
                                                <span
                                                    className="text-green-400 font-medium text-sm sm:text-base">{userSharePercentage}%</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Buy Shares */}
                                    {session ? (
                                        <div className="border-t border-purple-500/30 pt-4">
                                            {!canBuy && (
                                                <GuestWarning 
                                                    message="Connect your wallet to buy NFT shares and start building your digital art collection."
                                                    className="mb-4"
                                                />
                                            )}
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-base sm:text-lg font-medium text-white">Buy
                                                    Shares</h4>
                                                {canBuy && (
                                                    <div className="text-right text-xs sm:text-sm">
                                                        <div className="text-gray-400">Your Balance</div>
                                                        <div className="text-white font-medium">{userBalance} ETH</div>
                                                    </div>
                                                )}
                                            </div>

                                            {hasAvailableShares && canBuy ? (
                                                <>
                                                    <div
                                                        className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                                        <div className="text-xs sm:text-sm text-blue-300">
                                                            <span
                                                                className="font-medium">{availableShares}</span> shares
                                                            available for purchase
                                                            {allSharesWithOwner && (
                                                                <span className="block text-yellow-300 mt-1">
                                  ⚡ All shares held by owner - you can buy the entire NFT!
                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Quick buy buttons */}
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <button
                                                            onClick={() => setBuyAmountQuick(1)}
                                                            className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded"
                                                        >
                                                            1 Share
                                                        </button>
                                                        {availableShares >= 10 && (
                                                            <button
                                                                onClick={() => setBuyAmountQuick(Math.min(10, availableShares))}
                                                                className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded"
                                                            >
                                                                10 Shares
                                                            </button>
                                                        )}
                                                        {availableShares >= 50 && (
                                                            <button
                                                                onClick={() => setBuyAmountQuick(Math.min(50, availableShares))}
                                                                className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded"
                                                            >
                                                                50 Shares
                                                            </button>
                                                        )}
                                                        {allSharesWithOwner && (
                                                            <button
                                                                onClick={() => setBuyAmountQuick(fractionalInfo.totalShares)}
                                                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded flex items-center"
                                                            >
                                                                <Crown className="w-3 h-3 mr-1"/>
                                                                All Shares (Own NFT!)
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div
                                                        className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={availableShares || 1000}
                                                                value={buyAmount}
                                                                onChange={(e) => {
                                                                    const inputValue = e.target.value;
                                                                    // Allow empty input while typing
                                                                    if (inputValue === '') {
                                                                        setBuyAmount(1);
                                                                        return;
                                                                    }

                                                                    const numValue = parseInt(inputValue);
                                                                    if (!isNaN(numValue) && numValue > 0) {
                                                                        setBuyAmount(numValue);
                                                                    }
                                                                }}
                                                                onBlur={() => {
                                                                    // Apply constraints when user finishes typing
                                                                    const maxAllowed = availableShares > 0 ? availableShares : 1000;
                                                                    if (buyAmount < 1) {
                                                                        setBuyAmount(1);
                                                                    } else if (buyAmount > maxAllowed) {
                                                                        setBuyAmount(maxAllowed);
                                                                    }
                                                                }}
                                                                className="w-20 px-2 sm:px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                placeholder="1"
                                                            />
                                                            <span className="text-gray-400 text-sm">shares</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-gray-400 text-sm">for</span>
                                                            <span
                                                                className={`font-medium text-sm sm:text-base ${canAfford ? 'text-white' : 'text-red-400'}`}>
                                {totalCost.toFixed(4)} ETH
                              </span>
                                                        </div>
                                                    </div>

                                                    {!canAfford && (
                                                        <div
                                                            className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                                                            <div className="text-xs sm:text-sm text-red-300">
                                                                Insufficient balance. You
                                                                need {(totalCost - parseFloat(userBalance)).toFixed(4)} more
                                                                ETH.
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <button
                                                            onClick={() => setBuyAmount(1)}
                                                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                                        >
                                                            1
                                                        </button>
                                                        <button
                                                            onClick={() => setBuyAmount(Math.min(5, availableShares, maxBuyAmount))}
                                                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                                        >
                                                            5
                                                        </button>
                                                        <button
                                                            onClick={() => setBuyAmount(Math.min(10, availableShares, maxBuyAmount))}
                                                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                                        >
                                                            10
                                                        </button>
                                                        <button
                                                            onClick={() => setBuyAmount(Math.min(availableShares, maxBuyAmount))}
                                                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                                        >
                                                            Max
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={handleBuyShares}
                                                        disabled={isBuying || !canAfford || buyAmount <= 0 || !canBuy}
                                                        className={`w-full px-4 py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${
                                                            isBuying || !canAfford || buyAmount <= 0 || !canBuy
                                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                                        }`}
                                                    >
                                                        {isBuying ? (
                                                            <div
                                                                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        ) : (
                                                            <ShoppingCart className="w-4 h-4 mr-2 flex-shrink-0"/>
                                                        )}
                                                        {isBuying ? 'Buying...' : canBuy ? `Buy ${buyAmount} Share${buyAmount > 1 ? 's' : ''}` : 'Connect Wallet to Buy'}
                                                    </button>
                                                </>
                                            ) : canBuy ? (
                                                <div className="text-center py-4">
                                                    <div className="text-gray-400 text-sm mb-2">No shares available for
                                                        purchase
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-3">
                                                        {shareHolders.length === 1 && shareHolders[0].percentage === 100
                                                            ? `All ${fractionalInfo.totalShares} shares are owned by one holder (${formatAddress(shareHolders[0].holder)})`
                                                            : 'All shares are currently distributed among shareholders'
                                                        }
                                                    </div>
                                                    {userSharePercentage > 0 && (
                                                        <div className="text-xs text-blue-300">
                                                            You currently own {userSharePercentage}% of this NFT
                                                        </div>
                                                    )}
                                                </div>
                                            ) : hasAvailableShares ? (
                                                <div className="text-center py-4">
                                                    <div className="text-amber-400 text-sm mb-2">
                                                        <span className="font-medium">{availableShares}</span> shares available
                                                    </div>
                                                    <div className="text-xs text-amber-300">
                                                        Connect your wallet to purchase shares
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <div className="text-gray-400 text-sm mb-2">No shares available</div>
                                                    <div className="text-xs text-gray-500">All shares are currently held</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border-t border-purple-500/30 pt-4">
                                            <div className="text-center py-4">
                                                <div className="text-gray-400 text-sm mb-2">Connect your wallet to buy
                                                    shares
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    You need to connect a wallet to purchase fractional ownership
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Shareholders */}
                                    <div className="border-t border-purple-500/30 pt-4 mt-4">
                                        <button
                                            onClick={() => setShowShareholders(!showShareholders)}
                                            className="flex items-center justify-between w-full text-white hover:text-purple-300 transition-colors"
                                        >
                                            <span
                                                className="font-medium text-sm sm:text-base">Shareholders ({shareHolders.length})</span>
                                            <span
                                                className={`transform transition-transform text-sm ${showShareholders ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                                        </button>

                                        {showShareholders && (
                                            <div className="mt-3 space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                                                {shareHolders.map((holder, index) => (
                                                    <div key={index}
                                                         className="flex items-center justify-between text-xs sm:text-sm bg-gray-800/30 rounded p-2">
                                                        <span
                                                            className="text-gray-400 font-mono truncate flex-1 mr-2">{formatAddress(holder.holder)}</span>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-white">{holder.shares} shares</div>
                                                            <div className="text-purple-300">{holder.percentage}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 