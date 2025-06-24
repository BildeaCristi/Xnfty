"use client";

import { NFT } from '@/types/blockchain';
import { MuseumService } from '@/services/museumService';
import { SCENE_CONFIG } from '@/config/sceneConfig';
import EnhancedNFTFrame from '../EnhancedNFTFrame';

interface NFTCollectionDisplayProps {
  nfts: NFT[];
  controlMode: string;
  modalJustClosed: boolean;
  onNFTClick: (nft: NFT) => void;
  onNFTHover: (hovered: boolean, nft: NFT) => void;
}

export default function NFTCollectionDisplay({
  nfts,
  controlMode,
  modalJustClosed,
  onNFTClick,
  onNFTHover
}: NFTCollectionDisplayProps) {
  const nftPositions = MuseumService.calculateNFTPositions(nfts.length);

  return (
    <>
      {nfts.map((nft, index) => (
        <EnhancedNFTFrame
          key={nft.tokenId}
          nft={nft}
          position={nftPositions[index]}
          rotation={MuseumService.calculateNFTRotation(index, nfts.length)}
          onClick={() => {
            if (controlMode === 'orbit' && !modalJustClosed) {
              onNFTClick(nft);
            }
          }}
          onHover={(hovered) => {
            if (controlMode === 'orbit' && !modalJustClosed) {
              onNFTHover(hovered, nft);
            }
          }}
        />
      ))}
    </>
  );
}
