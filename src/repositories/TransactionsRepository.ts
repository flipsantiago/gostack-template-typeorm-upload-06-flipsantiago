/* eslint-disable no-param-reassign */
import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

type TransactionHandler = (
  transaction: Transaction,
  accumulator: {
    income: number;
    outcome: number;
    total: number;
  },
) => { income: number; outcome: number; total: number };

const transactionHandlers: Record<string, TransactionHandler> = {
  income: (transaction, accumulator) => ({
    income: accumulator.income + Number(transaction.value),
    outcome: accumulator.outcome,
    total: accumulator.total + Number(transaction.value),
  }),
  outcome: (transaction, accumulator) => ({
    income: accumulator.income,
    outcome: accumulator.outcome + Number(transaction.value),
    total: accumulator.total - Number(transaction.value),
  }),
};

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const { income, outcome, total } = transactions.reduce(
      (accumulator, transaction) => {
        const handler = transactionHandlers[transaction.type];
        if (handler) {
          return handler(transaction, accumulator);
        }

        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
