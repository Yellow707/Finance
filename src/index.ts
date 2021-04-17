
import puppeteer from 'puppeteer';
import parseMoney from 'parse-money';
import config from './config.json';
import * as BankProduct from './BankProductModel';

const url = 'https://www.tinkoff.ru/login/'; // URL we're scraping
const login = config.login;
const password = config.password;
var activePage: puppeteer.Page
var creditCard: puppeteer.ElementHandle<Element>
var productsArray: Array<BankProduct.BankProductModel>

async function handleCardInfo(cardElements: puppeteer.ElementHandle<Element>[]) {
    productsArray = new Array<BankProduct.BankProductModel>()
    for (const card of cardElements) {
        const cardText = await card.getProperty('textContent')
        const cardValue = cardText.jsonValue()
        cardValue.then(function(value) {
            const stringValue = String(value)
            const product = mapBankData(BankProduct.BankType.tinkoff, stringValue)

            if ((product != undefined) && (product.productType == BankProduct.BankProductType.credit)) {
                console.log('Handle credit card info...');
                creditCard = card
            }
            productsArray.push(product)
        })
    }

    await handleCreditInfo(creditCard)

    console.log('--- All products info ---')
    console.log(productsArray)
}

function mapBankData(type: BankProduct.BankType, productData: String): BankProduct.BankProductModel {
    const parsedData = productData.match(/(.*?)(\d.*?[₽$€])(.*)/)
    
    if (productData.includes('Счет Tinkoff Black')) {
        return new BankProduct.BankProductModel(parsedData[1], BankProduct.BankProductType.debit, BankProduct.BankType.tinkoff, parseMoney(parsedData[2]))
    }

    if (productData.includes('Кредитный счет Перекресток')) {
        return new BankProduct.BankProductModel(parsedData[1], BankProduct.BankProductType.credit, BankProduct.BankType.tinkoff, parseMoney(parsedData[2]))
    }

    if (productData.includes('Накопительный счет')) {
        return new BankProduct.BankProductModel(parsedData[1], BankProduct.BankProductType.deposit, BankProduct.BankType.tinkoff, parseMoney(parsedData[2]))
    }

    if (productData.includes('Инвестиции')) {
        return new BankProduct.BankProductModel(parsedData[1], BankProduct.BankProductType.investiton, BankProduct.BankType.tinkoff, parseMoney(parsedData[2]))
    }

    return 
}

async function handleCreditInfo(element: puppeteer.ElementHandle<Element>) {
    await element.click()
    await activePage.waitForNavigation({waitUntil: 'networkidle2'})
    const creditCardInfoBlocks = await activePage.$$('[class="InfoPanelGrid__column_b238hW InfoPanelGrid__column_0_c238hW"]')
    for (const block of creditCardInfoBlocks) {
        const cardText = await block.getProperty('textContent')    
        const cardValue = cardText.jsonValue()
        cardValue.then(function(value) {
            const stringValue = String(value)
            const creditValue = stringValue.match(/(Текущая задолженность:(.*?₽))/)
            var creditProduct = productsArray.find( product => product.productType == BankProduct.BankProductType.credit)
            creditProduct.credit = parseMoney(creditValue[1])
        })
    }
}

(async () => {
    console.log(login);
    console.log(password);
    
    const browser = await puppeteer.launch();
    activePage = await browser.newPage();
    await activePage.goto(url);
    const loginElement = await activePage.$('[name="login"]')
    await loginElement.type(login)
    const passwordElement = await activePage.$('[name="password"]')
    await passwordElement.type(password)
    const enterButton = await activePage.$('[type="submit"]')
    await enterButton.click()
    await activePage.waitForNavigation({waitUntil: 'networkidle2'})
    const hiddenCardsButton = await activePage.$('[class="AccountsListHeader__hiddenControl_b1UG_t"]')
    await hiddenCardsButton.click()
    await activePage.waitForTimeout(500)
    const cardElements = await activePage.$$('[class="Item__infoBlock_m2f9X8"]')
    await handleCardInfo(cardElements)
    await browser.close();
  })()
