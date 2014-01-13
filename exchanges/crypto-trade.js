var config = require('./../config');
var _ = require('underscore');
var utils = require('../utils');

var CryptoTrade = require('../crypto-trade'),
    cryptoTrade = new CryptoTrade(config['crypto-trade'].apiKey, config['crypto-trade'].secret),
    Deferred = require("promised-io/promise").Deferred;

module.exports = {

    exchangeName: 'crypto-trade',

    balances: {},

    prices: {},

    getBalance: function (type) {
        var deferred = new Deferred(),
            self = this;

        console.log('Getting balances for ' + this.exchangeName);

        cryptoTrade.getInfo(function (err, data) {
            if (!err) {
                _.each(data.data.funds, function (balance, index) {
                    self.balances[index.toLowerCase()] = +balance;
                }, self);

                deferred.resolve();
            }
            else {
                deferred.reject(err);
            }
        });

        return deferred.promise;
    },

    createOrder: function (market, type, rate, amount) {
        var deferred = new Deferred(),
            self = this;

        console.log('Creating order for ' + amount + ' in ' + this.exchangeName + ' in market ' + market + ' to ' + type + ' at rate ' + rate);

        // amount = 0;

        cryptoTrade.trade({
            pair: market.toLowerCase(),
            type: type,
            rate: rate,
            amount: amount
        }, function (err, data) {
            if (!err) {
                console.log('CryptoTrade Order Response: ', data);
                deferred.resolve(data);
            }
            else {
                deferred.reject(err);
            }
        });
    },

    calculateProfit: function (amount) {
        var sellFee = config[this.exchangeName].fees[config.market].sell;

        return utils.calculateProfit(amount, this.prices.sell.price, sellFee.currency, sellFee.percentage, 3);
    },

    calculateCost: function (amount) {
        var buyFee = config[this.exchangeName].fees[config.market].buy;

        return utils.calculateCost(amount, this.prices.buy.price, buyFee.currency, buyFee.percentage, 3);
    },

    getExchangeInfo: function () {
        var deferred = new Deferred(),
            market = config[this.exchangeName].marketMap[config.market],
            self = this;

        console.log('Checking prices for ' + this.exchangeName);

        cryptoTrade.depth({pair: market}, function (err, data) {
            if (!err) {
                var prices = {
                    buy: {},
                    sell: {}
                };

                prices.buy.price = _.first(data.asks)[0];
                prices.buy.quantity = _.first(data.asks)[1];

                prices.sell.price = _.first(data.bids)[0];
                prices.sell.quantity = _.first(data.bids)[1];

                self.prices = prices;

                console.log('Exchange prices for ' + self.exchangeName + ' fetched successfully!');
                deferred.resolve();
            }
            else {
                console.log('Error! Failed to get prices for ' + self.exchangeName);
                deferred.reject(err);
            }
        });

        return deferred.promise;
    }
};