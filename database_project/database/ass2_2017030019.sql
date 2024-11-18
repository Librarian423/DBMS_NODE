DROP DATABASE IF EXISTS DB_2017030019;
CREATE DATABASE DB_2017030019;

USE DB_2017030019;

CREATE TABLE Users (
    user_id VARCHAR(64) NOT NULL,
    password VARCHAR(64) NOT NULL,
    user_name VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE Account (
    account_number VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    account_name VARCHAR(64) NULL,
    deposit BIGINT NULL,
    withholding BIGINT NULL,
    PRIMARY KEY (account_number),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Stocks (
    stock_ticker VARCHAR(64) NOT NULL,
    exchange_code VARCHAR(64) NULL,
    status VARCHAR(64) NULL,
    name VARCHAR(64) NULL,
    create_timestamp TIMESTAMP NULL,
    update_timestamp TIMESTAMP NULL,
    PRIMARY KEY (stock_ticker)
);

CREATE TABLE Offers (
    offer_number VARCHAR(64) NOT NULL,
    offer_date VARCHAR(64) NOT NULL,
    account_number VARCHAR(64) NOT NULL,
    stock_ticker VARCHAR(64) NOT NULL,
    status VARCHAR(64) NULL,
    type VARCHAR(64) NULL,
    quantity BIGINT NULL,
    price BIGINT NULL,
    traded BIGINT NULL,
    not_traded BIGINT NULL,
    create_timestamp TIMESTAMP NULL,
    update_timestamp TIMESTAMP NULL,
    PRIMARY KEY (offer_number),
    FOREIGN KEY (account_number) REFERENCES Account(account_number),
    FOREIGN KEY (stock_ticker) REFERENCES Stocks(stock_ticker)
);

CREATE TABLE Trades (
    trade_number VARCHAR(64) NOT NULL,
    trade_date VARCHAR(64) NOT NULL,
    offer_number VARCHAR(64) NULL,
    seller_account_number VARCHAR(64) NULL,
    buyer_account_number VARCHAR(64) NULL,
    quantity BIGINT NULL,
    price BIGINT NULL,
    charge INT NULL,
    create_timestamp TIMESTAMP NULL,
    update_timestamp TIMESTAMP NULL,
    PRIMARY KEY (trade_number),
    FOREIGN KEY (offer_number) REFERENCES Offers(offer_number),
    FOREIGN KEY (seller_account_number) REFERENCES Account(account_number),
    FOREIGN KEY (buyer_account_number) REFERENCES Account(account_number)
);

CREATE TABLE Holdings (
    account_number VARCHAR(64) NOT NULL,
    stock_ticker VARCHAR(64) NOT NULL,
    quantity BIGINT NULL,
    total_price BIGINT NULL,
    create_timestamp TIMESTAMP NULL,
    update_timestamp TIMESTAMP NULL,
    PRIMARY KEY (account_number, stock_ticker),
    FOREIGN KEY (account_number) REFERENCES Account(account_number),
    FOREIGN KEY (stock_ticker) REFERENCES Stocks(stock_ticker)
);

CREATE TABLE Reports (
    report_date VARCHAR(64) NOT NULL,
    stock_ticker VARCHAR(64) NOT NULL,
    previous_close BIGINT NULL,
    open BIGINT NULL,
    high BIGINT NULL,
    low BIGINT NULL,
    volume BIGINT NULL,
    create_timestamp TIMESTAMP NULL,
    update_timestamp TIMESTAMP NULL,
    PRIMARY KEY (report_date, stock_ticker),
    FOREIGN KEY (stock_ticker) REFERENCES Stocks(stock_ticker)
);



