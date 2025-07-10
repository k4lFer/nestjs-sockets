import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
//import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
   
  //  TypeOrmModule.forRootAsync({
  //    imports: [ConfigModule],
  //    inject: [ConfigService],
  //    useFactory: (configService: ConfigService) => ({
  //      type: 'mariadb',
  //      host: configService.get<string>('mariadb.host'),
  //      port: configService.get<number>('mariadb.port'),
  //      username: configService.get<string>('mariadb.username'),
  //      password: configService.get<string>('mariadb.password'),
  //      database: configService.get<string>('mariadb.database'),
        //entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  //      synchronize: true, 
  //    }),
  //  }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        dbName: configService.get<string>('mongodb.database'),
      }),
    }),
  ],
})
export class DatabaseModule {}
