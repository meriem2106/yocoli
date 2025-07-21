import { Test, TestingModule } from '@nestjs/testing';
import { ChildProfileService } from './child-profile.service';

describe('ChildProfileService', () => {
  let service: ChildProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChildProfileService],
    }).compile();

    service = module.get<ChildProfileService>(ChildProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
