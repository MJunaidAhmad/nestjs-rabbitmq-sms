import { Controller, Get, Render } from '@nestjs/common';

@Controller('portal')
export class HomeController {
  @Get()
  @Render('pages/home.hbs')
  root() {
    return { message: 'Welcome to communication service portal 📣🎤📨' };
  }
}
