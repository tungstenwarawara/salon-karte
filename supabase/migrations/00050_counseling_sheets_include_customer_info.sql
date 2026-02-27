-- カウンセリングシート発行時に顧客情報入力を含めるかどうかのフラグ
ALTER TABLE counseling_sheets ADD COLUMN include_customer_info boolean NOT NULL DEFAULT false;
