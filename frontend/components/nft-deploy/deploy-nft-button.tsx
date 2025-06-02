'use client';

import React, {useState} from 'react';
import NftDeployModal from './nft-deploy-modal';
import {Session} from "next-auth";

export default function DeployNftButton({session}: { session: Session }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={() => setShowModal(true)}
            >
                Deploy New NFT
            </button>

            {showModal && <NftDeployModal session={session} onClose={() => setShowModal(false)}/>}        </div>
    );
}