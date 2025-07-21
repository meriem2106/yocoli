import { Test, TestingModule } from '@nestjs/testing';
import { FigureController } from './figure.controller';
import { FigureService } from './figure.service';

describe('FigureController', () => {
  let controller: FigureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FigureController],
      providers: [FigureService],
    }).compile();

    controller = module.get<FigureController>(FigureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
