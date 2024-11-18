const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    router.get("/admin", (req, res) => {
        res.render("admin");
    });

    router.post("/admin", (req, res) => {
        const { stock_ticker, exchange_code, status, name } = req.body;

        sql_connection.query('SELECT * FROM Stocks WHERE stock_ticker = ?', [stock_ticker], (err, result) => {
            if (err) {
                console.error("데이터베이스 오류:", err);
                return res.status(500).send("서버 오류. 다시 시도해 주세요."); // 에러 응답
            }
            if (result.length > 0) 
            { // 티커 중복
                res.render("admin", { adminResult: 'fail' });
            } 
            else 
            {
                // 'YYYY-MM-DD HH:MM:SS' 형식
                const now = new Date();
                const timestamp = now.toISOString().slice(0, 19).replace('T', ' '); 
                // 데이터 삽입
                sql_connection.query('INSERT INTO Stocks (stock_ticker, exchange_code, status, name, create_timestamp, update_timestamp) VALUES (?, ?, ?, ?, ?, ?)', 
                    [stock_ticker, exchange_code, status, name, timestamp, timestamp], (err) => {
                        if (err) 
                        {
                            console.error("데이터 삽입 오류:", err);
                            return res.status(500).send("서버 오류. 다시 시도해 주세요."); // 에러 응답
                        } 
                        else 
                        {
                            return res.render("admin");
                        }
                });
            }
        });
    });

    return router;
};
