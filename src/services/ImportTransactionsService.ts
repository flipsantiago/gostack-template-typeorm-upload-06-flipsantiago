/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const readStream = fs.createReadStream(path);
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const fromLine = 2;
    let isFirstLine = true;
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    readStream.on('data', data => {
      const lines = data.toString().split('\n');
      let startIndex = 0;

      if (isFirstLine) {
        isFirstLine = false;
        startIndex = fromLine - 1;
      }

      for (let index = startIndex; index < lines.length; index += 1) {
        const line = lines[index];
        const [title, type, value, category] = line
          .split(',')
          .map(cell => cell.trim());

        if (!title || !type || !value || !categories) continue;

        categories.push(category);
        transactions.push({ title, type, value, category });
      }
    });

    await new Promise(resolve => readStream.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitle = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitle.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
