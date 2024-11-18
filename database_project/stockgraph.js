const express = require('express');
const router = express.Router();

module.exports = (sql_connection) => {
    
    router.get("/stockgraph", (req, res) => {
        const { stock_ticker } = req.query;  // Get the ticker from the query parameter
    
        if (!stock_ticker) {
            return res.status(400).send(" get Stock ticker is required.");
        }
    
        sql_connection.query(`
            SELECT 
                DATE_FORMAT(report_date, '%Y-%m-%d %H:%i') AS minute,
                AVG(open) AS average_open
            FROM Reports
            WHERE stock_ticker = ?
            GROUP BY minute
            ORDER BY minute`, 
            [stock_ticker], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error retrieving minute-level data");
                }
    
                // Extract labels (minutes) and data (average_open prices) for the graph
                const labels = result.map(row => row.minute);
                const data = result.map(row => row.average_open);
    
                // Render the EJS template with the stock data
                res.render('stockgraph', {
                    ticker: stock_ticker,    // Pass the stock ticker to the template
                    labels: JSON.stringify(labels),  // Pass labels as JSON for JS use
                    data: JSON.stringify(data)       // Pass data as JSON for JS use
                });
        });
    });
    
    
    
    router.post("/stockgraph", (req, res) => {
        const { stock_ticker } = req.body;  // Get the ticker from the POST body
    
        if (!stock_ticker) {
            return res.status(400).send("graph Stock ticker is required.");
        }
    
        sql_connection.query(`
            SELECT 
                DATE_FORMAT(report_date, '%Y-%m-%d %H:%i') AS minute,
                AVG(open) AS average_open
            FROM Reports
            WHERE stock_ticker = ?
            GROUP BY minute
            ORDER BY minute`, 
            [stock_ticker], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error retrieving minute-level data");
                }
    
                // Extract labels (minutes) and data (average_open prices) for the graph
                const labels = result.map(row => row.minute);
                const data = result.map(row => row.average_open);
    
                // Render the EJS template with the stock data
                res.render('stockgraph', {
                    ticker: stock_ticker,    // Pass the stock ticker to the template
                    labels: JSON.stringify(labels),  // Pass labels as JSON for JS use
                    data: JSON.stringify(data)       // Pass data as JSON for JS use
                });
        });
    });
    
    
    return router;
};
