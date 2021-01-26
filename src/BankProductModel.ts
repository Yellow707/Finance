import { Money } from 'parse-money/dist/types';

export enum BankProductType {
    debit,
    credit,
    investiton,
    deposit
}

export class BankProductModel {
    name: string
    type: BankProductType
    amount: Money

    constructor(name: string, type: BankProductType, amount: Money) {
        this.name = name
        this.type = type
        this.amount = amount
    }
}