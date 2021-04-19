import config from './config.json';
import { TinkoffProductsScrapper } from './BankDataScrapper/Tinkoff/TinkoffProductsScrapper';

const url = config.tinkoff.baseUrl; // URL we're scraping
const login = config.tinkoff.login;
const password = config.tinkoff.password;

(async () => {
    console.log(login);
    console.log(password);

    var tinkoffScrapper = new TinkoffProductsScrapper(login, password, url)
    var bankProducts = await tinkoffScrapper.bankProducts()
    console.log(bankProducts)

  })()
