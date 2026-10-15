import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: 'date' }) // database handles it properly
  birthDate!: Date;

  @Column()
  citizenship!: string;

  @Column()
  passportNumber!: string;

  @Column()
  consent!: boolean;
}
