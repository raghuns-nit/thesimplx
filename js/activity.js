
// Activity Logging
async function logActivity(action, entityType, entityId, oldValue = null, newValue = null) {
    try {
        let logs = await loadJson('activity_logs.json');
        const logEntry = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            username: STATE.userEmail || 'system',
            action: action,
            entityType: entityType,
            entityId: entityId,
            oldValue: oldValue,
            newValue: newValue
        };
        logs.unshift(logEntry); // Add to beginning
        
        // Keep logs manageable (e.g., last 1000)
        if(logs.length > 1000) logs.length = 1000;
        
        await saveJson('activity_logs.json', logs);
    } catch(e) {
        console.error("Failed to log activity", e);
    }
}
