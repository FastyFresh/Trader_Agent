const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');

const HELIUS_API_KEY = 'a6bbe042-e904-4efd-87ae-20c0a07eac79';
const WALLET_ADDRESS = '7YUNhvaPzA4TTdm1SzDhzGvvzs57mq2cokeYYxEaK2n8';
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

async function requestAirdrop() {
    try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const publicKey = new PublicKey(WALLET_ADDRESS);
        
        console.log('Requesting airdrop...');
        
        // First attempt: Direct airdrop
        try {
            const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature);
            console.log('Direct airdrop successful!');
            console.log('Signature:', signature);
            return;
        } catch (directError) {
            console.log('Direct airdrop failed, trying Helius API...');
        }

        // Second attempt: Using Helius API
        const response = await axios.post(
            `https://api.helius.xyz/v0/devnet/faucet?api-key=${HELIUS_API_KEY}`,
            { address: WALLET_ADDRESS }
        );

        console.log('Helius API Response:', response.data);
        console.log('Please check your wallet for the airdropped SOL');

    } catch (error) {
        console.error('Error requesting airdrop:', error.response?.data || error.message);
    }
}

// Execute airdrop request
requestAirdrop();