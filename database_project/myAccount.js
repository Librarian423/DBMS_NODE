const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    router.get("/myAccount", (req, res) => {
        if (req.session && req.session.user) {
            sql_connection.query(
                'SELECT * FROM Account WHERE user_id = ?',
                [req.session.user.user_id],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("서버 오류가 발생했습니다.");
                    }
                    
                    res.render("myAccount", { user: req.session.user, account: result });
                }
            );
        } else {
            res.redirect("/home");
        }
    });

    // 입금 처리 라우트
    router.post("/addDeposit", (req, res) => {
        const { deposit, account_number } = req.body;

        sql_connection.query(
            'UPDATE Account SET deposit = deposit + ? WHERE account_number = ?',
            [deposit, account_number],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("입금 중 오류가 발생했습니다.");
                }
                if (result.affectedRows === 0) {
                    return res.status(404).send("존재하지 않는 계좌 번호입니다.");
                }
                res.redirect("/myAccount");
            }
        );
    });

    // 출금 처리 라우트
    router.post("/withdraw", (req, res) => {
        const { withdraw, account_number } = req.body;

        if (!withdraw || withdraw <= 0) {
            return res.status(400).send("유효한 출금 금액을 입력해 주세요.");
        }

        if (!account_number) {
            return res.status(400).send("계좌 번호가 필요합니다.");
        }

        sql_connection.query(
            'UPDATE Account SET deposit = deposit - ? WHERE account_number = ? AND deposit >= ?',
            [withdraw, account_number, withdraw],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("출금 중 오류가 발생했습니다.");
                }

                if (result.affectedRows === 0) {
                    return res.status(400).send("잔액이 부족하거나 존재하지 않는 계좌 번호입니다.");
                }

                res.redirect("/myAccount");
            }
        );
    });

    router.post("/addwithholding", (req, res) => {
        const { addwithholding, account_number } = req.body;

        // Validate input
        if (!addwithholding || addwithholding <= 0) {
            return res.status(400).send("유효한 입금 금액을 입력해 주세요.");
        }

        if (!account_number) {
            return res.status(400).send("계좌 번호가 필요합니다.");
        }

        sql_connection.query(
            'UPDATE Account SET deposit = deposit - ?, withholding = withholding + ? WHERE account_number = ? AND deposit >= ?',
            [addwithholding, addwithholding, account_number, addwithholding],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("입금 중 오류가 발생했습니다.");
                }

                if (result.affectedRows === 0) {
                    return res.status(400).send("잔액이 부족하거나 존재하지 않는 계좌 번호입니다.");
                }

                res.redirect("/myAccount");
            }
        );
    });

    // 예수금 출금 처리 라우트
    router.post("/withdrawWithholding", (req, res) => {
        const { withdrawWithholding, account_number } = req.body;

        // Validate input
        if (!withdrawWithholding || withdrawWithholding <= 0) {
            return res.status(400).send("유효한 출금 금액을 입력해 주세요.");
        }

        if (!account_number) {
            return res.status(400).send("계좌 번호가 필요합니다.");
        }

        sql_connection.query(
            'UPDATE Account SET withholding = withholding - ?, deposit = deposit + ? WHERE account_number = ? AND withholding >= ?',
            [withdrawWithholding, withdrawWithholding, account_number, withdrawWithholding],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("출금 중 오류가 발생했습니다.");
                }

                if (result.affectedRows === 0) {
                    return res.status(400).send("잔액이 부족하거나 존재하지 않는 계좌 번호입니다.");
                }

                res.redirect("/myAccount");
            }
        );
    });



    return router;
};
