
// Market Heatmap Logic
window.renderHeatmap = (coins) => {
    const heatmapGrid = document.getElementById('marketHeatmap');
    if (!heatmapGrid) return;

    heatmapGrid.innerHTML = '';
    const top20 = coins.slice(0, 20);
    
    // Calculate total market cap to determine box sizes
    const totalCap = top20.reduce((acc, c) => acc + c.market_cap, 0);

    top20.forEach(coin => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        // Calculate size based on market cap percentage (min 80px, max 250px visually)
        const capWeight = coin.market_cap / totalCap;
        const size = Math.max(80, Math.min(250, capWeight * 1000)); 
        
        cell.style.width = `${size}px`;
        cell.style.height = `${size}px`;
        cell.style.flexGrow = capWeight * 10;

        // Determine color based on 24h change
        const change = coin.price_change_percentage_24h_in_currency || 0;
        let color = '#333';
        if (change > 5) color = '#006400'; // Dark Green
        else if (change > 0) color = '#228B22'; // Light Green
        else if (change < -5) color = '#8B0000'; // Dark Red
        else if (change < 0) color = '#CD5C5C'; // Light Red

        cell.style.backgroundColor = color;
        
        cell.innerHTML = `
            <strong>${coin.symbol.toUpperCase()}</strong>
            <span>${change.toFixed(2)}%</span>
        `;

        cell.title = `${coin.name}\nPrice: $${coin.current_price.toLocaleString()}\nCap: $${(coin.market_cap/1e9).toFixed(2)}B`;
        
        heatmapGrid.appendChild(cell);
    });
};
