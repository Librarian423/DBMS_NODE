const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    // 로그인 페이지 라우트
    router.get("/login", (req, res) => {
        res.render("login");
    });

    router.post("/login", (req, res) => {
        const { user_id, password } = req.body;

        sql_connection.query('SELECT * FROM Users WHERE user_id = ? AND password = ?', [user_id, password], (err, result) => {
            if (err) {
                console.error(err);
                return res.render("login", { loginResult: 'fail' });
            }
            if (result.length > 0) 
            { 
                // 아이디와 비밀번호가 맞는 경우
                req.session.user = {
                    user_id: result[0].user_id,
                    user_name: result[0].user_name
                };
                res.render("home", { user: req.session.user });
            } 
            else 
            {
                // 아이디나 비밀번호가 틀린 경우
                res.render("login", { loginResult: 'fail' }); 
            }
        });
    });

    return router;
};
