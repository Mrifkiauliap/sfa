import { Test, TestingModule } from '@nestjs/testing';
import { RdfController } from './rdf.controller';

describe('RdfController', () => {
  let controller: RdfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RdfController],
    }).compile();

    controller = module.get<RdfController>(RdfController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
