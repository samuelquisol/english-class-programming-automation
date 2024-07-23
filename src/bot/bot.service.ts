import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  private readonly loginUrl = process.env.LOGIN_URL;
  private readonly bookingUrl = process.env.BOOKING_URL;
  private readonly usuario = process.env.USUARIO;
  private readonly contrasena = process.env.CONTRASENA;
  private readonly sede = process.env.SEDE;
  private readonly horarios = JSON.parse(process.env.HORARIOS || '[]');

  async login(page: puppeteer.Page) {
    try {
      this.logger.log('\n🔐 Accediendo al portal de login...\n');
      await page.goto(this.loginUrl);
      await page.type('#username', this.usuario);
      await page.type('#password', this.contrasena);
      await page.click('#login-button');
      await page.waitForNavigation();
      this.logger.log('\n✅ Login exitoso.\n\n');
    } catch (error) {
      this.logger.error(`\n❌ Error durante el login: \n${error.message}\n`);
      throw error;
    }
  }

  async seleccionarSede(page: puppeteer.Page) {
    try {
      this.logger.log('🏢 Seleccionando la sede...');
      await page.goto(this.bookingUrl);
      await page.waitForSelector('#location-selector');
      await page.select('#location-selector', this.sede);
      this.logger.log('\n📍 Sede seleccionada.\n\n');
    } catch (error) {
      this.logger.error(
        `\n❌ Error al seleccionar la sede: \n${error.message}\n`,
      );
      throw error;
    }
  }

  async reservarClase(page: puppeteer.Page, dia: string, hora: string) {
    try {
      this.logger.log(`🕒 Reservando clase para ${dia} a las ${hora}...`);
      await page.goto(this.bookingUrl);
      await page.select('#day-selector', dia);
      await page.select('#time-selector', hora);
      await page.click('#reserve-button');
      await page.waitForSelector('#confirmation-selector');
      this.logger.log(`\n✅ Clase reservada para ${dia} a las ${hora}\n`);
    } catch (error) {
      this.logger.error(
        `\n❌ Error reservando la clase para ${dia} a las ${hora}: \n${error.message}\n`,
      );
      throw error;
    }
  }

  async programarReservas() {
    this.logger.log(
      '\n\n----------------------------------------------------\n\n🔄 Iniciando el proceso de programación de reservas...\n',
    );
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await this.login(page);
      await this.seleccionarSede(page);

      for (const item of this.horarios) {
        const dia = item.dia;
        for (const hora of item.horas) {
          try {
            await this.reservarClase(page, dia, hora);
          } catch (error) {
            this.logger.error(
              `\n❌ Error reservando la clase para ${dia} a las ${hora}: \n${error.message}\n`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `\n❌ Error en el proceso de programación de reservas: \n${error.message}\n`,
      );
    } finally {
      await browser.close();
      this.logger.log('\n✔️ Proceso de programación de reservas finalizado.\n');
    }
  }

  @Cron('*/1 * * * *', { timeZone: process.env.TIMEZONE || 'America/Bogota' }) // Cron de Pruebas
  @Cron('0 15 * * 1-3', { timeZone: process.env.TIMEZONE || 'America/Bogota' })
  @Cron('30 16 * * 1-3', { timeZone: process.env.TIMEZONE || 'America/Bogota' })
  @Cron('30 16 * * 5', { timeZone: process.env.TIMEZONE || 'America/Bogota' })
  @Cron('15 8 * * 6', { timeZone: process.env.TIMEZONE || 'America/Bogota' })
  @Cron('45 9 * * 6', { timeZone: process.env.TIMEZONE || 'America/Bogota' })
  @Cron('15 11 * * 6', { timeZone: process.env.TIMEZONE || 'America/Bogota' })
  handleCron() {
    this.programarReservas();
  }
}
