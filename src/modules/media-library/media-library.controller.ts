import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { LogAction } from "../../common/decorators/log-action.decorator";
import { MediaLibraryService } from "./media-library.service";
import { CreateMediaDto, UpdateMediaDto } from "../../common/dto/shared.dto";

@Controller("media")
export class MediaLibraryController {
  constructor(private readonly service: MediaLibraryService) {}

  @Public()
  @Get()
  findPublished(@Query("track") track?: string, @Query("level") level?: string) {
    return this.service.findPublished(track, level);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/all")
  findAllForAdmin() {
    return this.service.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post()
  @LogAction("إضافة فيديو/بث جديد")
  create(@Body() body: CreateMediaDto) {
    return this.service.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Put(":id")
  @LogAction("تعديل عنصر ميديا")
  update(@Param("id") id: string, @Body() body: UpdateMediaDto) {
    return this.service.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @LogAction("حذف عنصر ميديا")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
