
// Trading & Watchlist Logic
document.addEventListener('DOMContentLoaded', () => {
    const portfolio = JSON.parse(localStorage.getItem('portfolio') || '{}');
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

    // --- Trading Engine ---
    window.executeTrade = (type) => {
        const coinSelect = document.getElementById('tradeCoin');
        const amount = parseFloat(document.getElementById('tradeAmount').value);
        if (!amount || amount <= 0) return alert('Enter valid amount');

        const coinId = coinSelect.value;
        const coinName = coinSelect.options[coinSelect.selectedIndex].text;
        
        // In a real app, we'd fetch price here. Simulation uses dummy or dashboard data.
        const currentPrice = window.lastFetchedPrices ? (window.lastFetchedPrices[coinId] || 50000) : 50000;
        const totalValue = amount * currentPrice;

        if (type === 'BUY') {
            portfolio[coinId] = (portfolio[coinId] || 0) + amount;
        } else {
            if ((portfolio[coinId] || 0) < amount) return alert('Insufficient balance!');
            portfolio[coinId] -= amount;
        }

        transactions.unshift({
            coin: coinName,
            type: type,
            amount: amount,
            price: currentPrice,
            total: totalValue,
            date: new Date().toLocaleString()
        });

        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        updatePortfolioUI();
        updateHistoryUI();
        alert(`${type} order executed!`);
    };

    const updatePortfolioUI = () => {
        const grid = document.getElementById('portfolioGrid');
        if (!grid) return;
        
        grid.innerHTML = Object.entries(portfolio).map(([id, qty]) => `
            <div class="glass-card stat-item">
                <span>${id.toUpperCase()} Balance</span>
                <strong>${qty.toFixed(4)}</strong>
            </div>
        `).join('') || '<p>Your portfolio is empty.</p>';
    };

    const updateHistoryUI = () => {
        const body = document.getElementById('historyBody');
        if (!body) return;

        body.innerHTML = transactions.map(t => `
            <tr>
                <td>${t.coin}</td>
                <td><span class="${t.type === 'BUY' ? 'price-up' : 'price-down'}">${t.type}</span></td>
                <td>${t.amount}</td>
                <td>$${t.price.toLocaleString()}</td>
                <td>$${t.total.toLocaleString()}</td>
                <td>${t.date}</td>
            </tr>
        `).join('');
    };

    // --- Watchlist Engine ---
    window.toggleWatchlist = (coinId) => {
        const index = watchlist.indexOf(coinId);
        if (index > -1) {
            watchlist.splice(index, 1);
        } else {
            watchlist.push(coinId);
        }
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        document.querySelectorAll(`.watchlist-btn[data-id="${coinId}"]`).forEach(btn => {
            btn.classList.toggle('active');
        });
    };

    window.renderWatchlist = async () => {
        const grid = document.getElementById('watchlistGrid');
        if (!grid || watchlist.length === 0) return;

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${watchlist.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false`);
            const data = await response.json();

            grid.innerHTML = data.map(coin => `
                <div class="glass-card coin-card">
                    <div class="coin-header">
                        <img src="${coin.image}" class="circle-img">
                        <div class="coin-info">
                            <h3>${coin.name}</h3>
                            <span>${coin.symbol.toUpperCase()}</span>
                        </div>
                        <button onclick="toggleWatchlist('${coin.id}'); renderWatchlist();" class="watchlist-btn active">⭐</button>
                    </div>
                    <div class="coin-stats">
                        <div class="stat-item">
                            <span>Price</span>
                            <strong>$${coin.current_price.toLocaleString()}</strong>
                        </div>
                        <div class="stat-item">
                            <span>24h Change</span>
                            <strong class="${coin.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down'}">
                                ${coin.price_change_percentage_24h.toFixed(2)}%
                            </strong>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Watchlist fetch error:', error);
        }
    };

    // Initial renders
    updatePortfolioUI();
    updateHistoryUI();
    if (window.location.pathname.includes('watchlist.html')) {
        renderWatchlist();
    }
});
