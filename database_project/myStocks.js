const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    router.get("/myStocks", (req, res) => {
        if (req.session && req.session.user) {
            sql_connection.query(
                'SELECT * FROM Holdings Join Account, Stocks WHERE Account.account_number = Holdings.Account_number AND Stocks.stock_ticker = Holdings.stock_ticker AND user_id = ?',
                [req.session.user.user_id],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("서버 오류가 발생했습니다.");
                    }
                    res.render("myStocks", { user: req.session.user, account: result });
                });
        } else {
            res.redirect("/home");
        }
    });

    router.post("/myStockSearch", (req, res) => {
        const { name } = req.body;

        sql_connection.query('SELECT * FROM Holdings JOIN Account ON Account.account_number = Holdings.account_number JOIN Stocks ON Stocks.stock_ticker = Holdings.stock_ticker WHERE Account.user_id = ? AND Stocks.name LIKE ?;', [req.session.user.user_id, `%${name}%`], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("서버 오류가 발생했습니다."); // 클라이언트에 에러 응답
            }
            res.render("myStocks", { user: req.session.user, account: result });
        });
    });

    router.post("/tradeinfo", (req, res) => {
        const { stock_ticker } = req.body;

        sql_connection.query('SELECT Offers.*, Stocks.name AS stock_name FROM Offers JOIN Stocks ON Offers.stock_ticker = Stocks.stock_ticker WHERE Offers.stock_ticker = ? ORDER BY Offers.update_timestamp DESC;', [stock_ticker], (err, result) => {
            if (err) {
                console.error(err);
                res.render("stockTrades", { stock_ticker, offers: [] });
            }
            res.render("stockTrades", { stock_ticker, offers: result });
        });
    });

    router.post("/stockgraph", (req, res) => {
        const { stock_ticker } = req.body;  // Get the ticker from the POST body
    
        if (!stock_ticker) {
            return res.status(400).send("my Stock ticker is required.");
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
