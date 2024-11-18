const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const loginRoutes = require('./login'); // 로그인 라우터
const signupRoutes = require('./signup'); // 회원가입 라우터
const homeRoutes = require('./home'); //홈페이지 라우터
const adminRoutes = require('./admin'); //홈페이지 라우터
const stockSearchRoutes = require('./stockSearch'); //종목 검색 라우터 
const stockListRoutes = require('./stockList'); //종목 라우터 
const myAccountRoutes = require('./myAccount'); //회원 계좌 라우터 
const addAccountRoutes = require('./addAccount'); //계좌 추가 라우터 
const stockRoutes = require('./stock'); //보유 종목 라우터 
const myStocksRoutes = require('./myStocks'); //보유 종목 라우터 
const myTradesRoutes = require('./myTrades'); //종목 거래 내역 라우터 


const router = express.Router();
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS 환경에서는 true로 설정
}));

const db_info = {
    host: 'localhost',
    port: '3306',
    user: 'yousuehyoun',
    password: 'Youg423!',  
    database: 'DB_2017030019'
};

const sql_connection = mysql.createConnection(db_info);
sql_connection.connect();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

// 라우터 설정
app.use('/', router); //시작 라우터
app.use('/', loginRoutes(sql_connection)); // 로그인 라우터 
app.use('/', signupRoutes(sql_connection)); // 회원가입 라우터 
app.use('/', homeRoutes(sql_connection)); //홈페이지 라우터
app.use('/', adminRoutes(sql_connection)); //관리자 라우터
app.use('/', stockSearchRoutes(sql_connection)); //종목검색 라우터
app.use('/', stockListRoutes(sql_connection)); //종목 라우터
app.use('/', myAccountRoutes(sql_connection)); //회원 계좌 라우터
app.use('/', addAccountRoutes(sql_connection)); //계좌 추가 라우터
app.use('/', stockRoutes(sql_connection)); //종목 라우터
app.use('/', myStocksRoutes(sql_connection)); //종목 라우터
app.use('/', myTradesRoutes(sql_connection)); //거래 내역 라우터

// 시작 페이지 라우트
router.get("/", (req, res) => {
    res.render("app");
});


app.listen(3000, () => {
    console.log("running server");
});

