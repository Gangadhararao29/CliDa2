import { TestBed } from '@angular/core/testing';

import { ClientDataServiceService } from './client-data-service.service';

describe('ClientDataServiceService', () => {
  let service: ClientDataServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientDataServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
