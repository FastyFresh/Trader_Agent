const { Keypair, PublicKey } = require('@solana/web3.js');
const logger = require('../utils/logger');

class WalletService {
    constructor() {
        this.keypair = null;
        this.publicKey = null;
    }

    async initialize() {
        try {
            // In production, load keypair from secure storage
            // For testing, generate a new keypair
            this.keypair = Keypair.generate();
            this.publicKey = this.keypair.publicKey;

            logger.info('Wallet initialized:', {
                publicKey: this.publicKey.toString()
            });

            return true;
        } catch (error) {
            logger.error('Failed to initialize wallet:', error);
            throw error;
        }
    }

    getKeypair() {
        if (!this.keypair) {
            throw new Error('Wallet not initialized');
        }
        return this.keypair;
    }

    getPublicKey() {
        if (!this.publicKey) {
            throw new Error('Wallet not initialized');
        }
        return this.publicKey;
    }

    // Add funds to wallet (for testing)
    async requestAirdrop(connection, amount = 1) {
        try {
            const signature = await connection.requestAirdrop(
                this.publicKey,
                amount * 1000000000 // Convert SOL to lamports
            );
            await connection.confirmTransaction(signature);
            
            logger.info('Airdrop received:', {
                amount: `${amount} SOL`,
                signature
            });
            
            return signature;
        } catch (error) {
            logger.error('Airdrop failed:', error);
            throw error;
        }
    }

    // Get SOL balance
    async getBalance(connection) {
        try {
            const balance = await connection.getBalance(this.publicKey);
            return balance / 1000000000; // Convert lamports to SOL
        } catch (error) {
            logger.error('Failed to get balance:', error);
            throw error;
        }
    }

    // Sign a transaction
    async signTransaction(transaction) {
        try {
            transaction.sign(this.keypair);
            return transaction;
        } catch (error) {
            logger.error('Failed to sign transaction:', error);
            throw error;
        }
    }

    // Create a new wallet
    static async create() {
        const wallet = new WalletService();
        await wallet.initialize();
        return wallet;
    }

    // Load an existing wallet from a secret key
    static async fromSecretKey(secretKey) {
        try {
            const wallet = new WalletService();
            wallet.keypair = Keypair.fromSecretKey(
                Buffer.from(secretKey, 'base64')
            );
            wallet.publicKey = wallet.keypair.publicKey;
            
            logger.info('Wallet loaded from secret key:', {
                publicKey: wallet.publicKey.toString()
            });
            
            return wallet;
        } catch (error) {
            logger.error('Failed to load wallet from secret key:', error);
            throw error;
        }
    }

    // Export wallet (for backup)
    exportSecretKey() {
        if (!this.keypair) {
            throw new Error('Wallet not initialized');
        }
        return Buffer.from(this.keypair.secretKey).toString('base64');
    }

    // Cleanup
    cleanup() {
        this.keypair = null;
        this.publicKey = null;
        logger.info('Wallet cleanup completed');
    }
}

module.exports = WalletService;