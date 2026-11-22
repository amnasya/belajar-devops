import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { Task } from './task.entity.js';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly repo: Repository<Task>) {}

  findAll(): Promise<Task[]> {
    return this.repo.find({ order: { createdAt: 'DESC', id: 'DESC' } });
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.repo.save(this.repo.create({ title: dto.title }));
  }

  async setDone(id: number, done: boolean): Promise<Task> {
    const task = await this.repo.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task ${id} tidak ditemukan`);
    task.done = done;
    return this.repo.save(task);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException(`Task ${id} tidak ditemukan`);
  }
}
