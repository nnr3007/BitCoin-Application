// Consolidated Script for CryptoApp
// Handles Authentication, Redirection, and Crypto Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const registerForm = document.getElementById('btn-signup');
    const loginForm = document.getElementById('btn-login');
    const cryptoGrid = document.getElementById('cryptoGrid');
    const searchInput = document.getElementById('searchInput');
    const lastUpdateSpan = document.getElementById('lastUpdate');
    
    // --- State ---
    let coinsData = [];
    const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';

    // --- Authentication Logic ---

    // Registration
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(u => u.email === email)) {
                alert('Email already registered!');
                return;
            }

            users.push({ name, email, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        });
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('token', 'simulated-' + Math.random());
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid credentials!');
            }
        });
    }

    // Logout Helper
    window.logout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    };

    // Auth Guard
    const authGuard = () => {
        const path = window.location.pathname;
        const page = path.split("/").pop();
        const token = localStorage.getItem('token');

        if (page === 'dashboard.html' && !token) {
            window.location.href = 'login.html';
        }
        if ((page === 'login.html' || page === 'register.html') && token) {
            window.location.href = 'dashboard.html';
        }
    };

    authGuard();

    // --- Crypto Dashboard Logic ---

    if (cryptoGrid || document.getElementById('marketTable')) {
        const loadCryptoData = async () => {
            const loading = document.getElementById('loadingIndicator');
            if (loading) loading.style.display = 'flex';

            try {
                // Fetch 100 coins for the full analytics view
                const response = await fetch(`${API_URL}&price_change_percentage=24h`);
                if (!response.ok) throw new Error('API limit');
                
                coinsData = await response.json();
                
                window.lastFetchedPrices = coinsData.reduce((acc, coin) => {
                    acc[coin.id] = coin.current_price;
                    return acc;
                }, {});

                renderTicker(coinsData);
                renderAnalytics(coinsData);
                renderTable(coinsData);
                if (window.renderHeatmap) window.renderHeatmap(coinsData);

                if (loading) loading.style.display = 'none';
                if (lastUpdateSpan) {
                    lastUpdateSpan.textContent = new Date().toLocaleTimeString();
                }
            } catch (error) {
                console.error('Error:', error);
                if (loading) loading.style.display = 'none';
                const container = document.getElementById('marketTableBody');
                if (container) container.innerHTML = '<tr><td colspan="6" style="text-align:center;">Unable to load market data.</td></tr>';
            }
        };

        const renderTicker = (coins) => {
            const ticker = document.getElementById('priceTicker');
            if (!ticker) return;

            ticker.innerHTML = coins.slice(0, 15).map(c => `
                <span class="ticker-item">
                    ${c.symbol.toUpperCase()} $${c.current_price.toLocaleString()} 
                    <span class="${c.price_change_percentage_24h_in_currency >= 0 ? 'price-up' : 'price-down'}">
                        ${c.price_change_percentage_24h_in_currency >= 0 ? '▲' : '▼'}${Math.abs(c.price_change_percentage_24h_in_currency || 0).toFixed(2)}%
                    </span>
                </span>
            `).join(' | ');
        };

        const renderAnalytics = (coins) => {
            const sorted = [...coins].sort((a, b) => b.price_change_percentage_24h_in_currency - a.price_change_percentage_24h_in_currency);
            const gainers = sorted.slice(0, 5);
            const losers = sorted.slice(-5).reverse();

            const gainerList = document.getElementById('topGainers');
            const loserList = document.getElementById('topLosers');

            if (gainerList) {
                gainerList.innerHTML = gainers.map(c => `
                    <li class="market-item">
                        <span>${c.name}</span>
                        <strong class="price-up">+${(c.price_change_percentage_24h_in_currency || 0).toFixed(2)}%</strong>
                    </li>
                `).join('');
            }
            if (loserList) {
                loserList.innerHTML = losers.map(c => `
                    <li class="market-item">
                        <span>${c.name}</span>
                        <strong class="price-down">${(c.price_change_percentage_24h_in_currency || 0).toFixed(2)}%</strong>
                    </li>
                `).join('');
            }
        };

        const renderTable = (coins) => {
            const body = document.getElementById('marketTableBody');
            if (!body) return;

            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const filtered = coins.filter(c => 
                c.name.toLowerCase().includes(searchTerm) || 
                c.symbol.toLowerCase().includes(searchTerm)
            );

            body.innerHTML = filtered.map(coin => `
                <tr>
                    <td>${coin.market_cap_rank}</td>
                    <td>
                        <div class="td-name">
                            <img src="${coin.image}" class="circle-img" style="width: 25px; height: 25px;">
                            <strong>${coin.name}</strong>
                            <span style="color:var(--text-dim); font-size:0.8rem;">${coin.symbol.toUpperCase()}</span>
                        </div>
                    </td>
                    <td>$${coin.current_price.toLocaleString()}</td>
                    <td class="${coin.price_change_percentage_24h_in_currency >= 0 ? 'price-up' : 'price-down'}">
                        ${(coin.price_change_percentage_24h_in_currency || 0).toFixed(2)}%
                    </td>
                    <td>$${(coin.market_cap / 1e9).toFixed(2)}B</td>
                    <td>$${(coin.total_volume / 1e6).toFixed(2)}M</td>
                </tr>
            `).join('');
        };

        // Table Sorting
        let currentSort = { key: 'market_cap_rank', asc: true };
        window.sortTable = (key) => {
            currentSort.asc = currentSort.key === key ? !currentSort.asc : true;
            currentSort.key = key;

            const sorted = [...coinsData].sort((a, b) => {
                const valA = a[key];
                const valB = b[key];
                return currentSort.asc ? valA - valB : valB - valA;
            });
            renderTable(sorted);
        };

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (document.getElementById('marketTable')) renderTable(coinsData);
                else renderCoins(coinsData);
            });
        }

        loadCryptoData();
        setInterval(loadCryptoData, 30000);
    }

    // --- Crypto Tools Functions ---

    // Tool 1: Currency Converter (USD -> INR)
    window.convertCurrency = async () => {
        const usdAmount = document.getElementById('usdAmount').value;
        const inrResult = document.getElementById('inrResult');
        
        if (!usdAmount || usdAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            const rate = data.rates.INR;
            const result = usdAmount * rate;
            inrResult.textContent = `₹ ${result.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        } catch (error) {
            console.error('Exchange rate error:', error);
            alert('Error fetching exchange rate.');
        }
    };

    // Tool 2: Crypto to INR Converter
    window.convertCrypto = async () => {
        const amount = document.getElementById('cryptoAmount').value;
        const coinId = document.getElementById('cryptoSelect').value;
        const resultEl = document.getElementById('cryptoToInrResult');

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=inr`);
            const data = await response.json();
            const rate = data[coinId].inr;
            const result = amount * rate;
            resultEl.textContent = `₹ ${result.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        } catch (error) {
            console.error('Crypto conversion error:', error);
            alert('Error fetching crypto price.');
        }
    };

    // Tool 3: Bitcoin Calculator
    window.calculateBTC = async () => {
        const amount = document.getElementById('btcCalcAmount').value;
        const usdEl = document.getElementById('btcUsdResult');
        const inrEl = document.getElementById('btcInrResult');

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,inr');
            const data = await response.json();
            const usdRate = data.bitcoin.usd;
            const inrRate = data.bitcoin.inr;

            usdEl.textContent = `$ ${(amount * usdRate).toLocaleString()}`;
            inrEl.textContent = `₹ ${(amount * inrRate).toLocaleString()}`;
        } catch (error) {
            console.error('BTC calculation error:', error);
        }
    };

    // Tool 4: Profit / Loss Calculator
    window.calculateProfit = () => {
        const buy = parseFloat(document.getElementById('buyPrice').value);
        const sell = parseFloat(document.getElementById('sellPrice').value);
        const qty = parseFloat(document.getElementById('quantity').value);
        const resultEl = document.getElementById('profitResult');

        if (isNaN(buy) || isNaN(sell) || isNaN(qty)) {
            alert('Please enter valid numbers');
            return;
        }

        const result = (sell - buy) * qty;
        resultEl.textContent = `${result >= 0 ? '+' : ''}$ ${result.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        resultEl.className = result >= 0 ? 'price-up' : 'price-down';
    };

    // Tool 5: Live Crypto Price Chart
    let priceChart = null;

    const initChart = async () => {
        const ctx = document.getElementById('priceChart')?.getContext('2d');
        if (!ctx) return;

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily');
            const data = await response.json();
            
            const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
            const prices = data.prices.map(p => p[1]);

            if (priceChart) priceChart.destroy();

            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Bitcoin (BTC) - Last 7 Days (USD)',
                        data: prices,
                        borderColor: '#64ffda',
                        backgroundColor: 'rgba(100, 255, 218, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            ticks: { color: '#e6f1ff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: { 
                            ticks: { color: '#e6f1ff' },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#e6f1ff' } }
                    }
                }
            });
        } catch (error) {
            console.error('Chart error:', error);
        }
    };

    if (document.getElementById('priceChart')) {
        initChart();
        setInterval(initChart, 30000);
    }
});
