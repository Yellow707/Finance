import { BankProductModel } from './Model/BankProductModel';

export interface BaseBankProductsScrapperInterface {
    bankProducts(): Promise<BankProductModel[]>
}