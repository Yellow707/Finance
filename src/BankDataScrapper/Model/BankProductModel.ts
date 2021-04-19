import { Money } from 'parse-money/dist/types';

export enum BankProductType {
    debit,
    credit,
    investiton,
    deposit
}

export enum BankType {
    tinkoff,
    alfa,
    sber
}

export class BankProductModel {
    name: string
    productType: BankProductType
    bankType: BankType
    amount: Money
    credit?: Money

    constructor(name: string, productType: BankProductType, bankType: BankType, amount: Money, credit?: Money) {
        this.name = name
        this.productType = productType
        this.amount = amount
        this.bankType = bankType
        this.credit = credit
    }
}