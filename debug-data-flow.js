// Comprehensive data flow debugging
console.log('🔍 === DEEP DATA FLOW DEBUGGING ===');

// Test 1: Check all components availability
function checkComponents() {
    console.log('🔍 Test 1: Component Availability');
    console.log('GameSessionManager:', typeof GameSessionManager);
    console.log('window.gameSessionManager:', window.gameSessionManager);
    console.log('window.walletConnection:', window.walletConnection);
    console.log('window.playerDataManager:', window.playerDataManager);
    console.log('window.game:', window.game);
    console.log('window.playerProfile:', window.playerProfile);
}

// Test 2: Check wallet connection
function checkWalletConnection() {
    console.log('🔍 Test 2: Wallet Connection');
    if (window.walletConnection) {
        console.log('Wallet connected:', window.walletConnection.isConnected);
        console.log('Public key:', window.walletConnection.publicKey);
        console.log('Wallet address:', window.walletConnection.publicKey?.toString());
    } else {
        console.log('❌ No wallet connection found');
    }
}

// Test 3: Check GameSessionManager state
function checkGameSessionManager() {
    console.log('🔍 Test 3: GameSessionManager State');
    if (window.gameSessionManager) {
        const debugInfo = window.gameSessionManager.getDebugInfo();
        console.log('Debug info:', debugInfo);
        console.log('Session active:', window.gameSessionManager.isSessionActive());
        console.log('Session ID:', window.gameSessionManager.getSessionId());
        console.log('Current wallet:', window.gameSessionManager.currentWallet);
    } else {
        console.log('❌ GameSessionManager not found');
    }
}

// Test 4: Test API endpoints directly
async function testAPIEndpoints() {
    console.log('🔍 Test 4: API Endpoints');
    
    try {
        // Test health
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('Health endpoint:', healthData);
        
        // Test players list
        const playersResponse = await fetch('/api/players');
        const playersData = await playersResponse.json();
        console.log('Players endpoint:', playersData);
        
        // Test specific player if wallet connected
        if (window.walletConnection && window.walletConnection.publicKey) {
            const walletAddress = window.walletConnection.publicKey.toString();
            console.log('Testing player endpoint for:', walletAddress);
            
            const playerResponse = await fetch(`/api/players/${walletAddress}`);
            if (playerResponse.ok) {
                const playerData = await playerResponse.json();
                console.log('Player data from API:', playerData);
            } else {
                console.log('Player not found in database (404)');
            }
        }
        
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// Test 5: Simulate game events
async function simulateGameEvents() {
    console.log('🔍 Test 5: Simulate Game Events');
    
    if (!window.gameSessionManager) {
        console.log('❌ GameSessionManager not available');
        return;
    }
    
    if (!window.walletConnection || !window.walletConnection.isConnected) {
        console.log('❌ Wallet not connected');
        return;
    }
    
    const walletAddress = window.walletConnection.publicKey.toString();
    console.log('Simulating events for wallet:', walletAddress);
    
    // Start session
    console.log('Starting session...');
    const startResult = await window.gameSessionManager.startSession(walletAddress);
    console.log('Session start result:', startResult);
    
    if (startResult.success) {
        // Simulate enemy kill
        console.log('Simulating enemy kill...');
        await window.gameSessionManager.onEnemyKilled();
        
        // Simulate score earned
        console.log('Simulating score earned...');
        await window.gameSessionManager.onScoreEarned(100);
        
        // Simulate tokens earned
        console.log('Simulating tokens earned...');
        await window.gameSessionManager.onTokensEarned(10);
        
        // Check session data
        console.log('Session data after events:', window.gameSessionManager.getSessionData());
        
        // Force save
        console.log('Forcing save...');
        const saveResult = await window.gameSessionManager.savePlayerProfile();
        console.log('Save result:', saveResult);
        
        // End session
        console.log('Ending session...');
        const endResult = await window.gameSessionManager.endSession();
        console.log('Session end result:', endResult);
    }
}

// Test 6: Check profile loading
async function checkProfileLoading() {
    console.log('🔍 Test 6: Profile Loading');
    
    if (!window.playerDataManager) {
        console.log('❌ PlayerDataManager not available');
        return;
    }
    
    if (!window.walletConnection || !window.walletConnection.publicKey) {
        console.log('❌ Wallet not connected');
        return;
    }
    
    const walletAddress = window.walletConnection.publicKey.toString();
    console.log('Loading profile for wallet:', walletAddress);
    
    try {
        const profile = await window.playerDataManager.loadPlayerProfile(walletAddress);
        console.log('Loaded profile:', profile);
        
        if (profile) {
            console.log('Profile fields:');
            console.log('- Username:', profile.username);
            console.log('- Level:', profile.level);
            console.log('- Total Score:', profile.totalScore);
            console.log('- Boom Tokens:', profile.boomTokens);
            console.log('- Games Played:', profile.gamesPlayed);
        } else {
            console.log('No profile found');
        }
    } catch (error) {
        console.error('Profile loading failed:', error);
    }
}

// Test 7: Check settings panel data
function checkSettingsPanel() {
    console.log('🔍 Test 7: Settings Panel Data');
    
    const profileWallet = document.getElementById('profileWallet');
    const profileUsername = document.getElementById('profileUsername');
    const profileLevel = document.getElementById('profileLevel');
    const profileTotalScore = document.getElementById('profileTotalScore');
    const profileGamesPlayed = document.getElementById('profileGamesPlayed');
    
    console.log('Profile elements:');
    console.log('- Wallet:', profileWallet?.textContent);
    console.log('- Username:', profileUsername?.textContent);
    console.log('- Level:', profileLevel?.textContent);
    console.log('- Total Score:', profileTotalScore?.textContent);
    console.log('- Games Played:', profileGamesPlayed?.textContent);
    
    console.log('window.playerProfile:', window.playerProfile);
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Running comprehensive data flow tests...');
    
    checkComponents();
    checkWalletConnection();
    checkGameSessionManager();
    await testAPIEndpoints();
    await simulateGameEvents();
    await checkProfileLoading();
    checkSettingsPanel();
    
    console.log('🔍 === END DEEP DATA FLOW DEBUGGING ===');
}

// Make functions globally available
window.debugDataFlow = {
    checkComponents,
    checkWalletConnection,
    checkGameSessionManager,
    testAPIEndpoints,
    simulateGameEvents,
    checkProfileLoading,
    checkSettingsPanel,
    runAllTests
};

// Auto-run after a delay
setTimeout(runAllTests, 3000);
