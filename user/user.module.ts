import { Module } from "@nestjs/common";
import { UserInterceptor } from "./user.interceptor";

@Module({
    controllers: [],
    providers: [UserInterceptor]
})
export class UserModule { }
