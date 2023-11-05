import { MigrationInterface, QueryRunner } from "typeorm"  
  
class changeProductVariant1697941642532 implements MigrationInterface {  
 public async up(queryRunner: QueryRunner): Promise<void> {  
 await queryRunner.query(  
 "ALTER TABLE \"product_variant\"" +   
 " ADD COLUMN \"product_medias\" text"  
 )  
 }  
  
 public async down(queryRunner: QueryRunner): Promise<void> {  
 await queryRunner.query(  
 "ALTER TABLE \"product_variant\" DROP COLUMN \"product_medias\""  
 )  
 }  
}  
  
export default changeProductVariant1697941642532 