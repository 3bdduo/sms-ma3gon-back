import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../../common/decorators/current-user.decorator";
import { LogAction } from "../../common/decorators/log-action.decorator";
import { EduAttendanceService } from "./edu-attendance.service";
import { RecordEduAttendanceDto } from "../../common/dto/shared.dto";

@Controller("edu-attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "teacher")
export class EduAttendanceController {
  constructor(private readonly service: EduAttendanceService) {}

  @Post(":eduGroupId")
  @LogAction("تسجيل حضور مجموعة تعليمية")
  record(
    @CurrentUser() user: CurrentUserPayload,
    @Param("eduGroupId") eduGroupId: string,
    @Body() body: RecordEduAttendanceDto,
  ) {
    return this.service.record(user, eduGroupId, body.date, body.records);
  }

  @Get(":eduGroupId")
  find(
    @CurrentUser() user: CurrentUserPayload,
    @Param("eduGroupId") eduGroupId: string,
    @Query("date") date?: string,
    @Query("studentId") studentId?: string,
  ) {
    return this.service.find(user, eduGroupId, date, studentId);
  }
}
