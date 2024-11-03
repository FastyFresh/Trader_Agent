const { Connection } = require('@solana/web3.js');
const WalletService = require('../services/wallet');
const logger = require('../utils/logger');

async function testWallet() {
    let wallet = null;
    let connection = null;

    try {
        // 1. Create Solana connection
        connection = new Connection(
            process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
            'confirmed'
        );
        logger.info('Connected to Solana');

        // 2. Create new wallet
        wallet = await WalletService.create();
        logger.info('Wallet created:', {
            publicKey: wallet.getPublicKey().toString()
        });

        // 3. Get initial balance
        const initialBalance = await wallet.getBalance(connection);
        logger.info('Initial balance:', {
            balance: `${initialBalance} SOL`
        });

        // 4. Request airdrop (only works on devnet)
        if (process.env.SOLANA_NETWORK === 'devnet') {
            await wallet.requestAirdrop(connection, 1);
            logger.info('Requested airdrop');

            // Wait for airdrop to be processed
            await new Promise(resolve => setTimeout(resolve, 5000));

            const newBalance = await wallet.getBalance(connection);
            logger.info('New balance after airdrop:', {
                balance: `${newBalance} SOL`
            });
        }

        // 5. Export and reload wallet
        const secretKey = wallet.exportSecretKey();
        logger.info('Exported wallet secret key');

        // Cleanup original wallet
        wallet.cleanup();

        // Load wallet from secret key
        wallet = await WalletService.fromSecretKey(secretKey);
        logger.info('Reloaded wallet from secret key:', {
            publicKey: wallet.getPublicKey().toString()
        });

        // Verify balance
        const finalBalance = await wallet.getBalance(connection);
        logger.info('Final balance:', {
            balance: `${finalBalance} SOL`
        });

        logger.info('Wallet test completed successfully');
    } catch (error) {
        logger.error('Wallet test failed:', error);
        throw error;
    } finally {
        if (wallet) {
            wallet.cleanup();
        }
    }
}

// Run the test if called directly
if (require.main === module) {
    testWallet().catch(console.error);
}

module.exports = testWallet;