import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { appSettings } from "./app.settings"


async function bootstrap() {

  const app = await NestFactory.create(AppModule)

  appSettings(app)

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 5000);
  await app.listen(port)
}

bootstrap()
