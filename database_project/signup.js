const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    // 회원가입 페이지 라우트
    router.get("/signup", (req, res) => {
        res.render("signup");
    });

    router.post("/signup", (req, res) => {
        const { user_id, password, user_name } = req.body;

        sql_connection.query('SELECT * FROM Users WHERE user_id = ?', [user_id], (err, result) => {
            if (err) 
            {
                console.error(err);
                throw err;
            }
            if (result.length > 0) 
            { // 아이디 중복
                res.render("signup", { signupResult: 'fail' });
            } 
            else 
            {
                sql_connection.query('INSERT INTO Users (user_id, password, user_name) VALUES (?, ?, ?)', [user_id, password, user_name], (err) => 
                {
                    if (err) 
                    {
                        throw err;
                    } 
                    else 
                    {
                        res.render("login");
                    }
                });
            }
        });
    });

    return router;
};
