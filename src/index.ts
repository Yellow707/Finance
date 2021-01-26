
import puppeteer from 'puppeteer';
import parseMoney from 'parse-money';
import config from './config.json';
import * as BankProduct from './BankProductModel';

const url = 'https://www.tinkoff.ru/login/'; // URL we're scraping
const login = config.login;
const password = config.password;

async function handleCardInfo(cardElements: puppeteer.ElementHandle<Element>[]) {
    var productsArray = new Array<BankProduct.BankProductModel>()
    for (const card of cardElements) {
        const cardText = await card.getProperty('textContent')
        const cardValue = cardText.jsonValue()
        cardValue.then(function(value) {
            const stringValue = String(value)
            console.log(stringValue);
            const moneyRegexp = stringValue.match(/\d.*/)
            console.log(moneyRegexp[0]);
            const product = new BankProduct.BankProductModel('', BankProduct.BankProductType.debit, parseMoney(moneyRegexp[0]))
            productsArray.push(product)
        })
    }

    productsArray.forEach(element => {
        console.log(element.amount.amount);
        
    });
}

(async () => {
    console.log(login);
    console.log(password);
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const loginElement = await page.$('[name="login"]')
    await loginElement.type(login)
    const passwordElement = await page.$('[name="password"]')
    await passwordElement.type(password)
    const enterButton = await page.$('[type="submit"]')
    await enterButton.click()
    await page.waitForNavigation({waitUntil: 'networkidle2'})
    const hiddenCardsButton = await page.$('[class="AccountsListHeader__hiddenControl_b1UG_t"]')
    await hiddenCardsButton.click()
    const cardElements = await page.$$('[class="Item__infoBlock_m2f9X8"]')
    handleCardInfo(cardElements)
    await page.screenshot({path: 'example.png'})
  
    await browser.close();
  })();
