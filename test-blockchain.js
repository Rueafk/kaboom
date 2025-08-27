const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:8000/api';

async function testBlockchainIntegration() {
    console.log('🧪 Testing Blockchain Integration for Kaboom Game\n');

    // Test 1: Check blockchain status
    console.log('1. Checking blockchain status...');
    try {
        const statusResponse = await fetch(`${API_BASE}/blockchain/status`);
        const status = await statusResponse.json();
        console.log('✅ Blockchain Status:', status);
    } catch (error) {
        console.log('❌ Error checking blockchain status:', error.message);
    }

    // Test 2: Check sync queue
    console.log('\n2. Checking sync queue...');
    try {
        const queueResponse = await fetch(`${API_BASE}/blockchain/sync-queue`);
        const queue = await queueResponse.json();
        console.log('✅ Sync Queue Status:', queue);
    } catch (error) {
        console.log('❌ Error checking sync queue:', error.message);
    }

    // Test 3: Store sample player profile
    console.log('\n3. Storing sample player profile...');
    const samplePlayer = {
        wallet_address: '8FBiWrjRZhR4qkRp52k22cuMVGJRrq86sp66Au7fSBEi',
        username: 'TestPlayer',
        level: 5,
        total_score: 15000,
        boom_tokens: 1500,
        lives: 3,
        current_score: 2500,
        experience_points: 5000,
        achievements_unlocked: 3,
        games_played: 25,
        games_won: 15,
        highest_level_reached: 8,
        total_enemies_killed: 150,
        total_bombs_used: 75
    };

    try {
        const playerResponse = await fetch(`${API_BASE}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(samplePlayer)
        });
        const playerResult = await playerResponse.json();
        console.log('✅ Player Profile Result:', playerResult);
    } catch (error) {
        console.log('❌ Error storing player profile:', error.message);
    }

    // Test 4: Store sample game session
    console.log('\n4. Storing sample game session...');
    const sampleSession = {
        session_id: `test_session_${Date.now()}`,
        wallet_address: '8FBiWrjRZhR4qkRp52k22cuMVGJRrq86sp66Au7fSBEi',
        session_start: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        session_end: new Date().toISOString(),
        final_score: 2500,
        enemies_killed: 25,
        bombs_used: 10,
        level_reached: 6,
        survival_time: 300
    };

    try {
        const sessionResponse = await fetch(`${API_BASE}/sessions/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sampleSession)
        });
        const sessionResult = await sessionResponse.json();
        console.log('✅ Game Session Result:', sessionResult);
    } catch (error) {
        console.log('❌ Error storing game session:', error.message);
    }

    // Test 5: Award BOOM tokens
    console.log('\n5. Awarding BOOM tokens...');
    try {
        const tokenResponse = await fetch(`${API_BASE}/blockchain/award-tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: '8FBiWrjRZhR4qkRp52k22cuMVGJRrq86sp66Au7fSBEi',
                amount: 100,
                reason: 'test_reward'
            })
        });
        const tokenResult = await tokenResponse.json();
        console.log('✅ Token Award Result:', tokenResult);
    } catch (error) {
        console.log('❌ Error awarding tokens:', error.message);
    }

    // Test 6: Store sample achievement
    console.log('\n6. Storing sample achievement...');
    const sampleAchievement = {
        achievement_id: 'test_achievement_001',
        wallet_address: '8FBiWrjRZhR4qkRp52k22cuMVGJRrq86sp66Au7fSBEi',
        achievement_name: 'Test Achievement',
        achievement_description: 'This is a test achievement for demonstration',
        game_session_id: sampleSession.session_id
    };

    try {
        const achievementResponse = await fetch(`${API_BASE}/blockchain/achievement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sampleAchievement)
        });
        const achievementResult = await achievementResponse.json();
        console.log('✅ Achievement Result:', achievementResult);
    } catch (error) {
        console.log('❌ Error storing achievement:', error.message);
    }

    // Test 7: Check token balance
    console.log('\n7. Checking token balance...');
    try {
        const balanceResponse = await fetch(`${API_BASE}/blockchain/token-balance/8FBiWrjRZhR4qkRp52k22cuMVGJRrq86sp66Au7fSBEi`);
        const balance = await balanceResponse.json();
        console.log('✅ Token Balance:', balance);
    } catch (error) {
        console.log('❌ Error checking token balance:', error.message);
    }

    // Test 8: Force sync queue
    console.log('\n8. Force syncing queue...');
    try {
        const syncResponse = await fetch(`${API_BASE}/blockchain/force-sync`, {
            method: 'POST'
        });
        const syncResult = await syncResponse.json();
        console.log('✅ Force Sync Result:', syncResult);
    } catch (error) {
        console.log('❌ Error force syncing:', error.message);
    }

    // Test 9: Final status check
    console.log('\n9. Final blockchain status check...');
    try {
        const finalStatusResponse = await fetch(`${API_BASE}/blockchain/status`);
        const finalStatus = await finalStatusResponse.json();
        console.log('✅ Final Blockchain Status:', finalStatus);
    } catch (error) {
        console.log('❌ Error checking final status:', error.message);
    }

    console.log('\n🎉 Blockchain integration test completed!');
    console.log('\n📊 Access the admin dashboards:');
    console.log('   - Main Admin: http://localhost:8000/admin');
    console.log('   - Blockchain Admin: http://localhost:8000/blockchain-admin');
}

// Run the test
testBlockchainIntegration().catch(console.error);
