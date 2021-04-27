import { BaseBankProductsScrapperInterface } from '../BaseScrapperInterface';
import { BankProductModel, BankProductType, BankType } from '../Model/BankProductModel';
import puppeteer from 'puppeteer';
import parseMoney from 'parse-money';
import { Money } from 'parse-money/dist/types';

export class AlfaProductsScrapper implements BaseBankProductsScrapperInterface {

    private login: string
    private password: string
    private baseUrl: string

    private activePage: puppeteer.Page

    constructor(login: string, password: string, baseUrl: string) {
        this.login = login
        this.password = password
        this.baseUrl = baseUrl
    }

    async bankProducts(): Promise<BankProductModel[]> {
        var loginResponse = await this.loginWith(this.login, this.password)
        if (loginResponse) {
            var products = await this.handleBankProduct()
            return products
        }

        return
    }

    private async loginWith(login: string, password: string): Promise<boolean> {
        const browser = await puppeteer.launch({
            headless: false
        });
        this.activePage = await browser.newPage();
        await this.activePage.goto(this.baseUrl);
        const loginElement = await this.activePage.$('[name="username"]')
        await loginElement.type(login)
        const loginSubmitButton = await this.activePage.$('[id="login-submit"]')
        await loginSubmitButton.click()
        await this.activePage.waitForTimeout(500)
        const passwordElement = await this.activePage.$('[name="password"]')
        await passwordElement.type(password)
        const passwordSubmitButton = await this.activePage.$('[id="password-submit"]')
        await passwordSubmitButton.click()
        var selector = await this.activePage.waitForSelector('[class="x25b _AC1 x25c"]')
        return selector != null
    }

    private async handleBankProduct(): Promise<BankProductModel[]>{
        var productsArray = new Array<BankProductModel>()
        const cardData = await this.activePage.$('[class="ACCreditDetailsBlock x1a"]')
        const cardText = await cardData.getProperty('textContent')
        const cardValue = cardText.jsonValue()
        var self = this
        cardValue.then(function(value) {
            const stringValue = String(value)
            var amount = self.moneyValueByAlias(stringValue, 'Доступно для трат')
            var credit = self.moneyValueByAlias(stringValue, 'Задолженность')
            var product = new BankProductModel('Альфа-карта', BankProductType.credit, BankType.alfa, amount, credit)
            productsArray.push(product)
        })

        return productsArray
    }

    private moneyValueByAlias(data: String, alias: String): Money {
        const parsedData = data.match(`${alias}(.*?р).`)
        var money = parseMoney(parsedData[1])
        return money
    }
}