import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { minutes, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AuthModule } from "./auth/auth.module.js";
import { AuthThrottlerGuard } from "./auth/auth-throttler.guard.js";
import { getEnv } from "./config/env.js";
import { HealthController } from "./health.controller.js";
import { createPinoHttpOptions } from "./logging/logger.config.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => ({ pinoHttp: createPinoHttpOptions(getEnv()) }),
    }),
    ThrottlerModule.forRoot([{ ttl: minutes(1), limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AuthThrottlerGuard }],
})
export class AppModule {}
