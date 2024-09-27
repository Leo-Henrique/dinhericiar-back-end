import fastifyCookie from "@fastify/cookie";
import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";

@Module({})
export class FastifyCookieEventModule implements OnApplicationBootstrap {
  constructor(private httpAdapterHost: HttpAdapterHost<FastifyAdapter>) {}

  onApplicationBootstrap() {
    const app = this.httpAdapterHost.httpAdapter.getInstance();

    app.register(fastifyCookie);
  }
}
