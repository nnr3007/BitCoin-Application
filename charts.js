
// Professional Candlestick Charts via TradingView
document.addEventListener('DOMContentLoaded', () => {
    const initTradingView = () => {
        if (typeof TradingView === 'undefined') {
            setTimeout(initTradingView, 1000);
            return;
        }

        new TradingView.widget({
            "autosize": true,
            "symbol": "BINANCE:BTCUSDT",
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "save_image": false,
            "container_id": "tradingview_btc"
        });
    };

    if (document.getElementById('tradingview_btc')) {
        initTradingView();
    }
});
