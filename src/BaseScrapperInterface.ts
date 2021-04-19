import { BankProductModel } from "./BankProductModel";

export interface BaseBankProductsScrapperInterface {
    bankProducts(): Promise<BankProductModel[]>
}