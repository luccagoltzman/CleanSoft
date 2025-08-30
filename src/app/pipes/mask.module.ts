import { NgModule } from '@angular/core';
import { CpfMaskPipe, CnpjMaskPipe, PhoneMaskPipe } from './masks.pipe';

@NgModule({
  declarations: [CpfMaskPipe, CnpjMaskPipe, PhoneMaskPipe],
  exports: [CpfMaskPipe, CnpjMaskPipe, PhoneMaskPipe]
})
export class PipesModule {}
