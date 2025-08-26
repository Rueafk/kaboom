// Test script to verify data flow and real-time collection
console.log('🧪 Testing data flow and real-time collection...');

// Test 1: Check if GameSessionManager is available
console.log('🔍 Test 1: GameSessionManager availability');
console.log('GameSessionManager type:', typeof GameSessionManager);
console.log('window.gameSessionManager:', window.gameSessionManager);

// Test 2: Check if wallet connection is working
console.log('🔍 Test 2: Wallet connection status');
console.log('window.walletConnection:', window.walletConnection);
if (window.walletConnection) {
    console.log('Wallet connected:', window.walletConnection.isConnected);
    console.log('Public key:', window.walletConnection.publicKey);
}

// Test 3: Check if player profile is loaded
console.log('🔍 Test 3: Player profile status');
console.log('window.playerProfile:', window.playerProfile);

// Test 4: Test API endpoints
async function testAPIEndpoints() {
    console.log('🔍 Test 4: API endpoints');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('Health endpoint:', healthData);
        
        // Test players endpoint
        const playersResponse = await fetch('/api/players');
        const playersData = await playersResponse.json();
        console.log('Players endpoint:', playersData);
        
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// Test 5: Test GameSessionManager methods
async function testGameSessionManager() {
    console.log('🔍 Test 5: GameSessionManager methods');
    
    if (window.gameSessionManager) {
        console.log('GameSessionManager debug info:', window.gameSessionManager.getDebugInfo());
        
        // Test session start if wallet is connected
        if (window.walletConnection && window.walletConnection.isConnected) {
            const walletAddress = window.walletConnection.publicKey.toString();
            console.log('Testing session start for wallet:', walletAddress);
            
            const result = await window.gameSessionManager.startSession(walletAddress);
            console.log('Session start result:', result);
            
            if (result.success) {
                // Test some game events
                window.gameSessionManager.onEnemyKilled();
                window.gameSessionManager.onScoreEarned(100);
                window.gameSessionManager.onTokensEarned(10);
                
                console.log('Session data after events:', window.gameSessionManager.getSessionData());
                
                // Test save
                const saveResult = await window.gameSessionManager.savePlayerProfile();
                console.log('Save result:', saveResult);
                
                // End session
                const endResult = await window.gameSessionManager.endSession();
                console.log('End session result:', endResult);
            }
        } else {
            console.log('Wallet not connected, skipping session tests');
        }
    } else {
        console.log('GameSessionManager not available');
    }
}

// Run tests
setTimeout(async () => {
    await testAPIEndpoints();
    await testGameSessionManager();
    console.log('🧪 Data flow tests completed');
}, 2000);

// Make test functions globally available
window.testDataFlow = {
    testAPIEndpoints,
    testGameSessionManager
};
