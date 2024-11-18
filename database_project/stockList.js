const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {

    router.get("/stockList", (req, res) => {
        sql_connection.query('SELECT * FROM Stocks ', (err, result) => {
            
            res.render("stockList", { stocks: result });
        });
    });

    router.post("/stock", (req, res) => {
        const { stock_ticker } = req.body;
    
        // 종목 정보 조회
        sql_connection.query(
            'SELECT * FROM Stocks WHERE stock_ticker = ?', 
            [stock_ticker],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error retrieving stock details");
                }
    
                if (result.length === 0) {
                    return res.status(404).send("Stock not found");
                }
    
                const stock = result[0];
    
                // 5단계 호가창 조회
            sql_connection.query(`
                (SELECT price, SUM(quantity) AS volume, "ask" AS type FROM Offers WHERE stock_ticker = ? AND type = "sell" GROUP BY price ORDER BY price ASC LIMIT 5) 
                UNION ALL 
                (SELECT price, SUM(quantity) AS volume, "bid" AS type FROM Offers WHERE stock_ticker = ? AND type = "buy" GROUP BY price ORDER BY price DESC LIMIT 5);`, 
                [stock_ticker, stock_ticker], (err, orderBookResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("호가창 정보를 가져오는 중 오류가 발생했습니다.");
                }
    
                // Fetch high price from Reports table
                sql_connection.query('SELECT open FROM Reports WHERE stock_ticker = ? ORDER BY report_date DESC LIMIT 1', [stock_ticker], (err, reportResult) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("고가 정보를 가져오는 중 오류가 발생했습니다.");
                    }
    
                    let highPrice = 0;
                    let openPrice = 0;
                    
                    if (reportResult.length === 0) {
                        // return res.status(404).send("고가 정보가 없습니다.");
                        highPrice = 0;
                        openPrice = 0;
                        const hypotheticalLevels = Array.from({ length: 10 }, (_, i) => ({
                            price: 0,
                            volume: 0, 
                            type: 'hypothetical'
                        }));
                        const completeOrderBook = [...orderBookResult, ...hypotheticalLevels];
    
                        // Render the stock view with stock and orderBook data
                        res.render("stock", { 
                            user: req.session.user, 
                            stock,
                            orderBook: completeOrderBook 
                        });
                    }
                    else{
                        highPrice = reportResult[0].open;
                        openPrice = 10;
                        if(highPrice > 100000){
                            openPrice = 100;
                        }
                        highPrice = highPrice + openPrice * 5;
                    
                        const hypotheticalLevels = Array.from({ length: 10 }, (_, i) => ({
                            price: highPrice - openPrice * i,
                            volume: 1000 + i * 100, 
                            type: 'hypothetical'
                        }));
                        const completeOrderBook = [...orderBookResult, ...hypotheticalLevels];
    
                        // Render the stock view with stock and orderBook data
                        res.render("stock", { 
                            user: req.session.user, 
                            stock,
                            orderBook: completeOrderBook 
                        });
                    }
                });
            });
            }
        );
    });
    
    router.post("/stockgraph", (req, res) => {
        const { stock_ticker } = req.body;  // Get the ticker from the POST body
        
        if (!stock_ticker) {
            return res.status(400).send("list Stock ticker is required.");
        }
    
        sql_connection.query(`
            SELECT 
                DATE_FORMAT(report_date, '%Y-%m-%d %H:%i') AS minute,
                AVG(open) AS average_open
            FROM Reports
            WHERE stock_ticker = ?
            GROUP BY minute
            ORDER BY minute`, 
            [stock_ticker], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error retrieving minute-level data");
                }
    
                // Extract labels (minutes) and data (average_open prices) for the graph
                const labels = result.map(row => row.minute);
                const data = result.map(row => row.average_open);
    
                // Render the EJS template with the stock data
                res.render('stockgraph', {
                    ticker: stock_ticker,    // Pass the stock ticker to the template
                    labels: JSON.stringify(labels),  // Pass labels as JSON for JS use
                    data: JSON.stringify(data)       // Pass data as JSON for JS use
                });
        });
    });
    
    return router;
};
