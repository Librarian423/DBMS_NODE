const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    // 홈페이지 라우트
    router.get("/home", (req, res) => {
        
        if (req.session && req.session.user) {
            
            res.render("home", { user: req.session.user });
        } else {
            res.redirect("/login");
        }
    });
    
    router.post("/home", (req, res) => {
        const { name } = req.body;

        sql_connection.query('SELECT * FROM Stocks WHERE name LIKE ?', [`%${name}%`], (err, result) => {
            if (err) 
            {
                console.error(err);
                return res.status(500).send("서버 오류가 발생했습니다."); // 클라이언트에 에러 응답
            }
            if (result.length > 0)
            {
                res.render('./stockSearch',{stocks:result});    
            }
            else
            {
                //빈 리스트 반환
                res.render('./stockSearch',
                    {stocks:[]});     
            }
            
        });
    });
    

    return router;
};
