const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    router.get("/stockTrades", (req, res) => {
        const { stock_ticker } = req.query; // req.body 대신 req.query 사용
        sql_connection.query(
            'SELECT Offers.*, Stocks.name AS stock_name FROM Offers JOIN Stocks ON Offers.stock_ticker = Stocks.stock_ticker WHERE Offers.stock_ticker = ? ORDER BY Offers.update_timestamp DESC;',
            [stock_ticker],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("서버 오류가 발생했습니다.");
                }
                console.log(result.name);
                res.render("stockTrades", { stock_ticker, offers: result });
            }
        );
    });
    
    return router;
};
