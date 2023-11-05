import { MigrationInterface, QueryRunner } from "typeorm"

export class ProductMediaCreate1698565796042 implements MigrationInterface {
        public async up(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query(`ALTER TABLE "product_media" ALTER COLUMN "mime_type" DROP NOT NULL`)
            await queryRunner.query(`ALTER TABLE "product_media" ADD CONSTRAINT "FK_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE`)
        }
    
        public async down(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query(`ALTER TABLE "product_media" ALTER COLUMN "mime_type" SET NOT NULL`)
            await queryRunner.query(`ALTER TABLE "product_media" DROP CONSTRAINT "FK_variant_id"`)
        }
    }
    
