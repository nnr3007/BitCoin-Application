
// AI Price Predictions & Trading Signals Logic
document.addEventListener('DOMContentLoaded', () => {
    const aiContainer = document.getElementById('aiPredictionContainer');
    const signalsContainer = document.getElementById('tradingSignalsContainer');

    // --- Feature 1: AI Crypto Price Prediction ---
    const updatePredictions = async () => {
        if (!aiContainer) return;
        const coins = ['bitcoin', 'ethereum', 'solana'];
        
        try {
            const predictions = await Promise.all(coins.map(async (coinId) => {
                const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`);
                const data = await response.json();
                
                const prices = data.prices.map(p => p[1]);
                const currentPrice = prices[prices.length - 1];
                const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
                
                // Prediction Logic: Momentum + Trend
                let prediction = 'Neutral';
                let confidence = 50 + Math.random() * 20; // Simulated confidence base
                let icon = '⚖';
                
                if (currentPrice > avgPrice * 1.02) {
                    prediction = 'Bullish';
                    icon = '📈';
                    confidence += 10;
                } else if (currentPrice < avgPrice * 0.98) {
                    prediction = 'Bearish';
                    icon = '📉';
                    confidence += 10;
                }

                return {
                    id: coinId,
                    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
                    price: currentPrice,
                    prediction,
                    icon,
                    confidence: Math.min(95, confidence).toFixed(0)
                };
            }));

            aiContainer.innerHTML = predictions.map(p => `
                <div class="prediction-item">
                    <h4>${p.name}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-dim);">Price: $${p.price.toLocaleString()}</p>
                    <div class="prediction-label ${p.prediction === 'Bullish' ? 'price-up' : (p.prediction === 'Bearish' ? 'price-down' : '')}">
                        ${p.prediction} ${p.icon}
                    </div>
                    <span style="font-size: 0.75rem;">Confidence: ${p.confidence}%</span>
                    <div class="confidence-bar-bg">
                        <div class="confidence-bar-fill" style="width: ${p.confidence}%"></div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Prediction Error:', error);
            aiContainer.innerHTML = '<p>Prediction service temporarily unavailable.</p>';
        }
    };

    // --- Feature 2: Real-Time Trading Signals ---
    const updateSignals = async () => {
        if (!signalsContainer) return;

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false');
            const coins = await response.json();

            signalsContainer.innerHTML = coins.slice(0, 10).map(coin => {
                const change = coin.price_change_percentage_24h;
                let signal = 'HOLD';
                let signalClass = 'signal-hold';
                let icon = '⚖';

                if (change > 3) {
                    signal = 'BUY';
                    signalClass = 'signal-buy';
                    icon = '📈';
                } else if (change < -3) {
                    signal = 'SELL';
                    signalClass = 'signal-sell';
                    icon = '📉';
                }

                return `
                    <div class="signal-item">
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <img src="${coin.image}" class="circle-img" style="width: 20px; height: 20px;">
                            <strong>${coin.name}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span class="${change >= 0 ? 'price-up' : 'price-down'}">${change.toFixed(2)}%</span>
                            <span class="signal-type ${signalClass}">${signal} ${icon}</span>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Signals Error:', error);
            signalsContainer.innerHTML = '<p>Unable to generate live signals.</p>';
        }
    };

    // Auto Update every 30 seconds
    updatePredictions();
    updateSignals();
    setInterval(() => {
        updatePredictions();
        updateSignals();
    }, 30000);
});
