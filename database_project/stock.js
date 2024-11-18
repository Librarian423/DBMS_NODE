const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (sql_connection) => {
    
    router.get("/stock", (req, res) => {
        const { ticker } = req.query;
        if (!ticker) {
            return res.status(400).send("종목 코드가 필요합니다.");
        }
    
        // 종목 정보 조회
        sql_connection.query('SELECT * FROM Stocks WHERE stock_ticker = ?', [ticker], (err, stockResult) => {
            if (err) {
                console.error(err);
                return res.status(500).send("종목 정보를 가져오는 중 오류가 발생했습니다.");
            }
    
            if (stockResult.length === 0) {
                return res.status(404).send("종목을 찾을 수 없습니다.");
            }
    
            const stock = stockResult[0];
    
            // 5단계 호가창 조회
            sql_connection.query(`
                (SELECT price, SUM(quantity) AS volume, "ask" AS type FROM Offers WHERE stock_ticker = ? AND type = "sell" GROUP BY price ORDER BY price ASC LIMIT 5) 
                UNION ALL 
                (SELECT price, SUM(quantity) AS volume, "bid" AS type FROM Offers WHERE stock_ticker = ? AND type = "buy" GROUP BY price ORDER BY price DESC LIMIT 5);`, 
                [ticker, ticker], (err, orderBookResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("호가창 정보를 가져오는 중 오류가 발생했습니다.");
                }
    
                // Fetch high price from Reports table
                sql_connection.query('SELECT open FROM Reports WHERE stock_ticker = ? ORDER BY report_date DESC LIMIT 1', [ticker], (err, reportResult) => {
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
        });
    });
    
    

    // Render the stock list
    router.post("/stockList", (req, res) => {
        sql_connection.query('SELECT * FROM Stocks', (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error retrieving stocks.");
            }
            res.render("stockList", { stocks: result });
        });
    });

    function getCurrentTimestamp() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
    }

    function getPreviousClose(stock_ticker, callback) {
        sql_connection.query(
            'SELECT price FROM Offers WHERE stock_ticker = ? ORDER BY update_timestamp DESC LIMIT 1 OFFSET 1',
            [stock_ticker],
            (err, result) => {
                if (err || result.length === 0) {
                    //default 1000원
                    return callback(1000);
                }
                callback(result[0].price);
            }
        );
    }

    function getMarketPrices(stock_ticker, callback) {
        sql_connection.query(
            'SELECT AVG(price) AS open, MAX(price) AS high, MIN(price) AS low FROM Offers WHERE stock_ticker = ?',
            [stock_ticker],
            (err, result) => {
                if (err || result.length === 0) {
                    console.error("Error fetching market prices:", err);
                    return callback(null);
                }
                callback(result[0]);
            }
        );
    }

    function insertReports(stock_ticker, traded) {
        const timestamp = getCurrentTimestamp();

        getMarketPrices(stock_ticker, (marketPrices) => {
            if (!marketPrices) return;

            getPreviousClose(stock_ticker, (previousClose) => {
                if (previousClose === null) return;

                const { open, high, low } = marketPrices;
                sql_connection.query(
                    'INSERT INTO Reports (report_date, stock_ticker, previous_close, open, high, low, volume, create_timestamp, update_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [timestamp, stock_ticker, previousClose, open, high, low, traded, timestamp, timestamp],
                    (err) => {
                        if (err) console.error("Error inserting report:", err);
                        // else console.log("Report inserted successfully");
                    }
                );
            });
        });
    }

    function isAble(user_id, total_price, callback) {
        sql_connection.query('SELECT * FROM Account WHERE user_id = ?', [user_id], (err, result) => {
            if (err || result.length === 0) {
                console.error("Account check error or account not found:", err);
                return callback(false);
            }

            const availableFunds = parseInt(result[0].withholding, 10);
            callback(availableFunds >= total_price);
        });
    }

    function buyWithholding(account_number, price, callback) {
        sql_connection.query(
            'UPDATE Account SET withholding = withholding - ? WHERE account_number = ? AND withholding >= ?',
            [price, account_number, price],
            (err, result) => {
                if (err || result.affectedRows === 0) {
                    console.error("Insufficient funds or error:", err);
                    return callback(false);
                }
                callback(true);
            }
        );
    }

    function sellWithholding(account_number, price, callback) {
        sql_connection.query(
            'UPDATE Account SET withholding = withholding + ? WHERE account_number = ?',
            [price, account_number],
            (err, result) => {
                if (err || result.affectedRows === 0) {
                    console.error("Error updating withholding on sell:", err);
                    return callback(false);
                }
                callback(true);
            }
        );
    }

    function insertOffers(account_number, stock_ticker, type, quantity, price, callback) {
        const orderSequenceNumber = uuidv4();
        const timestamp = getCurrentTimestamp();

        sql_connection.query(
            'INSERT INTO Offers (offer_number, offer_date, account_number, stock_ticker, status, type, quantity, price, traded, not_traded, create_timestamp, update_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderSequenceNumber, timestamp, account_number, stock_ticker, "firm", type, quantity, price, quantity, 0, timestamp, timestamp],
            (err) => {
                if (err) {
                    console.error("Error inserting offer:", err);
                    return callback(false);
                }
                insertReports(stock_ticker, quantity);
                callback(true);
            }
        );
    }

    // Buy stock
    router.post("/buyStock", (req, res) => {
        if (!req.session || !req.session.user) return res.redirect("/login");

        sql_connection.query('SELECT * FROM Account WHERE user_id = ?', [req.session.user.user_id], (err, result) => {
            if (err || result.length === 0) {
                console.error("Account not found or error:", err);
                return res.status(500).send("계좌 정보를 찾을 수 없습니다.");
            }

            const account_number = result[0].account_number;
            const { stock_ticker, buyCount, buyPrice } = req.body;
            const total_price = parseInt(buyCount, 10) * parseInt(buyPrice, 10);

            isAble(req.session.user.user_id, total_price, (isAbleResult) => {
                if (!isAbleResult) return res.status(400).send("잔액이 부족합니다.");

                buyWithholding(account_number, total_price, (buyWithholdingResult) => {
                    if (!buyWithholdingResult) return res.status(400).send("잔액이 부족합니다.");

                    sql_connection.query(
                        'SELECT quantity FROM Holdings WHERE account_number = ? AND stock_ticker = ?',
                        [account_number, stock_ticker],
                        (err, holdingsResult) => {
                            if (err) return res.status(500).send("보유 주식 확인 중 오류 발생.");

                            const timestamp = getCurrentTimestamp();
                            const newQuantity = holdingsResult.length > 0
                                ? parseInt(holdingsResult[0].quantity, 10) + parseInt(buyCount, 10)
                                : parseInt(buyCount, 10);

                            if (holdingsResult.length > 0) {
                                sql_connection.query(
                                    'UPDATE Holdings SET quantity = ?, total_price = total_price + ?, update_timestamp = ? WHERE account_number = ? AND stock_ticker = ?',
                                    [newQuantity, total_price, timestamp, account_number, stock_ticker],
                                    (err) => {
                                        if (err) return res.status(500).send("보유 주식 업데이트 중 오류 발생.");
                                        insertOffers(account_number, stock_ticker, "buy", buyCount, buyPrice, (offerResult) => {
                                            if (!offerResult) return res.status(500).send("주식 매수 중 오류 발생.");
                                            res.redirect(`/stock?ticker=${stock_ticker}`);
                                        });
                                    }
                                );
                            } else {
                                sql_connection.query(
                                    'INSERT INTO Holdings (account_number, stock_ticker, quantity, total_price, create_timestamp, update_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                                    [account_number, stock_ticker, buyCount, total_price, timestamp, timestamp],
                                    (err) => {
                                        if (err) return res.status(500).send("보유 주식 추가 중 오류 발생.");
                                        insertOffers(account_number, stock_ticker, "buy", buyCount, buyPrice, (offerResult) => {
                                            if (!offerResult) return res.status(500).send("주식 매수 중 오류 발생.");
                                            res.redirect(`/stock?ticker=${stock_ticker}`);
                                        });
                                    }
                                );
                            }
                        }
                    );
                });
            });
        });
    });

    // Sell stock
    router.post("/sellStock", (req, res) => {
        if (!req.session || !req.session.user) return res.redirect("/login");

        sql_connection.query('SELECT * FROM Account WHERE user_id = ?', [req.session.user.user_id], (err, result) => {
            if (err || result.length === 0) {
                console.error("Account not found or error:", err);
                return res.status(500).send("서버 오류가 발생했습니다.");
            }

            const account_number = result[0].account_number;
            const { stock_ticker, sellCount, sellPrice } = req.body;
            const total_price = parseInt(sellPrice, 10) * parseInt(sellCount, 10);

            sql_connection.query(
                'SELECT quantity FROM Holdings WHERE account_number = ? AND stock_ticker = ?',
                [account_number, stock_ticker],
                (err, holdingsResult) => {
                    if (err || holdingsResult.length === 0) {
                        console.error("No holdings found or error:", err);
                        return res.status(400).send("보유 주식이 없습니다.");
                    }

                    const existingQuantity = parseInt(holdingsResult[0].quantity, 10);
                    if (existingQuantity < parseInt(sellCount, 10)) {
                        console.error("Not enough quantity to sell.");
                        return res.status(400).send("보유 수량이 부족합니다.");
                    }

                    const newQuantity = existingQuantity - parseInt(sellCount, 10);
                    const timestamp = getCurrentTimestamp();

                    sellWithholding(account_number, total_price, (sellResult) => {
                        if (!sellResult) return res.status(400).send("매도 오류");

                        sql_connection.query(
                            newQuantity > 0
                                ? 'UPDATE Holdings SET quantity = ?, total_price = total_price - ?, update_timestamp = ? WHERE account_number = ? AND stock_ticker = ?'
                                : 'DELETE FROM Holdings WHERE account_number = ? AND stock_ticker = ?',
                            newQuantity > 0
                                ? [newQuantity, total_price, timestamp, account_number, stock_ticker]
                                : [account_number, stock_ticker],
                            (err) => {
                                if (err) return res.status(500).send("매도 업데이트 중 오류 발생.");

                                insertOffers(account_number, stock_ticker, "sell", sellCount, sellPrice, (offerResult) => {
                                    if (!offerResult) return res.status(500).send("매도 기록 중 오류 발생.");
                                    res.redirect(`/stock?ticker=${stock_ticker}`);
                                });
                            }
                        );
                    });
                }
            );
        });
    });

    router.post("/stockDetails", (req, res) => {
        const { stock_ticker } = req.body;
        
        sql_connection.query(
            'SELECT * FROM Stocks WHERE stock_ticker = ?',
            [stock_ticker],
            (err, stockResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("서버 오류가 발생했습니다.");
                }

                // Fetch top 5 bid/ask offers for the order book
                sql_connection.query(
                    'SELECT price, quantity, type FROM Offers WHERE stock_ticker = ? ORDER BY type DESC, price DESC LIMIT 5',
                    [stock_ticker],
                    (err, offersResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send("서버 오류가 발생했습니다.");
                        }

                        res.render("stocks", {
                            stock: stockResult[0],
                            offers: offersResult
                        });
                    }
                );
            }
        );
    });

    return router;
};
