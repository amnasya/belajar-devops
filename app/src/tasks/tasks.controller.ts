import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './task.entity.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(): Promise<Task[]> {
    return this.tasks.findAll();
  }

  @Post()
  create(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasks.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto): Promise<Task> {
    return this.tasks.setDone(id, dto.done);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tasks.remove(id);
  }
}
