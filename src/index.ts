import config from './config.json';
import { TinkoffProductsScrapper } from './BankDataScrapper/Tinkoff/TinkoffProductsScrapper';
import { AlfaProductsScrapper } from './BankDataScrapper/Alfa/AlfaProductsScrapper';

(async () => {
    var tinkoffScrapper = new TinkoffProductsScrapper(config.tinkoff.login, config.tinkoff.password, config.tinkoff.baseUrl)
    var alfaScrapper = new AlfaProductsScrapper(config.alfa.login, config.alfa.password, config.alfa.baseUrl)
    var banksProducts = await Promise.all([alfaScrapper.bankProducts(), tinkoffScrapper.bankProducts()])
    var mergedProducts = banksProducts[0].concat(banksProducts[1])
    console.log(mergedProducts)
  })()
