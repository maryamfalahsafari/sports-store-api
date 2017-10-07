var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var sql = require('mssql');
var passport = require('passport');
var extractJwt = require('passport-jwt').ExtractJwt;
var jwtStrategy = require('passport-jwt').Strategy;
var jwt = require('jsonwebtoken');
var secret = 'harrypotter';

var config = {
    user: 'sa',
    password: 'Aa123456=',
    server: 'localhost',
    database: 'SportsStoreDB'
}
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var router = express.Router();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, authorization");
    next();
});
app.use(passport.initialize());
passport.use(new jwtStrategy({ jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: secret },
    function (jwt_payload, done) {
        console.log('----------JwtStrategy----------', jwt_payload);

        done(null, { username: jwt_payload.username });
    })
);
app.use('/api', router);



router.get('/products', passport.authenticate('jwt', { session: false }), function (req, res) {

    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.query("select * from Products", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({ success: true, result: recordset.recordset });
        });
    });

});
router.get('/categories', function (req, res) {

    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.query("select * from Categories", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({ success: true, result: recordset.recordset });
        });

    });
});
router.get('/products/:id', function (req, res) {

    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.input('id', req.params.id);
        request.query("select * from Products where id=@id", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({
                success: true,
                result: recordset.recordset.length > 0 ? recordset.recordset[0] : null
            });
        });
    });
});
router.post('/products', passport.authenticate('jwt', { session: false }), function (req, res) {
    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.input('Name', req.body.name);
        request.input('CategoryId', req.body.categoryId);
        request.input('Description', req.body.description);
        request.input('Price', req.body.price);
        request.execute("Product_Add", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({
                success: true
            });
        });
    });
});
router.get('/:categoryId/products', function (req, res) {
    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.input('CategoryId', req.params.categoryId);
        request.query("select * from Products where categoryId=@CategoryId", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({
                success: true,
                result: recordset.recordset
            });
        });
    });
});
router.get('/orders', function (req, res) {
    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.query("select * from Orders", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({
                success: true,
                result: recordset.recordset
            });
        });
    });
});
router.post('/orders', function (req, res) {
    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.input('Name', req.body.name);
        request.input('Address', req.body.address);
        request.input('City', req.body.city);
        request.input('State', req.body.state);
        request.input('Zip', req.body.zip);
        request.input('Country', req.body.country);
        request.input('Shipped', req.body.shipped);
        request.execute("Order_Add", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            return res.json({
                success: true
            });
        });
    });
});
router.post('/login', function (req, res) {
    const pool = new sql.ConnectionPool(config, function (err) {
        if (err)
            console.log(err);

        var request = new sql.Request(pool);
        request.input("Username", req.body.username);
        request.input("Password", req.body.password);
        request.execute("User_Login", function (err, recordset) {
            pool.close();
            if (err)
                console.log(err);
            if (recordset.recordset.length == 0) {
                return res.json({
                    success: false
                });
            } else {
                var token = jwt.sign({
                    username: recordset.recordset[0]['username'],
                    firstName: recordset.recordset[0]['firstName'],
                    lastName: recordset.recordset[0]['lastName']
                }, secret , { expiresIn: '1h' })
                return res.json({
                    success: true,
                    token: token
                });
            }
        });
    });
});
app.listen(3000);

console.log('app is lstening to port 3000');