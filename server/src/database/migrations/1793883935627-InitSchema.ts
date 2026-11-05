import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1793883935627 implements MigrationInterface {
  name = 'InitSchema1793883935627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "birthDate" date NOT NULL, "citizenship" character varying NOT NULL, "passportNumber" character varying NOT NULL, "consent" boolean NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "postalCode" character varying NOT NULL, "public_id" character varying NOT NULL, "password" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
