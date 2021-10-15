import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Currency, CurrencyDocument, GameOfCurrencyGroup, GameOfCurrencyGroupDocument } from "./schemas";

@Injectable()
export class CurrenciesService {
    constructor(
        @InjectModel(Currency.name) private readonly currencyModel: Model<CurrencyDocument>,
        @InjectModel(GameOfCurrencyGroup.name) private readonly gameOfCurrencyGroupModel: Model<GameOfCurrencyGroupDocument>,
    ) {}
}
