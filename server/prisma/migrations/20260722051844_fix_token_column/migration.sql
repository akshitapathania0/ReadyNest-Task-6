-- DropIndex
DROP INDEX `RefreshToken_token_idx` ON `refreshtoken`;

-- DropIndex
DROP INDEX `RefreshToken_token_key` ON `refreshtoken`;

-- AlterTable
ALTER TABLE `refreshtoken` MODIFY `token` VARCHAR(500) NOT NULL;

-- CreateIndex
CREATE INDEX `RefreshToken_token_idx` ON `RefreshToken`(`token`(255));
