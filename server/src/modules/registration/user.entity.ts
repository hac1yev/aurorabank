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

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column()
  city!: string;

  @Column()
  country!: string;

  @Column()
  postalCode!: string;

  @Column()
  public_id!: string;

  @Column()
  password!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
