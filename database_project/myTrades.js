const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    router.get("/myTrades", (req, res) => {
        if (req.session && req.session.user) {
            sql_connection.query(
                'SELECT Offers.*, Stocks.name FROM Offers JOIN Stocks ON Offers.stock_ticker = Stocks.stock_ticker WHERE Offers.account_number = ( SELECT account_number FROM Account WHERE user_id = ?) ORDER BY Offers.update_timestamp DESC;',
                [req.session.user.user_id],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("서버 오류가 발생했습니다.");
                    }
                    res.render("myTrades", { user: req.session.user, offers: result });
                }
            );
        } else {
            res.redirect("/home");
        }
    });


    router.post("/myTradeSearch", (req, res) => {
        const { start_date, end_date, name } = req.body;

        sql_connection.query('SELECT Offers.*, Stocks.name FROM Offers JOIN Stocks ON Offers.stock_ticker = Stocks.stock_ticker WHERE Offers.account_number = ( SELECT account_number FROM Account WHERE user_id = ? AND name LIKE ?) AND DATE(offer_date) BETWEEN ? AND ? ORDER BY Offers.update_timestamp DESC;', [req.session.user.user_id, `%${name}%`, start_date, end_date], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("서버 오류가 발생했습니다."); // 클라이언트에 에러 응답
            }
            res.render("myTrades", { user: req.session.user, offers: result });
        });
    });
    
    return router;
};
