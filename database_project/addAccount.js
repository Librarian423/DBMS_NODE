const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    // 계좌 생성 페이지 라우트
    router.get("/addAccount", (req, res) => {
        if (req.session && req.session.user) {
            res.render("addAccount");
        } else {
            res.redirect("/login"); // 세션이 없는 경우 로그인 페이지로 리디렉션
        }
    });

    router.post("/addAccount", (req, res) => {
        const { account_number, account_name } = req.body;
        const user_id = req.session.user.user_id;

        // Account 테이블에서 user_id 및 account_number 중복 확인
        sql_connection.query('SELECT * FROM Account WHERE user_id = ? OR account_number = ?', [user_id, account_number], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("서버 오류가 발생했습니다.");
            }
            if (result.length > 0) { 
                // 중복 계좌가 있는 경우
                res.render("addAccount", { addAccountResult: 'fail' });
            } else {
                // 중복이 없으면 계좌 생성
                sql_connection.query(
                    'INSERT INTO Account (account_number, user_id, account_name, deposit, withholding) VALUES (?, ?, ?, ?, ?)',
                    [account_number, user_id, account_name, 0, 0],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send("계좌 생성 중 오류가 발생했습니다.");
                        } else {
                            res.redirect("/myAccount"); // 계좌 생성 후 계좌 페이지로 리디렉션
                        }
                    }
                );
            }
        });
    });

    return router;
};
