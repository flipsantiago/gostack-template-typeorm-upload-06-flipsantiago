import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<{}> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Incorrect email/password combination', 401);
    }

    await transactionsRepository.remove(transaction);

    return {};
  }
}

export default DeleteTransactionService;
