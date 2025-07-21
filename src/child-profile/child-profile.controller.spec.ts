import { Test, TestingModule } from '@nestjs/testing';
import { ChildProfileController } from './child-profile.controller';
import { ChildProfileService } from './child-profile.service';

describe('ChildProfileController', () => {
  let controller: ChildProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildProfileController],
      providers: [ChildProfileService],
    }).compile();

    controller = module.get<ChildProfileController>(ChildProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
