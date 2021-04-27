import { BaseBankProductsScrapperInterface } from '../BaseScrapperInterface';
import { BankProductModel, BankProductType, BankType } from '../Model/BankProductModel';
import puppeteer from 'puppeteer';
import parseMoney from 'parse-money';

export class TinkoffProductsScrapper implements BaseBankProductsScrapperInterface {

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
        if ((await this.loginWith(this.login, this.password)).ok) {
            return this.handleBankProducts()
        }

        return
    }

    private async loginWith(login: string, password: string): Promise<puppeteer.Response> {
        const browser = await puppeteer.launch();
        this.activePage = await browser.newPage();
        await this.activePage.goto(this.baseUrl);
        const loginElement = await this.activePage.$('[name="login"]')
        await loginElement.type(login)
        const passwordElement = await this.activePage.$('[name="password"]')
        await passwordElement.type(password)
        const enterButton = await this.activePage.$('[type="submit"]')
        await enterButton.click()
        return (this.activePage.waitForNavigation({waitUntil: 'networkidle2'}))
    }

    private async handleBankProducts(): Promise<BankProductModel[]>{
        const hiddenCardsButton = await this.activePage.$('[class="AccountsListHeader__hiddenControl_b1UG_t"]')
        await hiddenCardsButton.click()
        await this.activePage.waitForTimeout(500)
        const cardElements = await this.activePage.$$('[class="Item__infoBlock_m2f9X8"]')
        return this.handleCardInfo(cardElements)
    }

    private async handleCardInfo(cardElements: puppeteer.ElementHandle<Element>[]): Promise<BankProductModel[]> {
        var productsArray = new Array<BankProductModel>()
        var creditCard: any
        var self = this

        for (const card of cardElements) {
            const cardText = await card.getProperty('textContent')
            const cardValue = cardText.jsonValue()
            cardValue.then(function(value) {
                const stringValue = String(value)
                const product = self.mapBankData(BankType.tinkoff, stringValue)
                if (product == undefined) {
                    return
                }

                if (product.productType == BankProductType.credit) {
                    creditCard = card
                }

                productsArray.push(product)
            })
        }
    
        await this.handleCreditInfo(creditCard, productsArray)

        return productsArray
    }

    private mapBankData(bankType: BankType, productData: String): BankProductModel {
        const parsedData = productData.match(/(.*?)(\d.*?[₽$€])(.*)/)
        
        if (productData.includes('Счет Tinkoff Black')) {
            return new BankProductModel(parsedData[1], BankProductType.debit, bankType, parseMoney(parsedData[2]))
        }
    
        if (productData.includes('Кредитный счет Перекресток')) {
            return new BankProductModel(parsedData[1], BankProductType.credit, bankType, parseMoney(parsedData[2]))
        }
    
        if (productData.includes('Накопительный счет')) {
            return new BankProductModel(parsedData[1], BankProductType.deposit, bankType, parseMoney(parsedData[2]))
        }
    
        if (productData.includes('Инвестиции')) {
            return new BankProductModel(parsedData[1], BankProductType.investiton, bankType, parseMoney(parsedData[2]))
        }
    
        return 
    }

    private async handleCreditInfo(element: puppeteer.ElementHandle<Element>, productsArray: Array<BankProductModel>) {
        await element.click()
        await this.activePage.waitForNavigation({waitUntil: 'networkidle2'})
        const creditCardInfoBlocks = await this.activePage.$$('[class="InfoPanelGrid__column_b238hW InfoPanelGrid__column_0_c238hW"]')
        for (const block of creditCardInfoBlocks) {
            const cardText = await block.getProperty('textContent')    
            const cardValue = cardText.jsonValue()
            cardValue.then(function(value) {
                const stringValue = String(value)
                const creditValue = stringValue.match(/(Текущая задолженность:(.*?₽))/)
                var creditProduct = productsArray.find( product => product.productType == BankProductType.credit)
                creditProduct.credit = parseMoney(creditValue[1])
            })
        }
    }
}