import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-coin-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, FormsModule, MatInputModule],
  templateUrl: './edit-coin-dialog.html',
})
export class EditCoinDialog {
  newAmount: number;
  newTotalUsd: number;
  avgPrice: number;

  constructor(
    public dialogRef: MatDialogRef<EditCoinDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.newAmount = data.amount;
    this.avgPrice = data.totalUsd / data.amount;
    this.newTotalUsd = data.totalUsd;
  }

  updateTotal() {
    if (!this.newAmount || this.newAmount < 1) {
      this.newTotalUsd = 0;
      return;
    }

    this.newTotalUsd = this.newAmount * this.avgPrice;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(input: any): void {
    if (input.invalid || this.newAmount < 1) {
      return;
    }

    this.dialogRef.close({
      amount: this.newAmount,
      totalUsd: this.newTotalUsd,
    });
  }
}
