import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// Global so the applications module can use it without extra wiring.
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
