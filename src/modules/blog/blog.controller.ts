import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { LogAction } from "../../common/decorators/log-action.decorator";
import { BlogService } from "./blog.service";
import { CreateBlogDto, UpdateBlogDto } from "../../common/dto/shared.dto";

@Controller("blog")
export class BlogController {
  constructor(private readonly service: BlogService) {}

  @Public()
  @Get()
  findPublished(@Query("category") category?: string) {
    return this.service.findPublished(category);
  }

  @Public()
  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
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
  @LogAction("إضافة مقال جديد")
  create(@Body() body: CreateBlogDto) {
    return this.service.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Put(":id")
  @LogAction("تعديل مقال")
  update(@Param("id") id: string, @Body() body: UpdateBlogDto) {
    return this.service.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @LogAction("حذف مقال")
  async remove(@Param("id") id: string) {
    await this.service.remove(id);
  }
}
